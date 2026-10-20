import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Landing from '@/components/landing/Landing';
import { LANDINGS, isLandingKey, landingsFor, ratingStates } from '@/lib/landing';
import { getActiveProducers, getProducer } from '@/lib/producers';

export const revalidate = 300;

/** Every producer's landing pages, by license: revolinsurance.com/agents/<slug>/<page>. */
export async function generateStaticParams() {
  const producers = await getActiveProducers();
  return producers.flatMap((p) => landingsFor(p).map((tool) => ({ slug: p.slug, tool })));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string; tool: string }> }): Promise<Metadata> {
  const { slug, tool } = await params;
  const p = await getProducer(slug);
  if (!p || !isLandingKey(tool) || !landingsFor(p).includes(tool)) return { title: 'Page not found' };
  const def = LANDINGS[tool];
  return {
    title: `${def.metaTitle} with ${p.name}`,
    description: def.metaDescription,
    openGraph: { title: `${def.metaTitle} · ${p.name}, REVOL Insurance`, description: def.metaDescription, images: p.headshot ? [p.headshot] : undefined },
  };
}

export default async function ProducerLanding({ params }: { params: Promise<{ slug: string; tool: string }> }) {
  const { slug, tool } = await params;
  const p = await getProducer(slug);
  if (!p || !isLandingKey(tool) || !landingsFor(p).includes(tool)) notFound();
  const states = ratingStates(p.statesLicensed);
  return <Landing page={tool} producer={p} states={states.length ? states : ['MD']} />;
}
