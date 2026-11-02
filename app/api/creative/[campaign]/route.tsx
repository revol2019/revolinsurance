import { ImageResponse } from 'next/og';
import type { NextRequest } from 'next/server';
import { AGENCY } from '@/lib/agency';
import { campaignFor, isCampaignKey } from '@/lib/campaigns';
import { mergeVars } from '@/components/landing/CampaignLanding';
import { getProducer } from '@/lib/producers';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

export const revalidate = 3600;

/**
 * Branded ad images, generated on demand:
 *   /api/creative/<campaign>?slug=<producer>&size=square|story|link
 *
 *   square  1080×1080  Facebook and Instagram feed, LinkedIn, Nextdoor
 *   story   1080×1920  Instagram Stories and Reels, Facebook Stories, TikTok
 *   link    1200×628   Link previews, Google Display, Facebook link ads
 *
 * A producer's name, phone and headshot are on the image, so each agent's ads
 * are their own. Without a slug it is the agency's version.
 */
const SIZES = { square: [1080, 1080], story: [1080, 1920], link: [1200, 628] } as const;

async function font(weight: 700 | 800) {
  // Archivo, the site's display face, from Google Fonts. If the fetch fails the
  // image still renders in the built-in sans; an ad image must never 500.
  try {
    const css = await fetch(`https://fonts.googleapis.com/css2?family=Archivo:wght@${weight}&display=swap`, { headers: { 'user-agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(4000) }).then((r) => r.text());
    const url = css.match(/src: url\(([^)]+)\) format\('(?:truetype|woff)'\)/)?.[1] ?? css.match(/url\(([^)]+\.(?:ttf|woff))\)/)?.[1];
    if (!url) return null;
    return await fetch(url, { signal: AbortSignal.timeout(4000) }).then((r) => r.arrayBuffer());
  } catch {
    return null;
  }
}

/**
 * The photo behind the ad, as a data URL so the renderer never has to fetch it.
 * Read from public/ first (works locally and on Vercel), then from the site
 * itself; if both fail the ad renders on the gradient alone.
 */
async function photo(name: string, origin: string): Promise<string | null> {
  try {
    const buf = await readFile(path.join(process.cwd(), 'public', 'campaigns', name + '.jpg'));
    return 'data:image/jpeg;base64,' + buf.toString('base64');
  } catch {}
  try {
    const buf = await fetch(origin + '/campaigns/' + name + '.jpg', { signal: AbortSignal.timeout(4000) }).then((r) => (r.ok ? r.arrayBuffer() : null));
    return buf ? 'data:image/jpeg;base64,' + Buffer.from(buf).toString('base64') : null;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ campaign: string }> }) {
  const { campaign } = await params;
  if (!isCampaignKey(campaign)) return new Response('Not found', { status: 404 });
  const q = request.nextUrl.searchParams;
  const size = (q.get('size') ?? 'square') as keyof typeof SIZES;
  if (!SIZES[size]) return new Response('size must be square, story or link', { status: 400 });
  const slug = q.get('slug');
  const producer = slug ? await getProducer(slug) : null;
  if (slug && !producer) return new Response('Producer not found', { status: 404 });
  const v = mergeVars(campaign, producer);
  const c = campaignFor(campaign, v);
  const [w, h] = SIZES[size];
  const story = size === 'story';
  const link = size === 'link';
  const [heavy, bold, bg] = await Promise.all([font(800), font(700), photo(c.creative.photos[size], request.nextUrl.origin)]);
  // Where the dark band sits: over the side away from the photo's subject.
  const focus = c.creative.focus;
  const shade =
    story || size === 'square'
      ? `linear-gradient(180deg, rgba(8,14,26,0.7) 0%, rgba(8,14,26,0.35) 30%, rgba(8,14,26,0.82) 55%, rgba(8,14,26,0.98) 100%)`
      : focus === 'right'
        ? `linear-gradient(90deg, rgba(8,14,26,0.98) 0%, rgba(8,14,26,0.93) 45%, rgba(8,14,26,0.55) 100%)`
        : `linear-gradient(90deg, rgba(8,14,26,0.97) 0%, rgba(8,14,26,0.87) 55%, rgba(8,14,26,0.62) 100%)`;
  const fonts = [heavy ? { name: 'Archivo', data: heavy, weight: 800 as const } : null, bold ? { name: 'Archivo', data: bold, weight: 700 as const } : null].filter(Boolean) as { name: string; data: ArrayBuffer; weight: 700 | 800 }[];
  const pad = link ? 56 : 72;
  const headlineSize = link ? 60 : story ? 96 : 82;
  const subSize = link ? 26 : story ? 40 : 34;

  return new ImageResponse(
    (
      <div
        style={{
          width: w,
          height: h,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: pad,
          fontFamily: 'Archivo',
          color: '#fff',
          position: 'relative',
          background: `linear-gradient(160deg, #0b1424 0%, #10203a 55%, ${c.creative.accent} 140%)`,
        }}
      >
        {bg ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={bg} alt="" width={w} height={h} style={{ position: 'absolute', top: 0, left: 0, width: w, height: h, objectFit: 'cover', objectPosition: focus === 'right' ? '70% 40%' : focus === 'left' ? '30% 40%' : '50% 45%' }} />
        ) : null}
        <div style={{ position: 'absolute', top: 0, left: 0, width: w, height: h, display: 'flex', background: bg ? shade : 'transparent' }} />
        <div style={{ position: 'absolute', left: 0, bottom: 0, width: w, height: 10, display: 'flex', background: c.creative.accent }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', fontSize: link ? 26 : 32, fontWeight: 800, letterSpacing: 5 }}>
            <span>REVOL</span>
            <div style={{ display: 'flex', width: 10, height: 10, borderRadius: 10, background: '#2f74e3', margin: '0 10px 4px' }} />
            <span style={{ fontSize: link ? 14 : 17, letterSpacing: 4, color: '#c3cfe0', fontWeight: 700 }}>INSURANCE</span>
          </div>
          <div style={{ display: 'flex', fontSize: link ? 18 : 22, color: '#c3cfe0', fontWeight: 700 }}>Independent · MD · VA · DC</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: story ? 28 : 20, maxWidth: link ? 760 : 940, marginTop: link ? 0 : 'auto', marginBottom: link ? 0 : story ? 56 : 40 }}>
          <div style={{ display: 'flex', fontSize: headlineSize, fontWeight: 800, lineHeight: 1.02, letterSpacing: -2, textShadow: '0 2px 18px rgba(0,0,0,0.55)' }}>{c.creative.headline}</div>
          <div style={{ display: 'flex', fontSize: subSize, lineHeight: 1.25, color: '#eef3fa', fontWeight: 700, textShadow: '0 1px 12px rgba(0,0,0,0.6)' }}>{c.creative.sub}</div>
          <div style={{ display: 'flex', marginTop: story ? 20 : 8 }}>
            <div style={{ display: 'flex', background: '#fff', color: '#0b1424', borderRadius: 999, padding: link ? '14px 28px' : '20px 36px', fontSize: link ? 24 : 32, fontWeight: 800 }}>{c.creative.cta} →</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '2px solid rgba(255,255,255,0.28)', paddingTop: link ? 20 : 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            {producer?.headshot ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={producer.headshot} alt="" width={link ? 64 : 92} height={link ? 64 : 92} style={{ borderRadius: 999, objectFit: 'cover', border: '3px solid rgba(255,255,255,0.5)' }} />
            ) : null}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', fontSize: link ? 24 : 32, fontWeight: 800 }}>{v.name}</div>
              <div style={{ display: 'flex', fontSize: link ? 18 : 24, color: '#c3cfe0', fontWeight: 700 }}>{producer?.npn ? `Licensed agent · NPN ${producer.npn}` : AGENCY.legalName}</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', fontSize: link ? 26 : 34, fontWeight: 800 }}>{v.phone}</div>
            <div style={{ display: 'flex', fontSize: link ? 18 : 24, color: '#c3cfe0', fontWeight: 700 }}>{v.short}</div>
          </div>
        </div>
      </div>
    ),
    { width: w, height: h, fonts: fonts.length ? fonts : undefined, headers: { 'cache-control': 'public, max-age=3600, s-maxage=86400' } },
  );
}
