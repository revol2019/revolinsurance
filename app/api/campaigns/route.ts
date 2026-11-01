import { NextResponse, type NextRequest } from 'next/server';
import { CAMPAIGNS, CAMPAIGN_KEYS, campaignFor, trackedUrl } from '@/lib/campaigns';
import { mergeVars } from '@/components/landing/CampaignLanding';
import { getProducer } from '@/lib/producers';

export const revalidate = 300;

/**
 * The campaign kits, with every merge field filled for one producer:
 *   /api/campaigns?slug=<producer>
 * Without a slug, the agency's version. REVOL Team's Launch a campaign page
 * reads this, so the copy lives in one place.
 */
export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get('slug');
  const producer = slug ? await getProducer(slug) : null;
  if (slug && !producer) return NextResponse.json({ error: 'Producer not found or not published.' }, { status: 404 });
  const origin = 'https://revolinsurance.com';
  const kits = CAMPAIGN_KEYS.map((key) => {
    const v = mergeVars(key, producer, origin);
    const c = campaignFor(key, v);
    const page = v.url;
    return {
      ...c,
      merge: v,
      page,
      links: {
        meta: trackedUrl(page, key, producer?.slug ?? null, 'meta'),
        google: trackedUrl(page, key, producer?.slug ?? null, 'google'),
        organic: trackedUrl(page, key, producer?.slug ?? null, 'organic'),
        text: trackedUrl(page, key, producer?.slug ?? null, 'text'),
        email: trackedUrl(page, key, producer?.slug ?? null, 'email'),
      },
      creatives: {
        square: `${origin}/api/creative/${key}?size=square${slug ? '&slug=' + slug : ''}`,
        story: `${origin}/api/creative/${key}?size=story${slug ? '&slug=' + slug : ''}`,
        link: `${origin}/api/creative/${key}?size=link${slug ? '&slug=' + slug : ''}`,
      },
      source: producer ? `producer-${producer.slug}:${key}` : `web-${key}`,
    };
  });
  return NextResponse.json({ producer: producer ? { slug: producer.slug, name: producer.name } : null, campaigns: kits, keys: Object.keys(CAMPAIGNS) }, { headers: { 'access-control-allow-origin': '*' } });
}
