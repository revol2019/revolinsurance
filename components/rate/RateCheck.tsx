'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  DEFAULT_ANSWERS,
  DWELLING_OPTIONS,
  PATH_LABELS,
  RATES,
  STATE_MINIMUMS,
  STATE_NAMES,
  carrierLabel,
  money,
  pct,
  quoteAll,
  summarize,
  zipState,
  type Answers,
  type QuotePath,
  type StateCode,
} from '@/lib/rating';
import LeadGate from './LeadGate';
import { RATE_EVENT, telHref, track, type LandingContext, type RateOpen } from './shared';

const STEPS: Record<QuotePath, string[]> = {
  auto: ['path', 'zip', 'driver', 'vehicle', 'coverage', 'record', 'results'],
  home: ['path', 'zip', 'property', 'roof', 'homecov', 'results'],
  bundle: ['path', 'zip', 'driver', 'vehicle', 'coverage', 'record', 'property', 'roof', 'homecov', 'results'],
};
const YEAR = new Date().getFullYear();

/**
 * The REVOL Rate Check: a full-screen, one-question-at-a-time estimate across
 * the carriers, ending in a range, the bundle-vs-split verdict and what moves
 * the number. The carrier-by-carrier breakdown unlocks with contact details,
 * which go to the page's producer as a lead in REVOL Team.
 *
 * Opened by any button on the page (openRateCheck), or by a link ending in
 * #rate-check, optionally with ?type=auto|home|bundle&zip=21093.
 */
export default function RateCheck({ ctx, defaultPath = 'bundle' }: { ctx: LandingContext; defaultPath?: QuotePath }) {
  const [open, setOpen] = useState(false);
  const [a, setA] = useState<Answers>({ ...DEFAULT_ANSWERS, path: defaultPath });
  const [idx, setIdx] = useState(0);
  const [unlocked, setUnlocked] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [sentName, setSentName] = useState<string | null>(null);
  const started = useRef(false);
  const stageRef = useRef<HTMLDivElement>(null);

  const steps = STEPS[a.path];
  const step = steps[Math.min(idx, steps.length - 1)];
  const set = (patch: Partial<Answers>) => setA((prev) => ({ ...prev, ...patch }));

  const zipOk = useCallback(
    (zip: string) => {
      const st = zipState(zip);
      return !!st && st !== 'OUT' && (ctx.states.length === 0 || ctx.states.includes(st));
    },
    [ctx.states],
  );

  const latest = useRef(a);
  latest.current = a;

  const show = useCallback(
    (d: RateOpen = {}) => {
      const next = { ...latest.current };
      if (d.zip && /^\d{5}$/.test(d.zip)) next.zip = d.zip;
      if (d.dwelling) next.dwelling = d.dwelling;
      if (d.path && !sentName) next.path = d.path;
      setA(next);
      // Skip straight past the questions already answered on the page.
      if (!sentName) setIdx(d.path ? (zipOk(next.zip) ? 2 : 1) : 0);
      setOpen(true);
      if (!started.current) {
        started.current = true;
        track('rate_check_start', { quote_type: d.path ?? defaultPath, page: ctx.pageTitle });
      }
    },
    [ctx.pageTitle, defaultPath, sentName, zipOk],
  );

  // Buttons anywhere on the page open it.
  useEffect(() => {
    const on = (e: Event) => show((e as CustomEvent<RateOpen>).detail ?? {});
    window.addEventListener(RATE_EVENT, on);
    return () => window.removeEventListener(RATE_EVENT, on);
  }, [show]);

  // Ad links: ?type=auto&zip=21093#rate-check
  useEffect(() => {
    const qs = new URLSearchParams(location.search);
    const t = qs.get('type') as QuotePath | null;
    const z = (qs.get('zip') || '').replace(/\D/g, '').slice(0, 5);
    if (t && STEPS[t]) set({ path: t });
    if (z) set({ zip: z });
    if (location.hash === '#rate-check') show({ path: t && STEPS[t] ? t : defaultPath, zip: z });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // While open: no page scroll behind it, Escape closes, focus the first control on each step.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      const el = stageRef.current?.querySelector<HTMLElement>('input, select, .rc-opt[aria-pressed="true"], .rc-opt, h1');
      el?.focus({ preventScroll: true });
      stageRef.current?.scrollTo({ top: 0 });
    }, 40);
    return () => clearTimeout(t);
  }, [open, step]);

  const close = () => {
    setOpen(false);
    if (location.hash === '#rate-check') history.replaceState(null, '', location.pathname + location.search);
  };

  const go = (d: number) => {
    const next = Math.max(0, Math.min(steps.length - 1, idx + d));
    setIdx(next);
    track(steps[next] === 'results' ? 'rate_check_results' : 'rate_check_step', { step: steps[next], quote_type: a.path });
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') return close();
      const tag = ((e.target as HTMLElement).tagName || '').toLowerCase();
      if (/^[1-9]$/.test(e.key) && !['input', 'select', 'textarea'].includes(tag)) {
        const o = stageRef.current?.querySelectorAll<HTMLButtonElement>('.rc-opt')[Number(e.key) - 1];
        if (o) {
          o.click();
          e.preventDefault();
        }
      }
      if (e.key === 'Enter' && tag !== 'button' && tag !== 'textarea' && !stageRef.current?.querySelector('#rc-contact')) {
        const n = stageRef.current?.querySelector<HTMLButtonElement>('#rc-next');
        if (n && !n.disabled) {
          e.preventDefault();
          n.click();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, idx, a.path]);

  const q = useMemo(() => (step === 'results' ? quoteAll(a, ctx.agent?.carriers) : null), [a, step, ctx.agent?.carriers]);

  if (!open) return null;

  const total = steps.length - 1;
  const first = ctx.agent?.first;
  const st = zipState(a.zip);
  const validBirth = Number(a.birthYear) >= 1930 && Number(a.birthYear) <= YEAR - 16;
  const validBuilt = Number(a.yearBuilt) >= 1700 && Number(a.yearBuilt) <= YEAR;
  const stateMin = st && st !== 'OUT' ? STATE_MINIMUMS[st] : '30/60/15';
  const stateName = st && st !== 'OUT' ? STATE_NAMES[st] : 'Maryland';
  const statesText = ctx.states.map((s) => STATE_NAMES[s]).join(', ').replace(/, ([^,]*)$/, ' and $1');

  const nav = (label: string, ok: boolean) => (
    <div className="rc-row">
      {idx > 0 ? (
        <button type="button" className="btn btn-ghost" onClick={() => go(-1)}>Back</button>
      ) : null}
      <button type="button" className="btn btn-primary" id="rc-next" disabled={!ok} onClick={() => go(1)}>
        {label} <span aria-hidden="true">→</span>
      </button>
    </div>
  );
  const opt = (pressed: boolean, onClick: () => void, title: string, note?: string, key?: string, badge?: string) => (
    <button type="button" className="rc-opt" aria-pressed={pressed} onClick={onClick} key={title}>
      {key ? <span className="rc-key" aria-hidden="true">{key}</span> : null}
      <span className="rc-opt-body">
        <span className="rc-opt-title">{title}</span>
        {note ? <span className="rc-opt-note">{note}</span> : null}
      </span>
      {badge ? <span className="rc-badge">{badge}</span> : null}
    </button>
  );
  const kbd = <p className="rc-kbd">Tip: press 1–4 to choose, Enter to continue.</p>;

  let body: React.ReactNode = null;
  if (step === 'path') {
    body = (
      <div className="rc-card">
        <div className="rc-eyebrow">{statesText || 'Rate check'}</div>
        <h1 className="rc-q" tabIndex={-1}>What are we checking?</h1>
        <p className="rc-help">A few questions, then a range across the carriers {first ? `${first} is` : 'we are'} appointed with. Contact details come last, and only if you want the breakdown.</p>
        <div className="rc-opts">
          {(['bundle', 'auto', 'home'] as QuotePath[]).map((p, i) =>
            opt(
              a.path === p,
              () => {
                set({ path: p });
                setIdx(zipOk(a.zip) ? 2 : 1);
              },
              { bundle: 'Home and auto together', auto: 'Auto only', home: 'Home only' }[p],
              {
                bundle: 'Where the multi-policy discount lives, and we test splitting carriers too',
                auto: 'Cars, trucks and the drivers on the policy',
                home: 'Homeowners coverage on a house you own or are buying',
              }[p],
              String(i + 1),
              p === 'bundle' ? 'Most savings' : undefined,
            ),
          )}
        </div>
        {kbd}
      </div>
    );
  } else if (step === 'zip') {
    const out = st === 'OUT' || (st && ctx.states.length > 0 && !ctx.states.includes(st as StateCode));
    body = (
      <div className="rc-card">
        <div className="rc-eyebrow">Location</div>
        <h1 className="rc-q" tabIndex={-1}>What&apos;s your ZIP code?</h1>
        <p className="rc-help">Territory is one of the biggest single rating factors. Two neighborhoods twenty minutes apart can price 40% apart.</p>
        <div className="field">
          <label htmlFor="rc-zip" className="rc-sr">ZIP code</label>
          <input
            className="rc-zip"
            id="rc-zip"
            type="text"
            inputMode="numeric"
            maxLength={5}
            placeholder="21093"
            autoComplete="postal-code"
            value={a.zip}
            onChange={(e) => {
              const z = e.target.value.replace(/\D/g, '').slice(0, 5);
              set({ zip: z });
              if (zipOk(z)) setTimeout(() => setIdx((i) => (STEPS[a.path][i] === 'zip' ? i + 1 : i)), 350);
            }}
          />
          <span className="rc-hint">
            {out ? (
              <span className="rc-warn">
                {first ? `${first} is` : 'We are'} licensed in {statesText}. Call {ctx.agent?.phone || ctx.officePhone} and we will find you someone licensed where you are.
              </span>
            ) : st ? (
              <>Rating in <b>{STATE_NAMES[st as StateCode]}</b></>
            ) : (
              '5 digits'
            )}
          </span>
        </div>
        {nav('Continue', zipOk(a.zip))}
      </div>
    );
  } else if (step === 'driver') {
    body = (
      <div className="rc-card">
        <div className="rc-eyebrow">Drivers</div>
        <h1 className="rc-q" tabIndex={-1}>About the primary driver</h1>
        <p className="rc-help">Age and how many vehicles. No names or license numbers for an estimate.</p>
        <div className="field">
          <label htmlFor="rc-by">Year of birth</label>
          <input id="rc-by" type="text" inputMode="numeric" maxLength={4} placeholder="1985" value={a.birthYear} onChange={(e) => set({ birthYear: e.target.value.replace(/\D/g, '').slice(0, 4) })} />
        </div>
        <div className="field">
          <span className="rc-label" id="rc-veh">Vehicles on the policy</span>
          <div className="rc-pills" role="group" aria-labelledby="rc-veh">
            {['1', '2', '3', '4'].map((n) => (
              <button type="button" key={n} aria-pressed={a.vehicles === n} onClick={() => set({ vehicles: n })}>{n}{n === '4' ? '+' : ''}</button>
            ))}
          </div>
        </div>
        {nav('Continue', validBirth)}
      </div>
    );
  } else if (step === 'vehicle') {
    body = (
      <div className="rc-card">
        <div className="rc-eyebrow">Vehicle</div>
        <h1 className="rc-q" tabIndex={-1}>What year is your newest vehicle?</h1>
        <p className="rc-help">Newer vehicles cost more to repair, which lifts comprehensive and collision, though they often earn safety-feature credits.</p>
        <div className="field">
          <label htmlFor="rc-vy">Model year</label>
          <select id="rc-vy" value={a.vehicleYear} onChange={(e) => set({ vehicleYear: e.target.value })}>
            <option value="">Select year</option>
            {Array.from({ length: YEAR + 2 - 1995 }, (_, i) => YEAR + 1 - i).map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
            <option value="1990">1994 or older</option>
          </select>
          <span className="rc-hint">The others on the policy are rated off this one.</span>
        </div>
        {nav('Continue', !!a.vehicleYear)}
      </div>
    );
  } else if (step === 'coverage') {
    const c = RATES.auto.coverage;
    body = (
      <div className="rc-card">
        <div className="rc-eyebrow">Auto coverage</div>
        <h1 className="rc-q" tabIndex={-1}>How much protection do you want?</h1>
        <p className="rc-help">{stateName}&apos;s minimum is {stateMin}. If you own a home, a liability limit below what you own is the gap that actually hurts.</p>
        <div className="rc-opts">
          {opt(a.coverage === 'state', () => { set({ coverage: 'state' }); setTimeout(() => go(1), 180); }, c.state.label, `${stateMin} liability, no physical damage`, '1')}
          {opt(a.coverage === 'standard', () => { set({ coverage: 'standard' }); setTimeout(() => go(1), 180); }, c.standard.label, c.standard.desc, '2', 'Most common')}
          {opt(a.coverage === 'full', () => { set({ coverage: 'full' }); setTimeout(() => go(1), 180); }, c.full.label, c.full.desc, '3')}
        </div>
        {nav('Continue', true)}
        {kbd}
      </div>
    );
  } else if (step === 'record') {
    body = (
      <div className="rc-card">
        <div className="rc-eyebrow">History</div>
        <h1 className="rc-q" tabIndex={-1}>Accidents or tickets in the last 3 years?</h1>
        <div className="rc-opts rc-two">
          {opt(a.record === 'clean', () => set({ record: 'clean' }), 'None', 'Clean record', '1')}
          {opt(a.record === 'one', () => set({ record: 'one' }), 'One', 'Accident or violation', '2')}
          {opt(a.record === 'two', () => set({ record: 'two' }), 'Two', undefined, '3')}
          {opt(a.record === 'three', () => set({ record: 'three' }), 'Three or more', undefined, '4')}
        </div>
        <div className="field" style={{ marginTop: 20 }}>
          <label htmlFor="rc-prior">How long have you been continuously insured?</label>
          <select id="rc-prior" value={a.prior} onChange={(e) => set({ prior: e.target.value as Answers['prior'] })}>
            <option value="none">Not currently insured</option>
            <option value="lt1">Less than a year</option>
            <option value="y1to3">1 to 3 years</option>
            <option value="gt3">More than 3 years</option>
          </select>
          <span className="rc-hint">A lapse in coverage is one of the most expensive things on a policy.</span>
        </div>
        {a.path === 'auto' ? (
          <label className="rc-check">
            <input type="checkbox" checked={a.ownsHome} onChange={(e) => set({ ownsHome: e.target.checked })} />
            <span>I own my home. Homeowners earn an auto credit even without bundling.</span>
          </label>
        ) : null}
        {nav(a.path === 'auto' ? 'See my range' : 'Continue', true)}
      </div>
    );
  } else if (step === 'property') {
    const options = Array.from(new Set([...DWELLING_OPTIONS, Number(a.dwelling)])).sort((x, y) => x - y);
    body = (
      <div className="rc-card">
        <div className="rc-eyebrow">Property</div>
        <h1 className="rc-q" tabIndex={-1}>About the home</h1>
        <p className="rc-help">Dwelling coverage is <b>rebuild cost</b>: not the market value or what you paid, and it leaves out the land. It is the most common place homeowners end up underinsured.</p>
        <div className="rc-grid2">
          <div className="field">
            <label htmlFor="rc-dw">Estimated rebuild cost</label>
            <select id="rc-dw" value={a.dwelling} onChange={(e) => set({ dwelling: e.target.value })}>
              {options.map((v) => (
                <option key={v} value={String(v)}>{money(v)}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="rc-yb">Year built</label>
            <input id="rc-yb" type="text" inputMode="numeric" maxLength={4} placeholder="1998" value={a.yearBuilt} onChange={(e) => set({ yearBuilt: e.target.value.replace(/\D/g, '').slice(0, 4) })} />
          </div>
        </div>
        {nav('Continue', validBuilt)}
      </div>
    );
  } else if (step === 'roof') {
    body = (
      <div className="rc-card">
        <div className="rc-eyebrow">Property</div>
        <h1 className="rc-q" tabIndex={-1}>How old is the roof?</h1>
        <p className="rc-help">Roof age has become the deciding factor in homeowners underwriting. Past about 15 years, several carriers decline the house or pay the roof at actual cash value.</p>
        <div className="field">
          <span className="rc-label" id="rc-roof">Roof age</span>
          <div className="rc-pills" role="group" aria-labelledby="rc-roof">
            {[2, 5, 8, 12, 16, 20, 25].map((v) => (
              <button type="button" key={v} aria-pressed={a.roofAge === String(v)} onClick={() => set({ roofAge: String(v) })}>{v}{v === 25 ? '+' : ''} yrs</button>
            ))}
          </div>
          <span className="rc-hint">
            {Number(a.roofAge) >= 16 ? (
              <span className="rc-warn">Fewer carriers want a roof this age. This is exactly where an independent agent earns their keep.</span>
            ) : (
              'Not sure? It is in the inspection report or the seller’s disclosures.'
            )}
          </span>
        </div>
        {nav('Continue', true)}
      </div>
    );
  } else if (step === 'homecov') {
    body = (
      <div className="rc-card">
        <div className="rc-eyebrow">Home coverage</div>
        <h1 className="rc-q" tabIndex={-1}>Deductible and claims history</h1>
        <div className="field" style={{ marginTop: 18 }}>
          <span className="rc-label" id="rc-ded">Deductible</span>
          <div className="rc-pills" role="group" aria-labelledby="rc-ded">
            {Object.entries(RATES.home.deductible).map(([k, v]) => (
              <button type="button" key={k} aria-pressed={a.deductible === k} onClick={() => set({ deductible: k })}>{v.label}</button>
            ))}
          </div>
          <span className="rc-hint">Moving from $1,000 to $2,500 typically trims about 11% off the premium.</span>
        </div>
        <div className="field">
          <label htmlFor="rc-claims">Homeowners claims in the last 5 years</label>
          <select id="rc-claims" value={a.claims} onChange={(e) => set({ claims: e.target.value as Answers['claims'] })}>
            <option value="none">None</option>
            <option value="one">One</option>
            <option value="two">Two or more</option>
          </select>
        </div>
        {nav('See my range', true)}
      </div>
    );
  } else if (step === 'results') {
    body = q ? (
      <Results
        a={a}
        q={q}
        ctx={ctx}
        unlocked={unlocked}
        formOpen={formOpen}
        sentName={sentName}
        onUnlock={() => {
          setFormOpen(true);
          track('rate_check_unlock_click', { quote_type: a.path });
          setTimeout(() => document.getElementById('rc-contact')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
        }}
        onSent={(name) => {
          setSentName(name);
          setUnlocked(true);
          setFormOpen(false);
          setTimeout(() => document.getElementById('rc-compare')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
        }}
        onEdit={() => setIdx(2)}
        onRestart={() => {
          setIdx(0);
          setUnlocked(false);
          setFormOpen(false);
          setSentName(null);
        }}
      />
    ) : (
      <div className="rc-card">
        <h1 className="rc-q" tabIndex={-1}>We could not price that combination here</h1>
        <p className="rc-help">Call {ctx.agent?.phone || ctx.officePhone} and {first ?? 'an agent'} will quote it directly.</p>
      </div>
    );
  }

  return (
    <div className="rc-overlay" role="dialog" aria-modal="true" aria-label="Rate check">
      <div className="rc-top">
        <div className="rc-brand">
          <span className="rc-brand-mark">REVOL</span>
          <span className="rc-brand-sub">Rate check</span>
        </div>
        <div className="rc-progress">
          <div className="rc-progress-meta">
            <span>{step === 'results' ? 'Your results' : `Step ${idx + 1} of ${total}`}</span>
            <span>{step === 'results' ? (sentName ? `Sent to ${first ?? 'your agent'}` : '') : `${Math.max(10, (total - idx) * 8)} sec left`}</span>
          </div>
          <div className="rc-bar"><i style={{ width: `${(idx / total) * 100}%` }} /></div>
        </div>
        {ctx.agent ? (
          <div className="rc-agent" title={ctx.agent.name}>
            {ctx.agent.headshot ? <img src={ctx.agent.headshot} alt="" /> : <span>{ctx.agent.first.slice(0, 1)}</span>}
            <small>with {ctx.agent.first}</small>
          </div>
        ) : null}
        <button type="button" className="rc-close" aria-label="Close the rate check" onClick={close}>×</button>
      </div>
      <div className="rc-stage" ref={stageRef}>
        <div className="rc-col">{body}</div>
      </div>
    </div>
  );
}

function Results({
  a, q, ctx, unlocked, formOpen, sentName, onUnlock, onSent, onEdit, onRestart,
}: {
  a: Answers;
  q: NonNullable<ReturnType<typeof quoteAll>>;
  ctx: LandingContext;
  unlocked: boolean;
  formOpen: boolean;
  sentName: string | null;
  onUnlock: () => void;
  onSent: (name: string) => void;
  onEdit: () => void;
  onRestart: () => void;
}) {
  const first = ctx.agent?.first;
  const scaleMax = Math.ceil(q.worst.high / 500) * 500;
  const scaleMin = Math.max(0, Math.floor((q.best.low * 0.8) / 500) * 500);
  const pos = (v: number) => ((v - scaleMin) / Math.max(1, scaleMax - scaleMin)) * 100;
  const st = zipState(a.zip);
  const what = q.isBundle
    ? 'Home and auto, combined annual premium'
    : a.path === 'auto'
      ? `Annual auto premium · ${a.vehicles}${a.vehicles === '4' ? '+' : ''} vehicle${a.vehicles !== '1' ? 's' : ''}`
      : 'Annual homeowners premium';
  const drivers = q.factors
    .filter((f) => Math.abs(f.f - 1) >= 0.02)
    .sort((x, y) => Math.abs(Math.log(y.f)) - Math.abs(Math.log(x.f)))
    .slice(0, 5);
  const bundleWins = q.split ? q.best.total <= q.split.total : true;

  return (
    <>
      <div className="rc-res-head">
        <div className="rc-res-lbl">Estimated annual range · ZIP {a.zip}{st && st !== 'OUT' ? ` · ${st}` : ''}</div>
        <div className="rc-res-range">
          <CountUp to={q.low} /> – <CountUp to={q.high} /> <span className="rc-per">/ yr</span>
        </div>
        <div className="rc-res-sub">{what}, across {q.rows.length} carriers {first ? `${first} is` : 'we are'} appointed with. Same coverage, same you, priced by each carrier&apos;s own rating plan.</div>
        <div className="rc-kpis">
          <div><b>{money(q.best.total)}</b><span>Lowest estimate (about {money(q.best.total / 12)}/mo)</span></div>
          <div><b>{money(q.worst.total - q.best.total)}</b><span>Gap between the highest and lowest carrier</span></div>
          <div><b>{q.isBundle ? money(q.best.saved) : q.rows.length}</b><span>{q.isBundle ? 'Bundle discount at the lowest carrier' : 'Carriers compared for you'}</span></div>
        </div>
      </div>

      <div className={`rc-panel${unlocked ? '' : ' rc-locked'}`} id="rc-compare">
        <h3>Carrier by carrier</h3>
        <p className="rc-panel-sub">Ranges reflect normal underwriting variation around each carrier&apos;s estimate.</p>
        <div className="rc-rows">
          {q.rows.map((r, i) => (
            <div className={`rc-crow${i === 0 ? ' rc-best' : ''}`} key={r.slug}>
              <div className="rc-cname">{carrierLabel(r, i)}</div>
              <div className="rc-track" aria-hidden="true">
                <i style={{ left: `${pos(r.low)}%`, width: `${Math.max(pos(r.high) - pos(r.low), 2)}%` }} />
              </div>
              <div className="rc-cval">
                {money(r.low)}–{money(r.high)}
                {i === 0 ? <small>Lowest</small> : null}
              </div>
            </div>
          ))}
        </div>
        <div className="rc-scale"><span>{money(scaleMin)}</span><span>{money((scaleMin + scaleMax) / 2)}</span><span>{money(scaleMax)}</span></div>
        {q.split ? (
          <div className="rc-split">
            <div className="rc-split-head">
              <b>Bundle vs. best split</b>
              <span className={`rc-verdict ${bundleWins ? 'b' : 's'}`}>{bundleWins ? 'Bundle' : 'Split'} wins by {money(Math.abs(q.best.total - q.split.total))}</span>
            </div>
            <div className="rc-split-cols">
              <div><div className="k">Best single-carrier bundle</div><div className="v">{money(q.best.total)}</div><div className="d">{carrierLabel(q.best, 0)}, with the multi-policy discount</div></div>
              <div><div className="k">Best auto + best home, separately</div><div className="v">{money(q.split.total)}</div><div className="d">Auto and home with different carriers</div></div>
            </div>
          </div>
        ) : null}
        {!unlocked ? (
          <div className="rc-gate">
            <div className="rc-gate-in">
              <div className="rc-lock" aria-hidden="true">🔒</div>
              <h4>See how the carriers compare</h4>
              <p>Unlock the carrier-by-carrier breakdown{q.split ? ' and the bundle-vs-split verdict' : ''}. {first ?? 'One licensed agent'} confirms real prices, and nobody else gets your information.</p>
              {!formOpen ? (
                <button className="btn btn-primary" type="button" onClick={onUnlock}>Show me the breakdown <span aria-hidden="true">→</span></button>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>

      {formOpen && !sentName ? (
        <LeadGate
          ctx={ctx}
          title="Where should the breakdown go?"
          intro={`It unlocks on screen right away. ${first ?? 'A licensed REVOL agent'} follows up by phone or email to confirm real, bindable prices.`}
          variant="pc"
          lines={a.path === 'bundle' ? ['Home', 'Auto'] : [PATH_LABELS[a.path]]}
          zip={a.zip}
          summary={() => summarize(a, q)}
          trackParams={{ quote_type: a.path, value: Math.round(q.best.total), currency: 'USD' }}
          onSent={onSent}
        />
      ) : null}

      {sentName ? (
        <div className="rc-done">
          <h3>You&apos;re all set, {sentName}.</h3>
          <p>
            The breakdown is unlocked above. {first ?? 'A licensed REVOL agent'} has your answers and will call or email you with real,
            bindable prices from the lowest carriers, usually the same business day.
          </p>
          <div className="rc-row">
            <a className="btn btn-primary" href={telHref(ctx.agent?.phone || ctx.officePhone)}>Call now · {ctx.agent?.phone || ctx.officePhone}</a>
            {ctx.agent?.calendarUrl ? (
              <a className="btn btn-on-dark" href={ctx.agent.calendarUrl} target="_blank" rel="noreferrer">Pick a time</a>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="rc-panel">
        <h3>What&apos;s moving your number</h3>
        <p className="rc-panel-sub">The biggest rating factors in your profile, against a typical base rate.</p>
        <div className="rc-drivers">
          {drivers.length === 0 ? <p className="rc-panel-sub">Your profile sits close to the base rate on every factor.</p> : null}
          {drivers.map((f) => (
            <div className="rc-drv" key={f.line + f.key}>
              <div>{f.label}<small>{f.line === 'home' ? 'Home' : 'Auto'} · {f.f > 1 ? 'pushing your rate up' : 'working in your favor'}</small></div>
              <span className={`rc-pct ${f.f > 1 ? 'up' : 'dn'}`}>{pct(f.f)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rc-disclaimer">
        <strong>This is an estimate, not a quote.</strong>
        <p>
          Figures are indicative ranges built from typical personal-lines rating factors. They are not offers of insurance or bindable quotes, and
          no coverage is in force. Your actual premium depends on underwriting, full driving and claims history, vehicle identification, credit-based
          insurance score where permitted, and verified property details. A licensed REVOL agent provides the firm quote.
        </p>
      </div>
      <div className="rc-row" style={{ justifyContent: 'space-between' }}>
        <button type="button" className="rc-link" onClick={onEdit}>← Edit answers</button>
        <button type="button" className="rc-link" onClick={onRestart}>Start over</button>
      </div>
    </>
  );
}

function CountUp({ to }: { to: number }) {
  const [v, setV] = useState(to);
  useEffect(() => {
    if (typeof window === 'undefined' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setV(to);
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const k = Math.min(1, (t - t0) / 900);
      setV(to * (1 - Math.pow(1 - k, 3)));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to]);
  return <span>{money(v)}</span>;
}
