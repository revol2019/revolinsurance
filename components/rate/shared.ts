'use client';

import type { QuotePath, StateCode } from '@/lib/rating';

/** What the browser needs to know about the producer behind a landing page. Nothing private. */
export type LandingAgent = {
  slug: string;
  name: string;
  first: string;
  phone: string;
  headshot: string | null;
  calendarUrl: string | null;
  npn: string;
  carriers: string[];
} | null;

/** Context every tool on a landing page shares. */
export type LandingContext = {
  agent: LandingAgent;
  /** Lead source written on the client record: producer-<slug>:<page> or web-<page>. */
  source: string;
  /** Which landing page, for the producer's note. */
  pageTitle: string;
  /** States this page quotes in. */
  states: StateCode[];
  /** Office phone when there is no producer. */
  officePhone: string;
};

export const RATE_EVENT = 'revol:rate-check';

export type RateOpen = { path?: QuotePath | null; zip?: string; dwelling?: string };

/** Opens the rate check from any button on the page. */
export function openRateCheck(detail: RateOpen = {}) {
  window.dispatchEvent(new CustomEvent<RateOpen>(RATE_EVENT, { detail }));
}

/** Analytics hooks. Harmless until Google Tag Manager or a pixel is added to the site. */
export function track(event: string, params: Record<string, unknown> = {}) {
  try {
    const w = window as unknown as { dataLayer?: unknown[]; gtag?: (...a: unknown[]) => void; fbq?: (...a: unknown[]) => void };
    (w.dataLayer = w.dataLayer || []).push({ event, ...params });
    if (typeof w.gtag === 'function') w.gtag('event', event, params);
    if (typeof w.fbq === 'function') w.fbq('trackCustom', event, params);
  } catch {
    /* tracking never breaks the page */
  }
}

const ATTR_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'gbraid', 'wbraid', 'fbclid', 'msclkid'];

/** First-touch ad attribution for this visit: UTMs, click IDs, landing page and referrer. */
export function attribution(): Record<string, string> {
  let saved: Record<string, string> = {};
  try {
    saved = JSON.parse(sessionStorage.getItem('revol_attr') || '{}');
  } catch {
    saved = {};
  }
  const qs = new URLSearchParams(location.search);
  for (const k of ATTR_KEYS) {
    const v = qs.get(k);
    if (v) saved[k] = v.slice(0, 200);
  }
  if (!saved.landingPage) saved.landingPage = location.href.split('#')[0].slice(0, 300);
  if (!saved.referrer && document.referrer) saved.referrer = document.referrer.slice(0, 300);
  try {
    sessionStorage.setItem('revol_attr', JSON.stringify(saved));
  } catch {
    /* private mode */
  }
  return saved;
}

export function fmtPhone(v: string) {
  const d = v.replace(/\D/g, '').replace(/^1/, '').slice(0, 10);
  if (d.length < 4) return d;
  if (d.length < 7) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

export const telHref = (phone: string) => 'tel:' + phone.replace(/[^\d+]/g, '');
