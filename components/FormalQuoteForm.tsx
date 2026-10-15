'use client';

import { useRef, useState } from 'react';
import { SUBMIT_LABEL, CONSENT_TEXT } from './QuoteForm';

/**
 * The formal quote path.
 *
 * An instant quote is an estimate off a handful of fields. A formal quote is
 * priced off what the client is actually carrying today, which means we need
 * their declarations page. Two ways to get it:
 *
 *   1. They upload the PDF or a photo of it. Live now.
 *   2. Canopy Connect pulls it from their carrier login. Later build — the
 *      button is visibly disabled rather than hidden, so producers can show
 *      clients it is coming without it looking broken.
 */

const MAX_BYTES = 10 * 1024 * 1024;
const ACCEPT = '.pdf,.png,.jpg,.jpeg,.heic,.webp';
const ALLOWED = ['application/pdf', 'image/png', 'image/jpeg', 'image/heic', 'image/webp'];

type Status = 'idle' | 'sending' | 'sent' | 'error';

export default function FormalQuoteForm({
  producerSlug,
  producerName,
  source,
}: {
  producerSlug?: string;
  producerName?: string;
  source: string;
}) {
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) {
      setFileName(null);
      return;
    }
    if (f.size > MAX_BYTES) {
      setError('That file is over 10MB. A phone photo of each page usually comes in well under that.');
      e.target.value = '';
      setFileName(null);
      return;
    }
    if (f.type && !ALLOWED.includes(f.type)) {
      setError('Please attach a PDF or a photo (PNG, JPG, HEIC or WEBP).');
      e.target.value = '';
      setFileName(null);
      return;
    }
    setError(null);
    setFileName(f.name);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('sending');
    setError(null);

    const data = new FormData(e.currentTarget);
    data.set('source', source);
    data.set('producerSlug', producerSlug ?? '');
    data.set('consentText', CONSENT_TEXT);

    try {
      const res = await fetch('/api/formal-quote', { method: 'POST', body: data });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Something went wrong.');
      setStatus('sent');
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    }
  }

  if (status === 'sent') {
    return (
      <div style={{ background: 'var(--blue-soft)', border: '1px solid #C3D7F5', borderRadius: 16, padding: 'clamp(24px, 3vw, 36px)' }}>
        <h3 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Got your declarations page.</h3>
        <p style={{ margin: 0, fontSize: 16, lineHeight: 1.6, color: 'var(--ink-2)' }}>
          {producerName ?? 'A licensed producer'} will price this against what you are carrying now and come back
          with a line-by-line comparison, not just a number.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="form-grid">
      <div>
        <label htmlFor={`f-first-${source}`}>First name</label>
        <input id={`f-first-${source}`} name="firstName" type="text" required autoComplete="given-name" />
      </div>
      <div>
        <label htmlFor={`f-last-${source}`}>Last name</label>
        <input id={`f-last-${source}`} name="lastName" type="text" required autoComplete="family-name" />
      </div>
      <div>
        <label htmlFor={`f-email-${source}`}>Email</label>
        <input id={`f-email-${source}`} name="email" type="email" required autoComplete="email" />
      </div>
      <div>
        <label htmlFor={`f-phone-${source}`}>Mobile</label>
        <input id={`f-phone-${source}`} name="phone" type="tel" required autoComplete="tel" />
      </div>

      <div className="span-2">
        <label htmlFor={`f-address-${source}`}>Property address</label>
        <input id={`f-address-${source}`} name="address" type="text" autoComplete="street-address" placeholder="Street, city, ZIP" />
      </div>

      <div>
        <label htmlFor={`f-carrier-${source}`}>Current carrier</label>
        <input id={`f-carrier-${source}`} name="currentCarrier" type="text" placeholder="Who are you with now?" />
      </div>
      <div>
        <label htmlFor={`f-renewal-${source}`}>Renewal date</label>
        <input id={`f-renewal-${source}`} name="renewalDate" type="text" placeholder="Approximate is fine" />
      </div>

      {/* Upload */}
      <div className="span-2">
        <label htmlFor={`f-dec-${source}`}>Your declarations page</label>
        <p style={{ margin: '0 0 10px', fontSize: 13.5, lineHeight: 1.55, color: 'var(--muted)' }}>
          The dec page is the summary your carrier sends at renewal — it lists your coverages, limits and
          deductibles. A PDF or a clear phone photo both work. This is what lets us compare coverage instead of
          guessing at it.
        </p>
        <input
          ref={fileRef}
          id={`f-dec-${source}`}
          name="decPage"
          type="file"
          accept={ACCEPT}
          onChange={onFileChange}
          style={{
            width: '100%',
            fontSize: 15,
            padding: 13,
            border: '1px dashed var(--line-2)',
            borderRadius: 10,
            background: 'var(--paper)',
          }}
        />
        {fileName && (
          <p style={{ margin: '8px 0 0', fontSize: 13.5, color: 'var(--green)' }}>Attached: {fileName}</p>
        )}
      </div>

      {/* Canopy Connect — not wired yet, and says so. */}
      <div
        className="span-2"
        style={{
          border: '1px solid var(--line)',
          borderRadius: 12,
          padding: 16,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 12,
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--ground)',
        }}
      >
        <div style={{ minWidth: 0, flex: '1 1 260px' }}>
          <div style={{ fontWeight: 600, fontSize: 15 }}>Do not have it handy?</div>
          <p style={{ margin: '4px 0 0', fontSize: 13.5, lineHeight: 1.5, color: 'var(--muted)' }}>
            Soon you will be able to pull your current policy straight from your carrier instead of digging for
            the paperwork. Not available yet — please upload for now.
          </p>
        </div>
        <button
          type="button"
          disabled
          title="Canopy Connect integration ships in a later build"
          className="btn btn-sm"
          style={{ background: 'var(--line)', color: 'var(--muted-2)', cursor: 'not-allowed' }}
        >
          Import my policy · coming soon
        </button>
      </div>

      {error && (
        <p className="span-2" role="alert" style={{ margin: 0, color: '#A3202C', fontSize: 14 }}>
          {error}
        </p>
      )}

      <button
        type="submit"
        className="btn btn-primary span-2"
        disabled={status === 'sending'}
        style={{ opacity: status === 'sending' ? 0.6 : 1 }}
      >
        {status === 'sending' ? 'Uploading…' : SUBMIT_LABEL}
      </button>

      <p className="span-2" style={{ margin: 0, fontSize: 12.5, lineHeight: 1.55, color: 'var(--muted-2)' }}>
        {CONSENT_TEXT}
      </p>
    </form>
  );
}
