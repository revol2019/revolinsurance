'use client';

import { useState } from 'react';
import QuoteForm from './QuoteForm';
import FormalQuoteForm from './FormalQuoteForm';

/**
 * Two ways in, one block. Instant is the default because it converts; formal
 * is the one that actually wins the business, so it gets equal billing in the
 * tab rather than being buried further down the page.
 */

type Tab = 'instant' | 'formal';

export default function QuoteChooser({
  producerSlug,
  producerName,
  source,
}: {
  producerSlug?: string;
  producerName?: string;
  source: string;
}) {
  const [tab, setTab] = useState<Tab>('instant');

  const tabs: { id: Tab; label: string; blurb: string }[] = [
    { id: 'instant', label: 'Instant quote', blurb: 'A few details, a ballpark back the same day.' },
    { id: 'formal', label: 'Formal quote', blurb: 'Send your current policy and get a real comparison.' },
  ];

  return (
    <div>
      <div
        role="tablist"
        aria-label="Quote type"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10, marginBottom: 22 }}
      >
        {tabs.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              role="tab"
              id={`tab-${t.id}-${source}`}
              aria-selected={active}
              aria-controls={`panel-${t.id}-${source}`}
              type="button"
              onClick={() => setTab(t.id)}
              style={{
                textAlign: 'left',
                cursor: 'pointer',
                padding: '14px 16px',
                borderRadius: 12,
                border: `1px solid ${active ? 'var(--blue)' : 'var(--line-2)'}`,
                background: active ? 'var(--blue-soft)' : 'var(--paper)',
                minHeight: 48,
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 16,
                  fontWeight: 700,
                  color: active ? 'var(--blue)' : 'var(--ink)',
                }}
              >
                {t.label}
              </div>
              <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 3, lineHeight: 1.45 }}>{t.blurb}</div>
            </button>
          );
        })}
      </div>

      <div role="tabpanel" id={`panel-instant-${source}`} aria-labelledby={`tab-instant-${source}`} hidden={tab !== 'instant'}>
        <QuoteForm producerSlug={producerSlug} producerName={producerName} variant="pc" source={`${source}-instant`} />
      </div>

      <div role="tabpanel" id={`panel-formal-${source}`} aria-labelledby={`tab-formal-${source}`} hidden={tab !== 'formal'}>
        <FormalQuoteForm producerSlug={producerSlug} producerName={producerName} source={`${source}-formal`} />
      </div>
    </div>
  );
}
