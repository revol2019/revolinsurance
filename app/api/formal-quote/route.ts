/**
 * POST /api/formal-quote  (multipart/form-data) — formal quote with dec page.
 *
 * With Supabase configured: the contact is created or matched in REVOL Team,
 * the dec page goes to the PRIVATE `client-documents` bucket, and the
 * producer's email is a heads-up with a link — no attachment. The document
 * lives in one access-controlled place instead of in inboxes.
 *
 * If the database write fails for any reason, the route falls back to
 * emailing the attachment, so a misconfiguration never loses a lead.
 *
 * Without Supabase: email with attachment, same as phase 1.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getProducer } from '@/lib/producers';
import { supabaseConfigured } from '@/lib/supabase-server';
import { intakeContact } from '@/lib/documents';
import { AGENCY } from '@/lib/agency';

export const runtime = 'nodejs';

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED = ['application/pdf', 'image/png', 'image/jpeg', 'image/heic', 'image/webp'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function clean(v: FormDataEntryValue | null, max = 500): string {
  return typeof v === 'string' ? v.trim().slice(0, max) : '';
}

export async function POST(req: NextRequest) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Bad request.' }, { status: 400 });
  }

  const firstName = clean(form.get('firstName'), 80);
  const lastName = clean(form.get('lastName'), 80);
  const email = clean(form.get('email'), 160).toLowerCase();
  const phone = clean(form.get('phone'), 40);

  if (!firstName || !lastName) {
    return NextResponse.json({ error: 'Please include your first and last name.' }, { status: 400 });
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'That email address does not look right.' }, { status: 400 });
  }
  if (phone.replace(/\D/g, '').length < 10) {
    return NextResponse.json({ error: 'Please include a phone number we can reach you on.' }, { status: 400 });
  }

  const producerSlug = clean(form.get('producerSlug'), 80);
  const producer = producerSlug ? await getProducer(producerSlug) : null;

  // Server-side validation — the browser check is a convenience, not a control.
  const upload = form.get('decPage');
  let file: { bytes: Buffer; name: string; mimeType: string } | null = null;
  if (upload && typeof upload !== 'string' && upload.size > 0) {
    if (upload.size > MAX_BYTES) return NextResponse.json({ error: 'That file is over 10MB.' }, { status: 400 });
    if (upload.type && !ALLOWED.includes(upload.type)) {
      return NextResponse.json({ error: 'Please attach a PDF or a photo.' }, { status: 400 });
    }
    file = {
      bytes: Buffer.from(await upload.arrayBuffer()),
      name: (upload.name || 'declarations-page').replace(/[^\w.\- ]+/g, '_').slice(0, 120),
      mimeType: upload.type || 'application/octet-stream',
    };
  }

  const source = clean(form.get('source'), 80) || 'web-formal';
  const address = clean(form.get('address'), 240);
  const currentCarrier = clean(form.get('currentCarrier'), 120);
  const renewalDate = clean(form.get('renewalDate'), 60);
  const consentText = clean(form.get('consentText'), 1000);
  const receivedAt = new Date().toISOString();
  const problems: string[] = [];

  // 1. Into REVOL Team, file into the private bucket.
  let contactId: string | null = null;
  let stored = false;
  if (supabaseConfigured()) {
    try {
      const result = await intakeContact({
        firstName,
        lastName,
        email,
        phone,
        address,
        currentCarrier,
        renewalDate,
        assignedTo: producer?.profileId ?? null,
        source,
        consentText,
        file,
      });
      contactId = result.contactId;
      stored = Boolean(result.documentId);
    } catch (err) {
      problems.push('supabase failed');
      console.error('[formal-quote] intake failed', err);
    }
  }

  // 2. Email. Attach the file ONLY if it did not make it into storage.
  const attachFile = file && !stored;
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
          subject: `Formal quote — ${firstName} ${lastName}${producer ? ` (for ${producer.name})` : ' (unassigned)'}`,
          text: [
            `${firstName} ${lastName}`,
            `${email} · ${phone}`,
            address ? `Address: ${address}` : null,
            currentCarrier ? `Current carrier: ${currentCarrier}` : null,
            renewalDate ? `Renewal: ${renewalDate}` : null,
            '',
            !file
              ? 'Declarations page: NOT provided — follow up for it.'
              : stored
                ? `Declarations page: stored securely. Open it in REVOL Team: https://revolteam.com/contacts/${contactId}`
                : 'Declarations page: attached (could not be stored — enter in REVOL Team manually).',
            '',
            `Source: ${source}`,
            `Assigned: ${producer ? producer.name : 'UNASSIGNED — route this one'}`,
            `Consent captured ${receivedAt}: ${consentText}`,
          ]
            .filter((l) => l !== null)
            .join('\n'),
          attachments: attachFile ? [{ filename: file!.name, content: file!.bytes.toString('base64') }] : undefined,
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
    // Metadata only — never the file contents.
    console.error(
      '[formal-quote] delivery problems:',
      problems.join(', '),
      JSON.stringify({ receivedAt, source, producer: producer?.slug ?? null, firstName, lastName, email, phone, hasFile: Boolean(file), stored, contactId }),
    );
  }

  return NextResponse.json({ ok: true });
}
