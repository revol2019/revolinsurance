import type { Metadata } from 'next';
import Landing from '@/components/landing/Landing';
import { LANDINGS, ratingStates, type LandingKey } from '@/lib/landing';
import { getActiveProducers } from '@/lib/producers';

/** The agency's own version of a landing page: leads go to REVOL Team's unassigned queue. */
export function agencyMetadata(key: LandingKey): Metadata {
  return { title: LANDINGS[key].metaTitle, description: LANDINGS[key].metaDescription };
}

export async function AgencyLanding({ page }: { page: LandingKey }) {
  // Quote anywhere a published producer can write it; Maryland when nobody is published yet.
  const producers = await getActiveProducers();
  const states = ratingStates(Array.from(new Set(producers.flatMap((p) => p.statesLicensed))));
  const order = ['MD', 'VA', 'DC', 'DE', 'PA'];
  states.sort((a, b) => order.indexOf(a) - order.indexOf(b));
  return <Landing page={page} producer={null} states={states.length ? states : ['MD']} />;
}
