/**
 * Short link: revolinsurance.com/<page address> shows that producer's page,
 * same as /agents/<page address>. Static routes (/quote, /auto…) always win, so
 * REVOL Team does not hand out page addresses that match them.
 */
export { default, generateMetadata } from '../agents/[slug]/page';

export const revalidate = 300;

export async function generateStaticParams() {
  return [];
}
