'use client';

import { useState } from 'react';
import { CONSENT_TEXT, SUBMIT_LABEL } from '@/components/QuoteForm';
import { attribution, fmtPhone, track, type LandingContext } from './shared';

type Props = {
  ctx: LandingContext;
  /** Heading above the form. */
  title: string;
  intro: string;
  variant: 'pc' | 'life';
  /** What they asked to have quoted, for the email heads-up. */
  lines: string[];
  zip?: string;
  /** The tool's answers and results in plain English, for the producer. */
  summary: () => string[];
  /** For analytics: the quote type and its value. */
  trackParams?: Record<string, unknown>;
  onSent: (firstName: string) => void;
};

/**
 * The one contact form every tool uses. It posts to /api/lead with the tool's
 * summary, so the client record in REVOL Team says exactly what they priced,
 * and with the ad attribution for the visit. Consent is the approved wording,
 * given by clicking the button it names.
 */
export default function LeadGate({ ctx, title, intro, variant, lines, zip, summary, trackParams, onSent }: Props) {
  const [first, setFirst] = useState('');
  const [last, setLast] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const digits = phone.replace(/\D/g, '');
    if (!first.trim() || !last.trim()) return setMsg('Add your first and last name.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) return setMsg('That email does not look complete. Check for a typo.');
    if (digits.length !== 10) return setMsg('Enter a 10-digit phone number so your agent can reach you.');
    setMsg(null);
    setBusy(true);
    const honeypot = String(new FormData(e.currentTarget).get('company') ?? '');
    try {
      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: ctx.source,
          producerSlug: ctx.agent?.slug ?? null,
          variant,
          firstName: first.trim(),
          lastName: last.trim(),
          email: email.trim(),
          phone: '+1' + digits,
          zip: zip ?? '',
          lines,
          quote: { title: ctx.pageTitle, lines: summary() },
          attribution: attribution(),
          consent: true,
          consentText: CONSENT_TEXT,
          company: honeypot,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((json as { error?: string }).error ?? 'Something went wrong. Please call us instead.');
      track('generate_lead', { page: ctx.pageTitle, ...trackParams });
      onSent(first.trim());
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Something went wrong. Please call us instead.');
      setBusy(false);
    }
  }

  return (
    <div className="rc-panel" id="rc-contact">
      <div className="rc-eyebrow">Last step</div>
      <h2 className="rc-q" style={{ fontSize: 24 }}>{title}</h2>
      <p className="rc-help">{intro}</p>
      <form onSubmit={submit} noValidate>
        <div className="rc-grid2">
          <div className="field">
            <label htmlFor="rc-first">First name</label>
            <input id="rc-first" type="text" autoComplete="given-name" value={first} onChange={(e) => setFirst(e.target.value)} required />
          </div>
          <div className="field">
            <label htmlFor="rc-last">Last name</label>
            <input id="rc-last" type="text" autoComplete="family-name" value={last} onChange={(e) => setLast(e.target.value)} required />
          </div>
        </div>
        <div className="field">
          <label htmlFor="rc-email">Email</label>
          <input id="rc-email" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="field">
          <label htmlFor="rc-phone">Mobile phone</label>
          <input id="rc-phone" type="tel" autoComplete="tel" placeholder="(443) 555-0100" value={phone} onChange={(e) => setPhone(fmtPhone(e.target.value))} required />
        </div>
        {/* Honeypot: hidden from people, catches the simplest bots. */}
        <div style={{ position: 'absolute', left: -9999, width: 1, height: 1, overflow: 'hidden' }} aria-hidden="true">
          <label htmlFor="rc-company">Company</label>
          <input id="rc-company" name="company" type="text" tabIndex={-1} autoComplete="off" />
        </div>
        {msg ? (
          <p className="rc-msg" role="alert">{msg}</p>
        ) : null}
        <button className={`btn ${variant === 'life' ? 'btn-green' : 'btn-primary'} rc-block`} type="submit" disabled={busy}>
          {busy ? 'Sending…' : SUBMIT_LABEL}
        </button>
        {/* The approved disclosure names the button by its label; keep the two in step. */}
        <p className="rc-consent">{CONSENT_TEXT}</p>
      </form>
    </div>
  );
}
