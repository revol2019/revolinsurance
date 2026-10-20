'use client';

import { useState } from 'react';
import { money } from '@/lib/rating';
import LeadGate from './LeadGate';
import { telHref, track, type LandingContext } from './shared';

const TERMS = [10, 15, 20, 25, 30];
const COLLEGE_PER_CHILD = 60000;
/** The family needs about this share of the income: the earner's own costs and taxes go away. */
const REPLACE = 0.75;

function dollars(v: string) {
  return Math.max(0, Math.min(50_000_000, Number(v.replace(/[^\d]/g, '')) || 0));
}
function Money({ id, label, value, onChange, hint }: { id: string; label: string; value: string; onChange: (v: string) => void; hint?: string }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="lp-money">
        <span aria-hidden="true">$</span>
        <input id={id} type="text" inputMode="numeric" value={value} onChange={(e) => onChange(e.target.value.replace(/[^\d,]/g, ''))} />
      </div>
      {hint ? <span className="rc-hint">{hint}</span> : null}
    </div>
  );
}

/**
 * How much life insurance: income replacement, the mortgage, debts, college
 * and final expenses, less what is already in place. It gives a coverage
 * amount and a term, never a premium: life prices on health and underwriting,
 * which the producer quotes.
 */
export default function LifeNeeds({ ctx }: { ctx: LandingContext }) {
  const [income, setIncome] = useState('85,000');
  const [years, setYears] = useState(15);
  const [mortgage, setMortgage] = useState('320,000');
  const [debts, setDebts] = useState('15,000');
  const [kids, setKids] = useState(2);
  const [finalExp, setFinalExp] = useState('15,000');
  const [existing, setExisting] = useState('100,000');
  const [savings, setSavings] = useState('25,000');
  const [gate, setGate] = useState(false);
  const [sent, setSent] = useState<string | null>(null);

  const parts = [
    { k: `75% of your income for ${years} years`, v: Math.round(dollars(income) * REPLACE) * years },
    { k: 'Pay off the mortgage', v: dollars(mortgage) },
    { k: 'Other debts', v: dollars(debts) },
    { k: `College${kids ? ` (${kids} × ${money(COLLEGE_PER_CHILD)})` : ''}`, v: kids * COLLEGE_PER_CHILD },
    { k: 'Final expenses', v: dollars(finalExp) },
  ];
  const gross = parts.reduce((t, p) => t + p.v, 0);
  const less = dollars(existing) + dollars(savings);
  const need = Math.max(0, gross - less);
  const rounded = Math.ceil(need / 50000) * 50000;
  const term = TERMS.find((t) => t >= years) ?? 30;
  const max = Math.max(1, ...parts.map((p) => p.v));
  const first = ctx.agent?.first;

  const summary = () => [
    `Life needs: ${money(rounded)} of coverage, ${term}-year term suggested`,
    `Income ${money(dollars(income))} at 75% × ${years} yrs = ${money(Math.round(dollars(income) * REPLACE) * years)}; mortgage ${money(dollars(mortgage))}; other debts ${money(dollars(debts))}; ${kids} child(ren) for college; final expenses ${money(dollars(finalExp))}`,
    `Already in place: life insurance ${money(dollars(existing))}, savings ${money(dollars(savings))}`,
  ];

  return (
    <div className="lp-life">
      <div className="lp-life-ctrl">
        <Money id="lf-income" label="Your yearly income" value={income} onChange={setIncome} hint="Before taxes. It counts 75% of it, since your own costs go away. If you both earn, run it for each." />
        <div className="field">
          <span className="rc-label" id="lf-years">Years your family would need it</span>
          <div className="rc-pills" role="group" aria-labelledby="lf-years">
            {[5, 10, 15, 20, 25, 30].map((y) => (
              <button type="button" key={y} aria-pressed={years === y} onClick={() => setYears(y)}>{y}</button>
            ))}
          </div>
          <span className="rc-hint">Usually until the youngest is through school, or the mortgage is paid.</span>
        </div>
        <div className="rc-grid2">
          <Money id="lf-mort" label="Mortgage balance" value={mortgage} onChange={setMortgage} />
          <Money id="lf-debt" label="Other debts" value={debts} onChange={setDebts} hint="Car loans, cards, student loans" />
        </div>
        <div className="field">
          <span className="rc-label" id="lf-kids">Children to put through college</span>
          <div className="rc-pills" role="group" aria-labelledby="lf-kids">
            {[0, 1, 2, 3, 4].map((n) => (
              <button type="button" key={n} aria-pressed={kids === n} onClick={() => setKids(n)}>{n}{n === 4 ? '+' : ''}</button>
            ))}
          </div>
        </div>
        <Money id="lf-final" label="Final expenses" value={finalExp} onChange={setFinalExp} />
        <div className="rc-grid2">
          <Money id="lf-have" label="Life insurance you already have" value={existing} onChange={setExisting} hint="Include coverage through work" />
          <Money id="lf-save" label="Savings you could draw on" value={savings} onChange={setSavings} />
        </div>
      </div>

      <div className="lp-life-out" aria-live="polite">
        <div className="lp-rebuild-lbl">Coverage to look at</div>
        <div className="lp-life-num">{money(rounded)}</div>
        <div className="lp-life-term">on a {term}-year term</div>
        <div className="lp-life-bars">
          {parts.map((p) => (
            <div key={p.k}>
              <span>{p.k}</span>
              <i aria-hidden="true"><em style={{ width: `${(p.v / max) * 100}%` }} /></i>
              <b>{money(p.v)}</b>
            </div>
          ))}
          <div className="less"><span>Less what is already in place</span><i aria-hidden="true" /><b>−{money(less)}</b></div>
        </div>
        {!gate && !sent ? (
          <button
            type="button"
            className="btn btn-green lp-block"
            onClick={() => {
              setGate(true);
              track('life_needs_quote_click', { coverage: rounded });
              setTimeout(() => document.getElementById('rc-contact')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 60);
            }}
          >
            Get real quotes for {money(rounded)} <span aria-hidden="true">→</span>
          </button>
        ) : null}
        <p className="lp-fine">A needs estimate, not a quote. What it costs depends on your age and health, which {first ?? 'your agent'} prices with the carriers.</p>
      </div>

      {gate && !sent ? (
        <div className="lp-life-gate">
          <LeadGate
            ctx={ctx}
            title={`Quotes for ${money(rounded)} of coverage`}
            intro={`${first ?? 'A licensed REVOL agent'} shops it across our life carriers and comes back with real prices. Health questions come later, by phone, not on a website.`}
            variant="life"
            lines={['Term or whole life']}
            summary={summary}
            trackParams={{ quote_type: 'life', value: rounded }}
            onSent={(n) => setSent(n)}
          />
        </div>
      ) : null}
      {sent ? (
        <div className="rc-done lp-life-gate">
          <h3>Thanks, {sent}.</h3>
          <p>{first ?? 'A licensed REVOL agent'} has your numbers and will call or email to talk it through, usually the same business day.</p>
          <div className="rc-row">
            <a className="btn btn-green" href={telHref(ctx.agent?.phone || ctx.officePhone)}>Call now · {ctx.agent?.phone || ctx.officePhone}</a>
            {ctx.agent?.calendarUrl ? <a className="btn btn-on-dark" href={ctx.agent.calendarUrl} target="_blank" rel="noreferrer">Pick a time</a> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
