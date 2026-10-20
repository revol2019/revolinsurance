/** Short link: revolinsurance.com/<page address>/<tool>, same as /agents/<page address>/<tool>. */
export { default, generateMetadata } from '../../agents/[slug]/[tool]/page';

export const revalidate = 300;

export async function generateStaticParams() {
  return [];
}
