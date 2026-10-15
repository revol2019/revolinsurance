/**
 * POST /api/lead — instant quote requests.
 *
 * With Supabase configured, the lead becomes a contact in REVOL Team: assigned
 * to the producer whose page it came from, or dropped into the insurance
 * unassigned queue. The database trigger posts the in-app notification.
 * The email still goes out as a heads-up.
 *
 * Without Supabase, email is the only delivery — same as phase 1.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getProducer } from '@/lib/producers';
import { supabaseConfigured } from '@/lib/supabase-server';
import { intakeContact } from '@/lib/documents';
import { AGENCY } from '@/lib/agency';

export const runtime = 'nodejs';

type LeadPayload = {
  source?: string;
  producerSlug?: string | null;
  variant?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: string;
  zip?: string;
  timing?: string;
  note?: string;
  lines?: string[];
  consentText?: string;
  company?: string;
};

function clean(value: unknown, max = 500): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(req: NextRequest) {
  let body: LeadPayload;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Bad request.' }, { status: 400 });
  }

  // Honeypot. Return 200 so a bot cannot tell it was caught.
  if (clean(body.company)) return NextResponse.json({ ok: true });

  const firstName = clean(body.firstName, 80);
  const lastName = clean(body.lastName, 80);
  const email = clean(body.email, 160).toLowerCase();
  const phone = clean(body.phone, 40);

  if (!firstName || !lastName) {
    return NextResponse.json({ error: 'Please include your first and last name.' }, { status: 400 });
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'That email address does not look right.' }, { status: 400 });
  }
  if (phone.replace(/\D/g, '').length < 10) {
    return NextResponse.json({ error: 'Please include a phone number we can reach you on.' }, { status: 400 });
  }

  const producer = body.producerSlug ? await getProducer(clean(body.producerSlug, 80)) : null;
  const source = clean(body.source, 80) || 'web';
  const lines = Array.isArray(body.lines) ? body.lines.slice(0, 12).map((l) => clean(l, 60)).filter(Boolean) : [];
  const timing = clean(body.timing, 120);
  const note = clean(body.note, 2000);
  const address = clean(body.address, 240);
  const consentText = clean(body.consentText, 1000);
  const receivedAt = new Date().toISOString();
  const problems: string[] = [];

  // 1. Into REVOL Team.
  let contactId: string | null = null;
  if (supabaseConfigured()) {
    try {
      const result = await intakeContact({
        firstName,
        lastName,
        email,
        phone,
        address,
        assignedTo: producer?.profileId ?? null,
        source,
        consentText,
        notes: [
          lines.length > 0 && `Wants quoted: ${lines.join(', ')}`,
          timing && `Timing: ${timing}`,
          note && `Note: ${note}`,
        ]
          .filter(Boolean)
          .join('\n'),
      });
      contactId = result.contactId;
    } catch (err) {
      problems.push('supabase failed');
      console.error('[lead] intake failed', err);
    }
  }

  // 2. Email heads-up.
  const to = producer?.email || process.env.LEADS_FALLBACK_EMAIL || AGENCY.email;
  if (process.env.RESEND_API_KEY) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: process.env.RESEND_FROM ?? 'REVOL Insurance <onboarding@resend.dev>',
          to: [to],
          reply_to: email,
          subject: `New lead — ${firstName} ${lastName}${producer ? ` (for ${producer.name})` : ' (unassigned)'}`,
          text: [
            `${firstName} ${lastName}`,
            `${email} · ${phone}`,
            address && `Address: ${address}`,
            lines.length > 0 && `Wants quoted: ${lines.join(', ')}`,
            timing && `Timing: ${timing}`,
            note && `Note: ${note}`,
            '',
            contactId ? `In REVOL Team: https://revolteam.com/contacts/${contactId}` : 'Not yet in REVOL Team — enter manually.',
            `Source: ${source}`,
            `Assigned: ${producer ? producer.name : 'UNASSIGNED — route this one'}`,
            `Consent captured ${receivedAt}: ${consentText}`,
          ]
            .filter(Boolean)
            .join('\n'),
        }),
      });
      if (!res.ok) problems.push(`email ${res.status}`);
    } catch {
      problems.push('email failed');
    }
  } else {
    problems.push('email not configured');
  }

  if (problems.length > 0) {
    console.error(
      '[lead] delivery problems:',
      problems.join(', '),
      JSON.stringify({ receivedAt, source, producer: producer?.slug ?? null, firstName, lastName, email, phone, address, lines, timing, note, contactId }),
    );
  }

  return NextResponse.json({ ok: true });
}
