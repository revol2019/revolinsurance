'use client';

import { useEffect, useState } from 'react';
import { STATE_NAMES, zipState, type QuotePath, type StateCode } from '@/lib/rating';
import { openRateCheck } from './shared';

/** Any button that opens the rate check, optionally on a given path. */
export function RateButton({
  path,
  className = 'btn btn-primary',
  children,
}: {
  path?: QuotePath;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button type="button" className={className} onClick={() => openRateCheck({ path: path ?? null })}>
      {children}
    </button>
  );
}

/**
 * The hero starter: what are we pricing, and the ZIP. Opens the rate check
 * past the first two questions.
 */
export function ZipStart({
  paths,
  defaultPath,
  states,
  officePhone,
  title = 'What are we pricing?',
  button = 'Compare rates',
  id = 'starter',
}: {
  paths: QuotePath[];
  defaultPath: QuotePath;
  states: StateCode[];
  officePhone: string;
  title?: string;
  button?: string;
  id?: string;
}) {
  const [path, setPath] = useState<QuotePath>(defaultPath);
  const [zip, setZip] = useState('');
  const [msg, setMsg] = useState<string | null>(null);

  // An ad link with ?zip= fills the box.
  useEffect(() => {
    const z = (new URLSearchParams(location.search).get('zip') || '').replace(/\D/g, '').slice(0, 5);
    if (z) setZip(z);
  }, []);

  const st = zipState(zip);
  const inArea = !!st && st !== 'OUT' && (states.length === 0 || states.includes(st as StateCode));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!st) return setMsg('Enter a 5-digit ZIP to start.');
    if (!inArea) return setMsg(`We write in ${states.map((s) => STATE_NAMES[s]).join(', ')}. Moving here? Call ${officePhone} and we will price the new address.`);
    setMsg(null);
    openRateCheck({ path, zip });
  }

  const labels: Record<QuotePath, string> = { bundle: 'Home + Auto', auto: 'Auto', home: 'Home' };

  return (
    <form className="lp-starter" id={id} onSubmit={submit} noValidate>
      <div className="lp-starter-head">
        <h2>{title}</h2>
        <span>About 60 sec</span>
      </div>
      {paths.length > 1 ? (
        <div className="lp-seg" role="group" aria-label="What to price">
          {paths.map((p) => (
            <button type="button" key={p} aria-pressed={path === p} onClick={() => setPath(p)}>
              {labels[p]}
              {p === 'bundle' ? <small>Biggest savings</small> : null}
            </button>
          ))}
        </div>
      ) : null}
      <div className="lp-zip-row">
        <div className="lp-zip">
          <label htmlFor={`${id}-zip`}>ZIP code</label>
          <input
            id={`${id}-zip`}
            type="text"
            inputMode="numeric"
            maxLength={5}
            placeholder="21093"
            autoComplete="postal-code"
            value={zip}
            onChange={(e) => {
              setZip(e.target.value.replace(/\D/g, '').slice(0, 5));
              setMsg(null);
            }}
          />
          {st ? <span className={`lp-zip-st${inArea ? '' : ' bad'}`}>{inArea ? st : 'Out of area'}</span> : null}
        </div>
        <button className="btn btn-primary" type="submit">{button} <span aria-hidden="true">→</span></button>
      </div>
      {msg ? <p className="lp-starter-msg" role="alert">{msg}</p> : null}
      <ul className="lp-starter-notes">
        <li>No Social Security or license number needed</li>
        <li>Estimate first, contact details last</li>
      </ul>
    </form>
  );
}

/** A slim bar on phones between the hero starter and the closing one. */
export function StickyCta({ path, label }: { path: QuotePath; label: string }) {
  const [past, setPast] = useState(false);
  const [atEnd, setAtEnd] = useState(false);
  useEffect(() => {
    const top = document.getElementById('starter');
    const end = document.getElementById('final');
    if (!top || !('IntersectionObserver' in window)) return;
    const a = new IntersectionObserver(([e]) => setPast(!e.isIntersecting && e.boundingClientRect.top < 0));
    a.observe(top);
    const b = end ? new IntersectionObserver(([e]) => setAtEnd(e.isIntersecting)) : null;
    if (end && b) b.observe(end);
    return () => {
      a.disconnect();
      b?.disconnect();
    };
  }, []);
  const show = past && !atEnd;
  return (
    <div className={`lp-sticky${show ? ' show' : ''}`} aria-hidden={!show}>
      <button type="button" className="btn btn-primary" tabIndex={show ? 0 : -1} onClick={() => openRateCheck({ path })}>
        {label} <span aria-hidden="true">→</span>
      </button>
    </div>
  );
}
