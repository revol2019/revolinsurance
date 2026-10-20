'use client';

import { useMemo, useState } from 'react';
import {
  DEFAULT_ANSWERS,
  RATES,
  STATE_MINIMUMS,
  STATE_NAMES,
  autoFactors,
  homeFactors,
  money,
  rateAuto,
  rateHome,
  zipState,
  type Answers,
  type StateCode,
} from '@/lib/rating';
import { openRateCheck } from './shared';

const YEAR = new Date().getFullYear();

/** Areas the worksheet and limits tool can price, by the first three digits of the ZIP. */
const AREAS: [string, string][] = [
  ['212', 'Baltimore City'],
  ['210', 'Towson, Timonium, Bel Air, Columbia'],
  ['211', 'Glen Burnie, Owings Mills, Pasadena'],
  ['214', 'Annapolis'],
  ['208', 'Bethesda, Rockville'],
  ['207', 'Bowie, Upper Marlboro'],
  ['217', 'Frederick'],
  ['216', 'Eastern Shore'],
  ['200', 'Washington, DC'],
  ['222', 'Arlington'],
  ['223', 'Alexandria'],
  ['201', 'Loudoun and western Fairfax'],
  ['224', 'Fredericksburg'],
];

function areasFor(states: StateCode[]) {
  const list = AREAS.filter(([p]) => {
    const st = zipState(p + '01');
    return states.length === 0 || (st && st !== 'OUT' && states.includes(st));
  });
  return list.length ? list : AREAS;
}

function Select({ id, label, value, options, onChange }: { id: string; label: string; value: string; options: [string, string][]; onChange: (v: string) => void }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map(([v, t]) => (
          <option key={v} value={v}>{t}</option>
        ))}
      </select>
    </div>
  );
}

const AGE_OPTIONS: [string, string][] = [['19', 'Under 21'], ['22', '21–24'], ['27', '25–29'], ['35', '30–39'], ['47', '40–54'], ['62', '55–69'], ['74', '70+']];
const RECORD_OPTIONS = Object.entries(RATES.auto.recordLabel) as [string, string][];

// ---------------------------------------------------------------------------
// Rating worksheet: the multiplication behind a premium, live
// ---------------------------------------------------------------------------

export function Worksheet({ states, only }: { states: StateCode[]; only?: 'auto' | 'home' }) {
  const areas = areasFor(states);
  const [type, setType] = useState<'auto' | 'home'>(only ?? 'auto');
  const [w, setW] = useState({
    area: areas.some(([p]) => p === '210') ? '210' : areas[0][0],
    age: '35', coverage: 'standard', record: 'clean', prior: 'gt3', vAge: '4',
    dwelling: '450000', built: '1995', roof: '8', ded: '1000', claims: 'none',
  });
  const up = (k: keyof typeof w) => (v: string) => setW((p) => ({ ...p, [k]: v }));
  const zip = w.area + '01';

  const sheet = useMemo(() => {
    if (type === 'auto') {
      const a: Answers = { ...DEFAULT_ANSWERS, path: 'auto', zip, birthYear: String(YEAR - Number(w.age)), vehicleYear: String(YEAR - Number(w.vAge)), coverage: w.coverage as Answers['coverage'], record: w.record as Answers['record'], prior: w.prior as Answers['prior'] };
      return {
        title: 'Auto rating worksheet',
        lines: [
          { op: '', name: 'Base rate', sub: 'per vehicle, 6 months', f: null as number | null, text: money(RATES.auto.base) },
          ...autoFactors(a).map((f) => ({ op: '×', name: f.label, sub: '', f: f.f as number | null, text: '' })),
          { op: '×', name: 'Term', sub: '6 months → annual', f: null, text: '×2' },
        ],
        total: rateAuto(a),
      };
    }
    const h: Answers = { ...DEFAULT_ANSWERS, path: 'home', zip, dwelling: w.dwelling, yearBuilt: w.built, roofAge: w.roof, deductible: w.ded, claims: w.claims as Answers['claims'] };
    const base = (Number(w.dwelling) / 1000) * RATES.home.basePerK;
    return {
      title: 'Homeowners rating worksheet',
      lines: [
        { op: '', name: 'Base rate', sub: `$${RATES.home.basePerK.toFixed(2)} per $1,000 × ${money(Number(w.dwelling))}`, f: null as number | null, text: money(base) },
        ...homeFactors(h).map((f) => ({ op: '×', name: f.label, sub: '', f: f.f as number | null, text: '' })),
      ],
      total: rateHome(h),
    };
  }, [type, w, zip]);

  return (
    <div className="lp-ws">
      <div className="lp-ws-ctrl">
        {!only ? (
          <div className="lp-tabs" role="tablist" aria-label="Worksheet">
            {(['auto', 'home'] as const).map((t) => (
              <button key={t} type="button" role="tab" aria-selected={type === t} onClick={() => setType(t)}>{t === 'auto' ? 'Auto' : 'Home'}</button>
            ))}
          </div>
        ) : null}
        <Select id="ws-area" label="Where you live" value={w.area} options={areas.map(([p, n]) => [p, `${n} (${p}xx)`])} onChange={up('area')} />
        {type === 'auto' ? (
          <>
            <Select id="ws-age" label="Driver age" value={w.age} options={AGE_OPTIONS} onChange={up('age')} />
            <Select id="ws-cov" label="Coverage" value={w.coverage} options={Object.entries(RATES.auto.coverage).map(([k, v]) => [k, v.label])} onChange={up('coverage')} />
            <Select id="ws-rec" label="Last 3 years" value={w.record} options={RECORD_OPTIONS} onChange={up('record')} />
            <Select id="ws-prior" label="Continuous insurance" value={w.prior} options={Object.entries(RATES.auto.priorLabel) as [string, string][]} onChange={up('prior')} />
            <Select id="ws-vage" label="Vehicle age" value={w.vAge} options={[['1', '0–2 years'], ['4', '3–5 years'], ['8', '6–10 years'], ['13', '11+ years']]} onChange={up('vAge')} />
          </>
        ) : (
          <>
            <Select id="ws-dw" label="Rebuild cost (dwelling)" value={w.dwelling} options={[250000, 350000, 450000, 550000, 700000, 900000].map((v) => [String(v), money(v)])} onChange={up('dwelling')} />
            <Select id="ws-built" label="Home built" value={w.built} options={[['2020', '2016 or newer'], ['2008', '2000s'], ['1995', '1980s–90s'], ['1965', '1950s–70s'], ['1930', 'Before 1950']]} onChange={up('built')} />
            <Select id="ws-roof" label="Roof age" value={w.roof} options={[['3', '0–5 years'], ['8', '6–10 years'], ['13', '11–15 years'], ['18', '16+ years']]} onChange={up('roof')} />
            <Select id="ws-ded" label="Deductible" value={w.ded} options={Object.entries(RATES.home.deductible).map(([k, v]) => [k, v.label])} onChange={up('ded')} />
            <Select id="ws-claims" label="Claims, last 5 years" value={w.claims} options={Object.entries(RATES.home.claimsLabel) as [string, string][]} onChange={up('claims')} />
          </>
        )}
      </div>
      <div className="lp-ws-sheet" aria-live="polite">
        <div className="lp-ws-title">{sheet.title}<span>Factor</span></div>
        {sheet.lines.map((l, i) => {
          const dev = l.f == null ? 0 : Math.max(-1, Math.min(1, (l.f - 1) / 0.8));
          const cls = l.f == null ? 'eq' : l.f > 1.005 ? 'up' : l.f < 0.995 ? 'dn' : 'eq';
          return (
            <div className="lp-ws-line" key={i}>
              <span className="op">{l.op}</span>
              <span className="nm">{l.name}{l.sub ? <small>{l.sub}</small> : null}</span>
              <span className="bar" aria-hidden="true">
                {l.f != null ? <i className={dev >= 0 ? 'up' : 'dn'} style={dev >= 0 ? { left: '50%', width: `${Math.abs(dev) * 50}%` } : { left: `${50 - Math.abs(dev) * 50}%`, width: `${Math.abs(dev) * 50}%` }} /> : null}
              </span>
              <span className={`fx ${cls}`}>{l.text || '×' + (l.f as number).toFixed(2)}</span>
            </div>
          );
        })}
        <div className="lp-ws-total">
          <span>Estimated annual premium</span>
          <b>{money(sheet.total)} <small>/ yr</small></b>
        </div>
        <button type="button" className="btn btn-primary lp-ws-go" onClick={() => openRateCheck({ path: type })}>Price it for real <span aria-hidden="true">→</span></button>
        <p className="lp-fine">Illustrative factors modeled on how filed personal-lines rating manuals are structured. Your real premium depends on underwriting and each carrier&apos;s own filed rates.</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Liability limits: what each limit costs, and what it pays in a real crash
// ---------------------------------------------------------------------------

const SCENARIOS = {
  minor: { label: 'Rear-end at a light', injured: 1, perPerson: 12000, property: 9000 },
  serious: { label: 'One person badly hurt', injured: 1, perPerson: 180000, property: 28000 },
  multi: { label: 'Multi-car crash', injured: 3, perPerson: 120000, property: 65000 },
} as const;
type ScenarioKey = keyof typeof SCENARIOS;

function parseLimits(s: string) {
  const [pp, pa, pd] = s.split('/').map((n) => Number(n) * 1000);
  return { pp, pa, pd };
}

function covered(limits: string, sc: (typeof SCENARIOS)[ScenarioKey]) {
  const { pp, pa, pd } = parseLimits(limits);
  const bodily = Math.min(pa, sc.injured * Math.min(pp, sc.perPerson));
  const property = Math.min(pd, sc.property);
  const damages = sc.injured * sc.perPerson + sc.property;
  return { paid: bodily + property, owed: damages - bodily - property, damages };
}

export function LimitsTool({ states }: { states: StateCode[] }) {
  const areas = areasFor(states);
  const [area, setArea] = useState(areas.some(([p]) => p === '210') ? '210' : areas[0][0]);
  const [age, setAge] = useState('35');
  const [record, setRecord] = useState('clean');
  const [scenario, setScenario] = useState<ScenarioKey>('serious');
  const zip = area + '01';
  const st = zipState(zip);
  const stateCode = (st && st !== 'OUT' ? st : 'MD') as StateCode;
  const tiers = [
    { key: 'state' as const, name: `${STATE_NAMES[stateCode]} minimum`, limits: STATE_MINIMUMS[stateCode], note: 'Legal to drive. Nothing for your own car.' },
    { key: 'standard' as const, name: 'What most drivers carry', limits: '100/300/100', note: 'Plus comprehensive and collision.' },
    { key: 'full' as const, name: 'Where homeowners should start', limits: '250/500/100', note: 'Pairs with an umbrella policy.' },
  ];
  const sc = SCENARIOS[scenario];
  const priced = tiers.map((t) => {
    const a: Answers = { ...DEFAULT_ANSWERS, path: 'auto', zip, birthYear: String(YEAR - Number(age)), vehicleYear: String(YEAR - 4), coverage: t.key, record: record as Answers['record'], prior: 'gt3' };
    return { ...t, annual: rateAuto(a), ...covered(t.limits, sc) };
  });
  const stepUp = (priced[1].annual - priced[0].annual) / 12;

  return (
    <div className="lp-limits">
      <div className="lp-limits-ctrl">
        <Select id="lim-area" label="Where you live" value={area} options={areas.map(([p, n]) => [p, n])} onChange={setArea} />
        <Select id="lim-age" label="Driver age" value={age} options={AGE_OPTIONS} onChange={setAge} />
        <Select id="lim-rec" label="Last 3 years" value={record} options={RECORD_OPTIONS} onChange={setRecord} />
        <div className="field">
          <span className="rc-label" id="lim-sc">If you caused this</span>
          <div className="rc-pills" role="group" aria-labelledby="lim-sc">
            {(Object.keys(SCENARIOS) as ScenarioKey[]).map((k) => (
              <button type="button" key={k} aria-pressed={scenario === k} onClick={() => setScenario(k)}>{SCENARIOS[k].label}</button>
            ))}
          </div>
          <span className="rc-hint">
            {sc.injured > 1 ? `${sc.injured} people with ${money(sc.perPerson)} each in injuries` : `${money(sc.perPerson)} in injuries`}, plus {money(sc.property)} in property damage.
          </span>
        </div>
      </div>
      <div className="lp-limits-cols" aria-live="polite">
        {priced.map((t, i) => (
          <div className={`lp-limit${i === 1 ? ' mid' : ''}`} key={t.key}>
            <div className="lp-limit-name">{t.name}</div>
            <div className="lp-limit-num">{t.limits}</div>
            <div className="lp-limit-price">{money(t.annual)}<small>/yr · about {money(t.annual / 12)}/mo</small></div>
            <div className="lp-limit-row"><span>Insurance pays</span><b>{money(t.paid)}</b></div>
            <div className={`lp-limit-row ${t.owed > 0 ? 'owe' : 'ok'}`}><span>You owe</span><b>{money(t.owed)}</b></div>
            <p>{t.note}</p>
          </div>
        ))}
      </div>
      <p className="lp-limits-sum">
        Going from the minimum to 100/300/100 costs about <b>{money(stepUp)} a month</b> here. Anything above your limits can come after your savings,
        your wages and your home.
      </p>
      <div className="lp-center">
        <button type="button" className="btn btn-primary" onClick={() => openRateCheck({ path: 'auto' })}>Price my auto <span aria-hidden="true">→</span></button>
      </div>
      <p className="lp-fine">Illustrative premiums for one vehicle and a driver with continuous insurance. Limits are per person / per accident bodily injury / property damage, in thousands.</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Rebuild cost: how much house you are insuring
// ---------------------------------------------------------------------------

const QUALITY = {
  standard: { label: 'Builder grade', perSqFt: 185, note: 'Vinyl or laminate, stock cabinets, standard fixtures' },
  upgraded: { label: 'Upgraded', perSqFt: 235, note: 'Hardwood, stone counters, custom trim' },
  custom: { label: 'Custom', perSqFt: 310, note: 'High-end finishes, architect-designed' },
} as const;
type Quality = keyof typeof QUALITY;

function regionFactor(prefix: string) {
  const p = Number(prefix);
  if (p >= 200 && p <= 205) return 1.15;
  if (p === 201 || (p >= 220 && p <= 223)) return 1.1;
  if (p === 208 || p === 209) return 1.07;
  if (p === 216 || p === 218) return 0.93;
  return 1;
}

export function RebuildTool({ states }: { states: StateCode[] }) {
  const areas = areasFor(states);
  const [area, setArea] = useState(areas.some(([p]) => p === '210') ? '210' : areas[0][0]);
  const [sqft, setSqft] = useState('2200');
  const [quality, setQuality] = useState<Quality>('standard');
  const [garage, setGarage] = useState('2');
  const [basement, setBasement] = useState('0');

  const s = Math.max(0, Math.min(20000, Number(sqft) || 0));
  const b = Math.max(0, Math.min(10000, Number(basement) || 0));
  const per = QUALITY[quality].perSqFt * regionFactor(area);
  const house = s * per;
  const lower = b * per * 0.45;
  const garageCost = { '0': 0, '1': 26000, '2': 42000, '3': 58000 }[garage] ?? 0;
  const mid = house + lower + garageCost;
  const low = Math.round((mid * 0.9) / 5000) * 5000;
  const high = Math.round((mid * 1.1) / 5000) * 5000;
  const dwelling = String(Math.round(mid / 10000) * 10000);

  return (
    <div className="lp-rebuild">
      <div className="lp-rebuild-ctrl">
        <Select id="rb-area" label="Where the house is" value={area} options={areas.map(([p, n]) => [p, n])} onChange={setArea} />
        <div className="field">
          <label htmlFor="rb-sqft">Finished square feet (above ground)</label>
          <input id="rb-sqft" type="text" inputMode="numeric" value={sqft} onChange={(e) => setSqft(e.target.value.replace(/\D/g, '').slice(0, 5))} />
          <span className="rc-hint">It is on the listing.</span>
        </div>
        <div className="field">
          <span className="rc-label" id="rb-q">Finishes</span>
          <div className="lp-quality" role="group" aria-labelledby="rb-q">
            {(Object.keys(QUALITY) as Quality[]).map((k) => (
              <button type="button" key={k} aria-pressed={quality === k} onClick={() => setQuality(k)}>
                <b>{QUALITY[k].label}</b>
                <small>{QUALITY[k].note}</small>
              </button>
            ))}
          </div>
        </div>
        <div className="rc-grid2">
          <Select id="rb-garage" label="Garage" value={garage} options={[['0', 'None'], ['1', '1-car'], ['2', '2-car'], ['3', '3-car']]} onChange={setGarage} />
          <div className="field">
            <label htmlFor="rb-base">Finished basement (sq ft)</label>
            <input id="rb-base" type="text" inputMode="numeric" value={basement} onChange={(e) => setBasement(e.target.value.replace(/\D/g, '').slice(0, 5))} />
          </div>
        </div>
      </div>
      <div className="lp-rebuild-out" aria-live="polite">
        <div className="lp-rebuild-lbl">Estimated cost to rebuild</div>
        <div className="lp-rebuild-num">{s > 0 ? `${money(low)} – ${money(high)}` : '—'}</div>
        <div className="lp-rebuild-rows">
          <div><span>House, {s.toLocaleString('en-US')} sq ft at about {money(per)}/sq ft</span><b>{money(house)}</b></div>
          {b > 0 ? <div><span>Finished basement</span><b>{money(lower)}</b></div> : null}
          {garageCost ? <div><span>Garage</span><b>{money(garageCost)}</b></div> : null}
        </div>
        <p>
          This is the number your dwelling coverage should be, not the price on the contract. Land does not burn down, so it is left out, and a
          house that sold for less than it costs to rebuild still needs the full rebuild amount.
        </p>
        <button type="button" className="btn btn-primary" disabled={s === 0} onClick={() => openRateCheck({ path: 'home', dwelling })}>
          Price this house <span aria-hidden="true">→</span>
        </button>
        <p className="lp-fine">A rough guide built from typical Maryland and Virginia construction costs. Your agent runs a full replacement-cost estimate before binding.</p>
      </div>
    </div>
  );
}
