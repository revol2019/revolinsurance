/**
 * The landing pages each producer gets for ads, social posts and email:
 *
 *   /agents/<slug>/home-auto   home and auto rate check, bundle vs split
 *   /agents/<slug>/auto        auto rate check and the liability limits tool
 *   /agents/<slug>/new-home    buyers under contract: rebuild cost, binder by closing
 *   /agents/<slug>/life        life insurance needs calculator
 *
 * The first three need a property & casualty license, the last a life license.
 * The same pages exist without a producer (/home-auto, /auto, /new-home, /life),
 * where leads land in REVOL Team's unassigned queue.
 */

import type { Producer } from './producers';
import type { QuotePath, StateCode } from './rating';

export type LandingKey = 'home-auto' | 'auto' | 'new-home' | 'life';

export type LandingDef = {
  key: LandingKey;
  line: 'pc' | 'life';
  /** Short name, used in the producer's list and the lead note. */
  name: string;
  /** One line for the producer about when to use it. */
  use: string;
  /** One line for visitors, on the producer's main page. */
  blurb: string;
  defaultPath: QuotePath;
  paths: QuotePath[];
  metaTitle: string;
  metaDescription: string;
};

export const LANDINGS: Record<LandingKey, LandingDef> = {
  'home-auto': {
    key: 'home-auto',
    line: 'pc',
    name: 'Home + auto rate check',
    use: 'Your main page. Homeowners comparing rates, renewal season, bundling.',
    blurb: 'Your range across our carriers in about 60 seconds, and whether bundling or splitting wins.',
    defaultPath: 'bundle',
    paths: ['bundle', 'auto', 'home'],
    metaTitle: 'Home and auto rate check',
    metaDescription: 'See what our carriers typically charge for home and auto in about 60 seconds, then get a real quote from one local agent.',
  },
  auto: {
    key: 'auto',
    line: 'pc',
    name: 'Auto rate check',
    use: 'Drivers and renters. Car ads, new-car buyers, rate increases.',
    blurb: 'Compare auto rates, and see what better liability limits really cost.',
    defaultPath: 'auto',
    paths: ['auto'],
    metaTitle: 'Auto insurance rate check',
    metaDescription: 'Compare auto insurance across our carriers in about 60 seconds, and see what better liability limits really cost.',
  },
  'new-home': {
    key: 'new-home',
    line: 'pc',
    name: 'Buying a home',
    use: 'Buyers under contract. Share with Realtors, lenders and title.',
    blurb: 'Rebuild cost, a price before inspection ends, and the binder to your lender on time.',
    defaultPath: 'home',
    paths: ['home', 'bundle'],
    metaTitle: 'Homeowners insurance for buyers',
    metaDescription: 'Under contract? Price the house before inspection ends, and get the binder to your lender and title company on time.',
  },
  life: {
    key: 'life',
    line: 'life',
    name: 'Life insurance needs',
    use: 'Families, new parents, new mortgages.',
    blurb: 'How much coverage your family needs, in two minutes, before any health questions.',
    defaultPath: 'bundle',
    paths: [],
    metaTitle: 'How much life insurance do you need?',
    metaDescription: 'Work out how much life insurance your family needs in two minutes, then get real quotes from a local agent.',
  },
};

export const LANDING_KEYS = Object.keys(LANDINGS) as LandingKey[];

export function isLandingKey(v: string): v is LandingKey {
  return (LANDING_KEYS as string[]).includes(v);
}

/** The landing pages a producer's licenses allow. */
export function landingsFor(p: Pick<Producer, 'licenses'>): LandingKey[] {
  return LANDING_KEYS.filter((k) => p.licenses.includes(LANDINGS[k].line));
}

const KNOWN: StateCode[] = ['MD', 'VA', 'DC', 'DE', 'PA'];

/** A producer's states this site can rate; empty means "any we write in". */
export function ratingStates(states: string[]): StateCode[] {
  return states.map((s) => s.toUpperCase()).filter((s): s is StateCode => (KNOWN as string[]).includes(s));
}

export function landingPath(key: LandingKey, slug?: string | null) {
  return slug ? `/agents/${slug}/${key}` : `/${key}`;
}

/**
 * Top-level paths the site uses. A producer's page address cannot be one of
 * these, or their short link (revolinsurance.com/<address>) would open the
 * site's page instead. REVOL Team keeps the same list.
 */
export const RESERVED_ADDRESSES = ['agents', 'quote', 'claims', 'privacy', 'terms', 'accessibility', 'api', ...LANDING_KEYS];
