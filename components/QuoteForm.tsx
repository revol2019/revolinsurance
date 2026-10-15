'use client';

import { useState } from 'react';

export type QuoteFormProps = {
  /** Producer slug when the form sits on a producer page; omit for agency-level forms. */
  producerSlug?: string;
  producerName?: string;
  variant: 'pc' | 'life' | 'short';
  source: string;
};

type Status = 'idle' | 'sending' | 'sent' | 'error';

/** The disclosure below quotes this label verbatim. Change both or neither. */
export const SUBMIT_LABEL = 'Get My Free Insurance Quotes';

/** Stored verbatim on every lead so there is a record of what was agreed to. */
export const CONSENT_TEXT =
  `By clicking "${SUBMIT_LABEL}," I authorize REVOL Financial Group, LLC to contact me by phone or email ` +
  'regarding my insurance quote request and to share my submitted information with participating insurance ' +
  'carriers and authorized partners for the purpose of obtaining insurance quotes.';

const PC_LINES = ['Home', 'Auto', 'Umbrella', 'Flood', 'Business'];
const LIFE_LINES = ['Mortgage protection', 'Term or whole life', 'Medicare', 'Final expense'];

export default function QuoteForm({ producerSlug, producerName, variant, source }: QuoteFormProps) {
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);

  const green = variant === 'life';

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('sending');
    setError(null);

    const form = new FormData(e.currentTarget);
    const payload = {
      source,
      producerSlug: producerSlug ?? null,
      variant,
      firstName: String(form.get('firstName') ?? ''),
      lastName: String(form.get('lastName') ?? ''),
      email: String(form.get('email') ?? ''),
      phone: String(form.get('phone') ?? ''),
      address: String(form.get('address') ?? ''),
      zip: String(form.get('zip') ?? ''),
      timing: String(form.get('timing') ?? ''),
      note: String(form.get('note') ?? ''),
      lines: form.getAll('lines').map(String),
      // Consent is captured by the act of submitting, per the approved
      // disclosure shown beneath the button.
      consent: true,
      consentText: CONSENT_TEXT,
      // Honeypot: real people leave this empty.
      company: String(form.get('company') ?? ''),
    };

    try {
      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
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
      <div
        style={{
          background: green ? 'var(--green-soft)' : 'var(--blue-soft)',
          border: `1px solid ${green ? '#BFD9CC' : '#C3D7F5'}`,
          borderRadius: 16,
          padding: 'clamp(24px, 3vw, 36px)',
        }}
      >
        <h3 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Got it.</h3>
        <p style={{ margin: 0, fontSize: 16, lineHeight: 1.6, color: 'var(--ink-2)' }}>
          {producerName ? `${producerName} has` : 'A licensed producer has'} your request and will be in touch.
          If it is urgent, call rather than wait on email.
        </p>
      </div>
    );
  }

  const lines = variant === 'life' ? LIFE_LINES : PC_LINES;

  return (
    <form onSubmit={onSubmit} className="form-grid">
      {/* Honeypot — hidden from people, catches the simplest bots. */}
      <div style={{ position: 'absolute', left: -9999, width: 1, height: 1, overflow: 'hidden' }} aria-hidden="true">
        <label htmlFor={`company-${source}`}>Company</label>
        <input id={`company-${source}`} name="company" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div>
        <label htmlFor={`first-${source}`}>First name</label>
        <input id={`first-${source}`} name="firstName" type="text" required autoComplete="given-name" />
      </div>
      <div>
        <label htmlFor={`last-${source}`}>Last name</label>
        <input id={`last-${source}`} name="lastName" type="text" required autoComplete="family-name" />
      </div>
      <div>
        <label htmlFor={`email-${source}`}>Email</label>
        <input id={`email-${source}`} name="email" type="email" required autoComplete="email" />
      </div>
      <div>
        <label htmlFor={`phone-${source}`}>Mobile</label>
        <input id={`phone-${source}`} name="phone" type="tel" required autoComplete="tel" />
      </div>

      {variant !== 'life' && (
        <div className="span-2">
          <label htmlFor={`address-${source}`}>Property address</label>
          <input
            id={`address-${source}`}
            name="address"
            type="text"
            autoComplete="street-address"
            placeholder="Street, city, ZIP"
          />
        </div>
      )}

      <div className="span-2">
        <span style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--ink-2)', marginBottom: 8 }}>
          {variant === 'life' ? 'What brings you here?' : 'What should I quote?'}
        </span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {lines.map((line) => (
            <label key={line} className="checkline" htmlFor={`${source}-${line}`}>
              <input id={`${source}-${line}`} name="lines" type="checkbox" value={line} />
              {line}
            </label>
          ))}
        </div>
      </div>

      {variant === 'pc' && (
        <div className="span-2">
          <label htmlFor={`timing-${source}`}>When do you need it?</label>
          <select id={`timing-${source}`} name="timing" defaultValue="">
            <option value="" disabled>Choose one</option>
            <option>I am under contract — settlement coming up</option>
            <option>My renewal is coming up</option>
            <option>Just shopping my current rate</option>
          </select>
        </div>
      )}

      {variant === 'life' && (
        <div className="span-2">
          <label htmlFor={`note-${source}`}>
            Anything I should know first? <span style={{ fontWeight: 400, color: 'var(--muted-2)' }}>(optional)</span>
          </label>
          <textarea
            id={`note-${source}`}
            name="note"
            rows={3}
            placeholder="Who depends on you, and what would need to be covered."
          />
        </div>
      )}

      {error && (
        <p className="span-2" role="alert" style={{ margin: 0, color: '#A3202C', fontSize: 14 }}>
          {error}
        </p>
      )}

      <button
        type="submit"
        className={`btn span-2 ${green ? 'btn-green' : 'btn-primary'}`}
        disabled={status === 'sending'}
        style={{ opacity: status === 'sending' ? 0.6 : 1 }}
      >
        {status === 'sending' ? 'Sending…' : SUBMIT_LABEL}
      </button>

      {/*
        Consent is given by the act of clicking the submit button, exactly as the
        approved wording states. Do not change SUBMIT_LABEL without changing this
        sentence to match — the disclosure names the button by its label, so the
        two have to stay in sync.
      */}
      <p className="span-2" style={{ margin: 0, fontSize: 12.5, lineHeight: 1.55, color: 'var(--muted-2)' }}>
        {CONSENT_TEXT}
      </p>
    </form>
  );
}
