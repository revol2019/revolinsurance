/**
 * Producer directory.
 *
 * This file is the stand-in for the REVOL Team profile table. When the phase 2
 * data layer lands, replace the PRODUCERS constant with a Supabase query —
 * nothing else in the site needs to change, because every page reads producers
 * through getProducer / getActiveProducers below.
 *
 * A producer with `active: false` does not render and their URL 404s. That is
 * the switch to flip the day somebody leaves.
 */

export type LicenseType = 'pc' | 'life';

export type Producer = {
  slug: string;
  name: string;
  title: string;
  /** Which quote modules render. Drives the whole page variant. */
  licenses: LicenseType[];
  statesLicensed: string[];
  npn: string;
  phone: string;
  email: string;
  bio: string[];
  headshot: string | null;
  calendarUrl: string | null;
  /** Separate from any real estate handles — insurance pages show these only. */
  social: { instagram?: string; facebook?: string; linkedin?: string };
  /** Carrier slugs from lib/carriers.ts, filtered to real appointments. */
  carriers: string[];
  /** True when the same person is also a licensed REVOL real estate agent. */
  alsoRealEstate: boolean;
  active: boolean;
};

export const PRODUCERS: Producer[] = [];

export function getActiveProducers(): Producer[] {
  return PRODUCERS.filter((p) => p.active);
}

export function getProducer(slug: string): Producer | null {
  return getActiveProducers().find((p) => p.slug === slug) ?? null;
}

export function hasPC(p: Producer): boolean {
  return p.licenses.includes('pc');
}

export function hasLife(p: Producer): boolean {
  return p.licenses.includes('life');
}

/** The variant label used in copy and in the directory. */
export function licenseLabel(p: Producer): string {
  if (hasPC(p) && hasLife(p)) return 'Property & casualty, life';
  if (hasPC(p)) return 'Property & casualty';
  if (hasLife(p)) return 'Life & health';
  return '';
}
