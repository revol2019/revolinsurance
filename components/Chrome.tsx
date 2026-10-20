'use client';

import Link from 'next/link';
import { useState } from 'react';
import { AGENCY, ADDRESS_LINES } from '@/lib/agency';

export function Wordmark({ onDark = false }: { onDark?: boolean }) {
  return (
    <Link
      href="/"
      style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: 3,
        textDecoration: 'none',
        color: onDark ? '#fff' : 'var(--ink)',
      }}
    >
      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, letterSpacing: '0.22em' }}>
        REVOL
      </span>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--blue)', display: 'inline-block' }} />
      <span
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 500,
          fontSize: 10.5,
          letterSpacing: '0.2em',
          color: onDark ? 'var(--on-dark-2)' : 'var(--muted)',
          marginLeft: 8,
        }}
      >
        INSURANCE
      </span>
    </Link>
  );
}

const NAV = [
  { href: '/#personal', label: 'Personal' },
  { href: '/#business', label: 'Business' },
  { href: '/#life', label: 'Life & Health' },
  { href: '/#carriers', label: 'Carriers' },
  { href: '/agents', label: 'Find an agent' },
];

export function Nav() {
  const [open, setOpen] = useState(false);

  return (
    <header style={{ borderBottom: '1px solid var(--line)', background: 'var(--paper)', position: 'relative', zIndex: 20 }}>
      <div
        className="shell"
        style={{
          paddingTop: 14,
          paddingBottom: 14,
          minHeight: 48,
          display: 'flex',
          alignItems: 'center',
          gap: 'clamp(16px, 3vw, 40px)',
        }}
      >
        <Wordmark />

        <nav className="desktop-nav" style={{ marginLeft: 'auto', gap: 26, alignItems: 'center' }}>
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              style={{ textDecoration: 'none', color: 'var(--ink-2)', fontSize: 15, fontWeight: 500 }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginLeft: 'auto' }}>
          <a
            className="agent-login"
            href="https://revolteam.com"
            style={{ textDecoration: 'none', color: 'var(--muted)', fontSize: 15, fontWeight: 600, whiteSpace: 'nowrap' }}
          >
            Agent login
          </a>
          <Link href="/quote" className="btn btn-primary btn-sm">Get a quote</Link>
          <button
            type="button"
            className="menu-btn"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            style={{
              width: 44,
              height: 44,
              border: '1px solid var(--line-2)',
              borderRadius: 10,
              background: 'var(--paper)',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--ink-2)" strokeWidth="1.9" strokeLinecap="round" aria-hidden="true">
              {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <div className="mobile-nav" style={{ borderTop: '1px solid var(--line)', background: 'var(--paper)' }}>
          <div className="shell" style={{ paddingTop: 8, paddingBottom: 16, display: 'flex', flexDirection: 'column' }}>
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                style={{
                  textDecoration: 'none',
                  color: 'var(--ink-2)',
                  fontSize: 17,
                  fontWeight: 500,
                  padding: '14px 0',
                  borderBottom: '1px solid var(--line)',
                }}
              >
                {item.label}
              </Link>
            ))}
            <a
              href="https://revolteam.com"
              style={{ textDecoration: 'none', color: 'var(--muted)', fontSize: 17, fontWeight: 600, padding: '14px 0' }}
            >
              Agent login
            </a>
          </div>
        </div>
      )}

      <style jsx>{`
        .desktop-nav { display: flex; }
        .menu-btn { display: none; }
        .mobile-nav { display: none; }
        @media (max-width: 900px) {
          .desktop-nav { display: none; }
          .menu-btn { display: flex; }
          .mobile-nav { display: block; }
        }
        @media (max-width: 560px) {
          .agent-login { display: none; }
        }
      `}</style>
    </header>
  );
}

const FOOTER_COLS = [
  {
    title: 'Coverage',
    links: [
      { href: '/#personal', label: 'Home' },
      { href: '/#personal', label: 'Auto' },
      { href: '/#business', label: 'Business' },
      { href: '/#life', label: 'Life & health' },
    ],
  },
  {
    title: 'Company',
    links: [
      { href: '/agents', label: 'Find an agent' },
      { href: '/#carriers', label: 'Carriers' },
      { href: '/#contact', label: 'Contact' },
    ],
  },
  {
    title: 'Clients',
    links: [
      { href: '/claims', label: 'Report a claim' },
      { href: '/quote', label: 'Start a quote' },
      { href: 'https://revolteam.com', label: 'Agent login' },
    ],
  },
];

export function Footer() {
  return (
    <footer style={{ background: 'var(--ground)', borderTop: '1px solid var(--line)' }}>
      <div className="shell" style={{ paddingTop: 'clamp(40px, 4.5vw, 56px)', paddingBottom: 40 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'clamp(28px, 4vw, 48px)', justifyContent: 'space-between' }}>
          <div style={{ flex: '1 1 260px', minWidth: 0 }}>
            <div style={{ marginBottom: 14 }}><Wordmark /></div>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: 'var(--muted)', maxWidth: '38ch' }}>
              An independent insurance agency. Part of the REVOL family of companies.
            </p>
            <address style={{ margin: '14px 0 0', fontSize: 14, color: 'var(--muted)', fontStyle: 'normal', lineHeight: 1.7 }}>
              {ADDRESS_LINES.map((line) => (
                <span key={line} style={{ display: 'block' }}>{line}</span>
              ))}
              <a href={`tel:${AGENCY.phoneHref}`} style={{ color: 'var(--muted)', textDecoration: 'none' }}>{AGENCY.phone}</a>
              <br />
              <a href={`mailto:${AGENCY.email}`} style={{ color: 'var(--muted)', textDecoration: 'none' }}>{AGENCY.email}</a>
            </address>
          </div>

          {FOOTER_COLS.map((col) => (
            <div key={col.title} style={{ flex: '1 1 140px', minWidth: 0 }}>
              <div className="eyebrow" style={{ color: 'var(--muted-2)', marginBottom: 14 }}>{col.title}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9, fontSize: 14.5 }}>
                {col.links.map((l) => (
                  <Link key={l.label} href={l.href} style={{ textDecoration: 'none', color: 'var(--ink-2)' }}>
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            marginTop: 36,
            paddingTop: 22,
            borderTop: '1px solid var(--line)',
            display: 'flex',
            flexWrap: 'wrap',
            gap: 14,
            justifyContent: 'space-between',
            fontSize: 13,
            color: 'var(--muted-2)',
          }}
        >
          <div>
            © {new Date().getFullYear()} {AGENCY.legalName}. Agency NPN {AGENCY.npn}
            {AGENCY.licenses.map((l) => ` · ${l.state} Lic. No. ${l.number}`).join('')}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18 }}>
            <Link href="/privacy" style={{ textDecoration: 'none', color: 'var(--muted-2)' }}>Privacy</Link>
            <Link href="/terms" style={{ textDecoration: 'none', color: 'var(--muted-2)' }}>Terms</Link>
            <Link href="/accessibility" style={{ textDecoration: 'none', color: 'var(--muted-2)' }}>Accessibility</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
