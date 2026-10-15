/**
 * POST /api/lead
 *
 * One entry point for every form on the site. Routing rule:
 *   - a lead from a producer page goes to that producer
 *   - a lead from a general page goes to the fallback inbox, unassigned
 *
 * When SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set, the lead is also
 * written to the leads table so REVOL Team owns the record. Until the phase 2
 * data layer exists, email alone is the delivery mechanism — which is fine to
 * launch on, but it means there is no unassigned queue and no audit trail yet.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getProducer } from '@/lib/producers';

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
  consent?: boolean;
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
  if (clean(body.company)) {
    return NextResponse.json({ ok: true });
  }

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
  const producer = body.producerSlug ? getProducer(clean(body.producerSlug, 80)) : null;

  const lead = {
    receivedAt: new Date().toISOString(),
    source: clean(body.source, 80) || 'unknown',
    variant: clean(body.variant, 20),
    assignedTo: producer?.slug ?? null,
    firstName,
    lastName,
    email,
    phone,
    address: clean(body.address, 240),
    zip: clean(body.zip, 20),
    timing: clean(body.timing, 120),
    note: clean(body.note, 2000),
    lines: Array.isArray(body.lines) ? body.lines.slice(0, 12).map((l) => clean(l, 60)) : [],
    // Consent is given by clicking the submit button, per the disclosure shown
    // beneath it. Store the exact wording with the lead so there is a record of
    // what this person agreed to on this date.
    consent: true,
    consentText: clean(body.consentText, 1000),
  };

  const to = producer?.email || process.env.LEADS_FALLBACK_EMAIL;
  const problems: string[] = [];

  // 1. Notify. This is the part that must not fail silently.
  if (process.env.RESEND_API_KEY && to) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM ?? 'REVOL Insurance <onboarding@resend.dev>',
          to: [to],
          reply_to: email,
          subject: `New lead — ${firstName} ${lastName}${producer ? ` (for ${producer.name})` : ' (unassigned)'}`,
          text: [
            `${firstName} ${lastName}`,
            `${email} · ${phone}`,
            lead.address && `Address: ${lead.address}`,
            lead.lines.length > 0 && `Wants quoted: ${lead.lines.join(', ')}`,
            lead.timing && `Timing: ${lead.timing}`,
            lead.note && `Note: ${lead.note}`,
            '',
            `Source: ${lead.source}`,
            `Assigned: ${producer ? producer.name : 'UNASSIGNED — route this one'}`,
            `Consent captured ${lead.receivedAt}: ${lead.consentText}`,
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

  // 2. Persist, when the data layer exists.
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const res = await fetch(`${process.env.SUPABASE_URL}/rest/v1/leads`, {
        method: 'POST',
        headers: {
          apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify(lead),
      });
      if (!res.ok) problems.push(`supabase ${res.status}`);
    } catch {
      problems.push('supabase failed');
    }
  }

  if (problems.length > 0) {
    // Always log the full lead so nothing is lost while delivery is misconfigured.
    console.error('[lead] delivery problems:', problems.join(', '), JSON.stringify(lead));
  }

  // A lead that reached the server is a lead we own. Never show the visitor an
  // error because our notification plumbing is down.
  return NextResponse.json({ ok: true });
}
