/**
 * POST /api/formal-quote  (multipart/form-data)
 *
 * The formal quote path: the client's declarations page comes in as an upload
 * and goes out as an email attachment to the assigned producer.
 *
 * Deliberately no file storage. A dec page carries the client's address,
 * vehicles, drivers and coverage detail — parking that in a bucket means
 * securing the bucket, setting retention, and answering for it later. Emailing
 * it to the one producer who needs it and keeping no copy is the smaller
 * footprint, and it is the right default until the phase 2 document store
 * exists with real access control behind it.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getProducer } from '@/lib/producers';
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
  const producer = producerSlug ? getProducer(producerSlug) : null;

  // Validate the upload server-side too — the client check is a convenience,
  // not a control.
  const upload = form.get('decPage');
  let attachment: { filename: string; content: string } | null = null;

  if (upload && typeof upload !== 'string' && upload.size > 0) {
    if (upload.size > MAX_BYTES) {
      return NextResponse.json({ error: 'That file is over 10MB.' }, { status: 400 });
    }
    if (upload.type && !ALLOWED.includes(upload.type)) {
      return NextResponse.json({ error: 'Please attach a PDF or a photo.' }, { status: 400 });
    }
    const buf = Buffer.from(await upload.arrayBuffer());
    const safeName = (upload.name || 'declarations-page')
      .replace(/[^\w.\- ]+/g, '_')
      .slice(0, 120);
    attachment = { filename: safeName, content: buf.toString('base64') };
  }

  const lead = {
    receivedAt: new Date().toISOString(),
    kind: 'formal-quote',
    source: clean(form.get('source'), 80) || 'unknown',
    assignedTo: producer?.slug ?? null,
    firstName,
    lastName,
    email,
    phone,
    address: clean(form.get('address'), 240),
    currentCarrier: clean(form.get('currentCarrier'), 120),
    renewalDate: clean(form.get('renewalDate'), 60),
    hasDecPage: Boolean(attachment),
    consent: true,
    consentText: clean(form.get('consentText'), 1000),
  };

  const to = producer?.email || process.env.LEADS_FALLBACK_EMAIL || AGENCY.email;
  const problems: string[] = [];

  if (process.env.RESEND_API_KEY) {
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
          subject: `Formal quote — ${firstName} ${lastName}${producer ? ` (for ${producer.name})` : ' (unassigned)'}`,
          text: [
            `${firstName} ${lastName}`,
            `${email} · ${phone}`,
            lead.address && `Address: ${lead.address}`,
            lead.currentCarrier && `Current carrier: ${lead.currentCarrier}`,
            lead.renewalDate && `Renewal: ${lead.renewalDate}`,
            `Declarations page attached: ${attachment ? 'yes' : 'NO — follow up for it'}`,
            '',
            `Source: ${lead.source}`,
            `Assigned: ${producer ? producer.name : 'UNASSIGNED — route this one'}`,
            `Consent captured ${lead.receivedAt}: ${lead.consentText}`,
          ]
            .filter(Boolean)
            .join('\n'),
          attachments: attachment ? [attachment] : undefined,
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
    // Log the metadata only — never the attachment contents.
    console.error('[formal-quote] delivery problems:', problems.join(', '), JSON.stringify(lead));
  }

  return NextResponse.json({ ok: true });
}
