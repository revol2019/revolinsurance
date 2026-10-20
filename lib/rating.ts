/**
 * REVOL Rate Check: the estimating engine behind every instant quote tool.
 *
 * premium = base × territory × class factors × coverage × carrier level
 *
 * The shape follows how filed personal-lines rating manuals work. The NUMBERS
 * are illustrative placeholders carried over from the original REVOL Rate
 * Check: replace RATES and each carrier's `auto` / `home` / `bundle` levels
 * with factors derived from the carriers' SERFF filings, keeping the shape.
 *
 * Shared by the browser tools and the server, so no secrets and no server-only
 * imports belong here.
 */

/**
 * Carrier names next to estimated prices. Off while the carrier levels below
 * are placeholders: putting a real company's name beside a price it did not
 * file is exactly what a carrier or the Insurance Administration would object
 * to. Clients still see the spread (Carrier A, B, C…), the bundle-vs-split
 * verdict and what moves their number; the producer confirms real prices.
 * Turn on once the levels come from filings.
 */
export const SHOW_CARRIER_NAMES = false;

/** ± spread around each carrier's point estimate, for the displayed range. */
export const RANGE_SPREAD = 0.11;

export type QuotePath = 'bundle' | 'auto' | 'home';
export type StateCode = 'MD' | 'VA' | 'DC' | 'DE' | 'PA';

export const STATE_NAMES: Record<StateCode, string> = {
  MD: 'Maryland',
  VA: 'Virginia',
  DC: 'DC',
  DE: 'Delaware',
  PA: 'Pennsylvania',
};

/** State minimum liability, per person / per accident / property damage (thousands). */
export const STATE_MINIMUMS: Record<StateCode, string> = {
  MD: '30/60/15',
  VA: '50/100/25',
  DC: '25/50/10',
  DE: '25/50/10',
  PA: '15/30/5',
};

/**
 * Appointed carriers. `auto` / `home` = overall rate level against the market
 * base (null = does not write that line here). `bundle` = multi-policy
 * multiplier. Slugs match lib/carriers.ts and REVOL Team's ins_carriers.
 * PLACEHOLDER LEVELS.
 */
export type RatingCarrier = { slug: string; name: string; auto: number | null; home: number | null; bundle: number | null };

export const RATING_CARRIERS: RatingCarrier[] = [
  { slug: 'aaa', name: 'AAA', auto: 0.96, home: 0.99, bundle: 0.86 },
  { slug: 'travelers', name: 'Travelers', auto: 1.05, home: 0.93, bundle: 0.85 },
  { slug: 'geico', name: 'GEICO', auto: 0.89, home: null, bundle: null },
  { slug: 'progressive', name: 'Progressive', auto: 0.93, home: 1.06, bundle: 0.88 },
  { slug: 'national-general', name: 'National General', auto: 1.03, home: 1.01, bundle: 0.87 },
  { slug: 'liberty-mutual', name: 'Liberty Mutual', auto: 1.08, home: 0.97, bundle: 0.84 },
  { slug: 'universal-property', name: 'Universal Property', auto: null, home: 0.9, bundle: null },
  { slug: 'hartford', name: 'The Hartford', auto: 1.0, home: 0.95, bundle: 0.86 },
  { slug: 'safeco', name: 'Safeco', auto: 1.02, home: 0.98, bundle: 0.85 },
  { slug: 'chubb', name: 'Chubb', auto: 1.24, home: 1.12, bundle: 0.82 },
];

type Band = { max: number; f: number; label: string };

export const RATES = {
  auto: {
    /** 6-month premium per vehicle. */
    base: 640,
    territory: {
      '200': 1.34, '201': 1.22, '202': 1.36, '203': 1.3, '204': 1.28, '205': 1.31,
      '206': 1.14, '207': 1.16, '208': 1.19, '209': 1.21,
      '210': 1.42, '211': 1.44, '212': 1.47, '214': 1.05, '215': 0.98, '216': 0.94,
      '217': 0.96, '218': 0.92, '219': 1.08,
      '220': 1.18, '221': 1.2, '222': 1.17, '223': 1.15, '224': 1.02, '225': 0.95,
      '226': 0.93, '227': 0.97, '228': 0.99, '229': 1.01,
    } as Record<string, number>,
    ageBand: [
      { max: 20, f: 2.35, label: 'under 21' }, { max: 24, f: 1.72, label: '21–24' },
      { max: 29, f: 1.28, label: '25–29' }, { max: 39, f: 1.06, label: '30–39' },
      { max: 54, f: 0.97, label: '40–54' }, { max: 69, f: 0.94, label: '55–69' },
      { max: 999, f: 1.09, label: '70+' },
    ] as Band[],
    coverage: {
      state: { f: 0.58, label: 'State minimum', desc: 'State-minimum liability, no physical damage' },
      standard: { f: 1.0, label: 'Standard', desc: '100/300/100 liability, $500 comp and collision' },
      full: { f: 1.33, label: 'Full protection', desc: '250/500/100 liability, $250 deductible, rental and roadside' },
    },
    vehicleAge: [
      { max: 2, f: 1.18, label: '0–2 yrs old' }, { max: 5, f: 1.06, label: '3–5 yrs old' },
      { max: 10, f: 0.94, label: '6–10 yrs old' }, { max: 999, f: 0.83, label: '11+ yrs old' },
    ] as Band[],
    record: { clean: 0.86, one: 1.24, two: 1.62, three: 2.1 },
    recordLabel: { clean: 'Clean record', one: '1 incident', two: '2 incidents', three: '3+ incidents' },
    prior: { none: 1.31, lt1: 1.12, y1to3: 1.0, gt3: 0.92 },
    priorLabel: { none: 'No current insurance', lt1: 'Insured < 1 yr', y1to3: 'Insured 1–3 yrs', gt3: 'Insured 3+ yrs' },
    homeowner: 0.95,
    multiCar: { 1: 1.0, 2: 0.92, 3: 0.89 } as Record<number, number>,
  },
  home: {
    /** Annual premium per $1,000 of dwelling coverage. */
    basePerK: 3.85,
    territory: {
      '200': 1.12, '201': 1.04, '202': 1.14, '203': 1.09, '204': 1.07, '205': 1.1,
      '206': 1.02, '207': 1.03, '208': 1.05, '209': 1.06,
      '210': 1.28, '211': 1.3, '212': 1.33, '214': 1.18, '215': 1.09, '216': 1.04,
      '217': 1.01, '218': 0.99, '219': 1.21,
      '220': 1.06, '221': 1.08, '222': 1.05, '223': 1.04, '224': 0.98, '225': 0.94,
      '226': 0.92, '227': 0.96, '228': 0.97, '229': 1.0,
    } as Record<string, number>,
    homeAge: [
      { max: 10, f: 0.88, label: 'under 10 yrs' }, { max: 25, f: 0.97, label: '10–25 yrs' },
      { max: 50, f: 1.09, label: '26–50 yrs' }, { max: 999, f: 1.26, label: 'over 50 yrs' },
    ] as Band[],
    roofAge: [
      { max: 5, f: 0.87, label: '0–5 yrs' }, { max: 10, f: 0.95, label: '6–10 yrs' },
      { max: 15, f: 1.08, label: '11–15 yrs' }, { max: 999, f: 1.34, label: '16+ yrs' },
    ] as Band[],
    deductible: {
      '1000': { f: 1.0, label: '$1,000' },
      '2500': { f: 0.89, label: '$2,500' },
      '5000': { f: 0.79, label: '$5,000' },
    } as Record<string, { f: number; label: string }>,
    claims: { none: 0.93, one: 1.19, two: 1.58 },
    claimsLabel: { none: 'No claims (5 yrs)', one: '1 claim', two: '2+ claims' },
  },
};

export type Coverage = keyof typeof RATES.auto.coverage;
export type DrivingRecord = keyof typeof RATES.auto.record;
export type PriorInsurance = keyof typeof RATES.auto.prior;
export type HomeClaims = keyof typeof RATES.home.claims;

export const DWELLING_OPTIONS = [250000, 350000, 450000, 550000, 700000, 900000, 1200000, 1500000];

export type Answers = {
  path: QuotePath;
  zip: string;
  birthYear: string;
  vehicles: string;
  vehicleYear: string;
  coverage: Coverage;
  record: DrivingRecord;
  prior: PriorInsurance;
  ownsHome: boolean;
  dwelling: string;
  yearBuilt: string;
  roofAge: string;
  deductible: string;
  claims: HomeClaims;
};

export const DEFAULT_ANSWERS: Answers = {
  path: 'bundle',
  zip: '',
  birthYear: '',
  vehicles: '1',
  vehicleYear: '',
  coverage: 'standard',
  record: 'clean',
  prior: 'gt3',
  ownsHome: false,
  dwelling: '450000',
  yearBuilt: '',
  roofAge: '8',
  deductible: '1000',
  claims: 'none',
};

const YEAR = new Date().getFullYear();

export const money = (n: number) => '$' + Math.round(n).toLocaleString('en-US');
export const pct = (f: number) => (f >= 1 ? '+' : '−') + Math.round(Math.abs(f - 1) * 100) + '%';

/** Which state a ZIP is in, for the states REVOL writes; 'OUT' for anywhere else. */
export function zipState(zip: string): StateCode | 'OUT' | null {
  if (!/^\d{5}$/.test(zip)) return null;
  const p = Number(zip.slice(0, 3));
  if (p === 201) return 'VA';
  if (p >= 200 && p <= 205) return 'DC';
  if (p >= 206 && p <= 219) return 'MD';
  if (p >= 220 && p <= 246) return 'VA';
  if (p >= 197 && p <= 199) return 'DE';
  if (p >= 150 && p <= 196) return 'PA';
  return 'OUT';
}

function territory(table: Record<string, number>, zip: string) {
  return table[String(zip || '').slice(0, 3)] ?? 1;
}
function band(bands: Band[], v: number) {
  for (const b of bands) if (v <= b.max) return b;
  return bands[bands.length - 1];
}

export type Factor = { key: string; label: string; f: number; line: 'auto' | 'home' };

export function autoFactors(a: Answers): Factor[] {
  const R = RATES.auto;
  const ageB = band(R.ageBand, YEAR - Number(a.birthYear || 1985));
  const vB = band(R.vehicleAge, YEAR - Number(a.vehicleYear || YEAR - 4));
  const veh = Math.min(3, Number(a.vehicles || 1));
  const list: Factor[] = [
    { key: 'territory', label: `Territory · ZIP ${String(a.zip).slice(0, 3)}xx`, f: territory(R.territory, a.zip), line: 'auto' },
    { key: 'age', label: `Driver age ${ageB.label}`, f: ageB.f, line: 'auto' },
    { key: 'coverage', label: `Coverage: ${R.coverage[a.coverage].label}`, f: R.coverage[a.coverage].f, line: 'auto' },
    { key: 'vehicle', label: `Newest vehicle ${vB.label}`, f: vB.f, line: 'auto' },
    { key: 'record', label: R.recordLabel[a.record], f: R.record[a.record], line: 'auto' },
    { key: 'prior', label: R.priorLabel[a.prior], f: R.prior[a.prior], line: 'auto' },
  ];
  // On a bundle the homeowner credit is part of the multi-policy discount instead.
  if (a.path === 'auto' && a.ownsHome) list.push({ key: 'homeowner', label: 'Homeowner credit', f: R.homeowner, line: 'auto' });
  if (veh > 1) list.push({ key: 'multicar', label: `Multi-car (${a.vehicles}${Number(a.vehicles) >= 4 ? '+' : ''} vehicles)`, f: R.multiCar[veh], line: 'auto' });
  return list;
}

/** Annual auto premium at the market base, before carrier level. */
export function rateAuto(a: Answers): number {
  let p = RATES.auto.base;
  for (const x of autoFactors(a)) p *= x.f;
  return p * Number(a.vehicles || 1) * 2;
}

export function homeFactors(a: Answers): Factor[] {
  const R = RATES.home;
  const hB = band(R.homeAge, YEAR - Number(a.yearBuilt || 1995));
  const rB = band(R.roofAge, Number(a.roofAge));
  const ded = R.deductible[a.deductible] ?? R.deductible['1000'];
  return [
    { key: 'territory', label: `Territory · ZIP ${String(a.zip).slice(0, 3)}xx`, f: territory(R.territory, a.zip), line: 'home' },
    { key: 'homeage', label: `Home age ${hB.label}`, f: hB.f, line: 'home' },
    { key: 'roof', label: `Roof age ${rB.label}`, f: rB.f, line: 'home' },
    { key: 'deductible', label: `${ded.label} deductible`, f: ded.f, line: 'home' },
    { key: 'claims', label: R.claimsLabel[a.claims], f: R.claims[a.claims], line: 'home' },
  ];
}

/** Annual homeowners premium at the market base, before carrier level. */
export function rateHome(a: Answers): number {
  let p = (Number(a.dwelling) / 1000) * RATES.home.basePerK;
  for (const x of homeFactors(a)) p *= x.f;
  return p;
}

export type CarrierRow = RatingCarrier & { autoP: number; homeP: number; total: number; saved: number; low: number; high: number };

export type QuoteResult = {
  rows: CarrierRow[];
  split: { auto: { c: RatingCarrier; p: number }; home: { c: RatingCarrier; p: number }; total: number } | null;
  factors: Factor[];
  isBundle: boolean;
  low: number;
  high: number;
  best: CarrierRow;
  worst: CarrierRow;
};

/** Prices the answers across the carriers. `only` limits it to a producer's own appointments. */
export function quoteAll(a: Answers, only?: string[]): QuoteResult | null {
  const wantAuto = a.path !== 'home';
  const wantHome = a.path !== 'auto';
  const isBundle = a.path === 'bundle';
  const pool = RATING_CARRIERS.filter((c) => !only || only.length === 0 || only.includes(c.slug));
  const autoBase = wantAuto ? rateAuto(a) : 0;
  const homeBase = wantHome ? rateHome(a) : 0;

  const rows: CarrierRow[] = pool
    .filter((c) => (!wantAuto || c.auto != null) && (!wantHome || c.home != null))
    .map((c) => {
      const autoP = wantAuto ? autoBase * (c.auto ?? 1) : 0;
      const homeP = wantHome ? homeBase * (c.home ?? 1) : 0;
      const pre = autoP + homeP;
      const total = isBundle ? pre * (c.bundle ?? 1) : pre;
      return { ...c, autoP, homeP, total, saved: pre - total, low: total * (1 - RANGE_SPREAD), high: total * (1 + RANGE_SPREAD) };
    })
    .sort((x, y) => x.total - y.total);
  if (rows.length === 0) return null;

  let split: QuoteResult['split'] = null;
  if (isBundle) {
    const ba = pool.filter((c) => c.auto != null).map((c) => ({ c, p: autoBase * (c.auto as number) })).sort((x, y) => x.p - y.p)[0];
    const bh = pool.filter((c) => c.home != null).map((c) => ({ c, p: homeBase * (c.home as number) })).sort((x, y) => x.p - y.p)[0];
    if (ba && bh) split = { auto: ba, home: bh, total: ba.p + bh.p };
  }

  return {
    rows,
    split,
    factors: [...(wantAuto ? autoFactors(a) : []), ...(wantHome ? homeFactors(a) : [])],
    isBundle,
    low: rows[0].low,
    high: rows[rows.length - 1].high,
    best: rows[0],
    worst: rows[rows.length - 1],
  };
}

/** "Carrier A", "Carrier B"… or the real name once SHOW_CARRIER_NAMES is on. */
export function carrierLabel(row: { name: string }, rank: number): string {
  return SHOW_CARRIER_NAMES ? row.name : `Carrier ${String.fromCharCode(65 + rank)}`;
}

export const PATH_LABELS: Record<QuotePath, string> = { bundle: 'Home + auto', auto: 'Auto', home: 'Home' };

/** Plain-English lines for the producer: what was asked and what it priced at. */
export function summarize(a: Answers, q: QuoteResult | null): string[] {
  const st = zipState(a.zip);
  const lines: string[] = [`Rate check: ${PATH_LABELS[a.path]}, ZIP ${a.zip}${st && st !== 'OUT' ? ` (${st})` : ''}`];
  if (q) {
    // Carrier names stay out of the note while the levels are placeholders, so
    // nobody repeats an invented ranking to the client.
    lines.push(`Estimate shown ${money(q.low)}–${money(q.high)}/yr across ${q.rows.length} carriers; lowest ${money(q.best.total)}`);
    if (q.split) {
      lines.push(`Bundle vs split shown: best bundle ${money(q.best.total)}, best split ${money(q.split.total)} (${q.best.total <= q.split.total ? 'bundle' : 'split'} wins)`);
    }
  }
  if (a.path !== 'home') {
    lines.push(
      `Auto: born ${a.birthYear || '?'}, ${a.vehicles}${a.vehicles === '4' ? '+' : ''} vehicle(s), newest ${a.vehicleYear || '?'}, ` +
        `${RATES.auto.coverage[a.coverage].label}, ${RATES.auto.recordLabel[a.record]}, ${RATES.auto.priorLabel[a.prior]}` +
        (a.path === 'auto' ? `, owns home: ${a.ownsHome ? 'yes' : 'no'}` : ''),
    );
  }
  if (a.path !== 'auto') {
    lines.push(
      `Home: rebuild ${money(Number(a.dwelling))}, built ${a.yearBuilt || '?'}, roof ${a.roofAge} yrs, ` +
        `${(RATES.home.deductible[a.deductible] ?? RATES.home.deductible['1000']).label} deductible, ${RATES.home.claimsLabel[a.claims]}`,
    );
  }
  return lines;
}
