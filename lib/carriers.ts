/**
 * Carrier marks.
 *
 * Display rights come from each appointment or the SIAA agreement. Ryan
 * confirmed approval for all ten on 15 Oct 2026.
 *
 * Keep the flag in place: if an appointment lapses or a carrier changes its
 * marketing rules, set `displayApproved: false` and that logo disappears
 * everywhere — the homepage wall and every producer page — without touching
 * any page code.
 */

export type CarrierLine = 'pc' | 'life';

export type Carrier = {
  slug: string;
  name: string;
  logo: string;
  /** Rendered height in px. Logos have wildly different aspect ratios. */
  height: number;
  lines: CarrierLine[];
  displayApproved: boolean;
};

export const CARRIERS: Carrier[] = [
  { slug: 'chubb', name: 'Chubb', logo: '/carriers/chubb.png', height: 32, lines: ['pc', 'life'], displayApproved: true },
  { slug: 'geico', name: 'GEICO', logo: '/carriers/geico.png', height: 34, lines: ['pc'], displayApproved: true },
  { slug: 'aaa', name: 'AAA', logo: '/carriers/aaa.svg', height: 48, lines: ['pc'], displayApproved: true },
  { slug: 'hartford', name: 'The Hartford', logo: '/carriers/hartford.png', height: 48, lines: ['pc', 'life'], displayApproved: true },
  { slug: 'liberty-mutual', name: 'Liberty Mutual', logo: '/carriers/liberty-mutual.png', height: 36, lines: ['pc'], displayApproved: true },
  { slug: 'national-general', name: 'National General', logo: '/carriers/national-general.png', height: 40, lines: ['pc'], displayApproved: true },
  { slug: 'progressive', name: 'Progressive', logo: '/carriers/progressive.png', height: 24, lines: ['pc'], displayApproved: true },
  { slug: 'safeco', name: 'Safeco Insurance', logo: '/carriers/safeco.webp', height: 50, lines: ['pc'], displayApproved: true },
  { slug: 'travelers', name: 'Travelers', logo: '/carriers/travelers.png', height: 30, lines: ['pc'], displayApproved: true },
  { slug: 'universal-property', name: 'Universal Property & Casualty', logo: '/carriers/universal-property.png', height: 50, lines: ['pc'], displayApproved: true },
];

export function approvedCarriers(opts?: { line?: CarrierLine; only?: string[] }): Carrier[] {
  return CARRIERS.filter((c) => {
    if (!c.displayApproved) return false;
    if (opts?.line && !c.lines.includes(opts.line)) return false;
    if (opts?.only && !opts.only.includes(c.slug)) return false;
    return true;
  });
}
