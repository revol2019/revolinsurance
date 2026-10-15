/**
 * GET /api/health — is this deployment talking to REVOL Team?
 *
 * Open it in a browser. The `diagnosis` line says in plain English what, if
 * anything, needs fixing. It reports only yes/no facts, the kind of key in
 * use (never the key), and the slugs of pages that are already public — no
 * names, emails, phone numbers or anything else from a profile.
 *
 * If this URL itself 404s, the deployment is running code from before this
 * route existed: the latest files haven't reached GitHub yet.
 */

import { NextResponse } from 'next/server';
import { keyIsServerKey, keyKind, serviceHeaders, supabaseConfigured, supabaseUrl } from '@/lib/supabase-server';
import { queryProducers } from '@/lib/producers';

export const dynamic = 'force-dynamic';

const CODE_VERSION = '2026-10-15.3';

type PublishedRow = {
  ins_slug: string | null;
  active: boolean | null;
  sells_insurance: boolean | null;
  ins_lines: string[] | null;
};

export async function GET() {
  const urlSet = Boolean(process.env.SUPABASE_URL?.trim());
  const kind = keyKind();
  const configured = supabaseConfigured();
  let urlLooksRight = false;
  try {
    urlLooksRight = configured && /^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(supabaseUrl());
  } catch {
    urlLooksRight = false;
  }

  const result = configured ? await queryProducers(true) : null;

  // Every row flagged published, before the active/sells_insurance filters,
  // so a page that's missing shows which flag is holding it back.
  let published: { slug: string | null; active: boolean | null; sells_insurance: boolean | null; lines: string[] }[] = [];
  if (configured && result?.ok) {
    try {
      const q = new URLSearchParams({
        select: 'ins_slug,active,sells_insurance,ins_lines',
        ins_page_published: 'is.true',
      });
      const res = await fetch(`${supabaseUrl()}/rest/v1/profiles?${q}`, {
        headers: serviceHeaders(),
        cache: 'no-store',
      });
      if (res.ok) {
        published = ((await res.json()) as PublishedRow[]).map((r) => ({
          slug: r.ins_slug,
          active: r.active,
          sells_insurance: r.sells_insurance,
          lines: r.ins_lines ?? [],
        }));
      }
    } catch {
      /* the main result already explains any failure */
    }
  }

  const onSite = result?.producers.map((p) => p.slug) ?? [];

  let diagnosis: string;
  if (!urlSet && kind === 'missing') {
    diagnosis =
      'Neither SUPABASE_URL nor SUPABASE_SERVICE_ROLE_KEY is set in this deployment. Add both in Vercel → Settings → Environment Variables (tick Production), then Redeploy.';
  } else if (!urlSet) {
    diagnosis = 'SUPABASE_URL is not set in this deployment. Add it in Vercel, then Redeploy.';
  } else if (kind === 'missing') {
    diagnosis = 'SUPABASE_SERVICE_ROLE_KEY is not set in this deployment. Add it in Vercel, then Redeploy.';
  } else if (!urlLooksRight) {
    diagnosis =
      'SUPABASE_URL does not look like https://<project>.supabase.co. Copy the Project URL from Supabase → Project Settings → Data API.';
  } else if (!keyIsServerKey()) {
    diagnosis = `SUPABASE_SERVICE_ROLE_KEY is the wrong key (it's the ${kind} key, which can't see profiles). It must be the service_role key (starts eyJ…) or a secret key (starts sb_secret_). Replace it in Vercel, then Redeploy.`;
  } else if (result && !result.ok) {
    diagnosis =
      result.status === 401 || result.status === 403
        ? 'Supabase rejected the key. Re-copy it from Supabase (no spaces or quotes), replace it in Vercel, then Redeploy.'
        : `Supabase returned an error: ${result.error}`;
  } else if (onSite.length === 0 && published.length === 0) {
    diagnosis =
      'Connected to Supabase, but no profile has ins_page_published = true. Publish one with the SQL update, then reload this page.';
  } else if (onSite.length === 0) {
    diagnosis =
      'Connected, and a profile is published, but it is being filtered out. Check the "published" list below: active and sells_insurance must both be true, and lines must include pc or life.';
  } else {
    diagnosis = `All good. ${onSite.length} producer page(s) live: ${onSite.map((s) => `/agents/${s}`).join(', ')}. A page can take up to five minutes to appear after publishing.`;
  }

  return NextResponse.json(
    {
      diagnosis,
      code: CODE_VERSION,
      commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null,
      environment: process.env.VERCEL_ENV ?? null,
      supabase: {
        urlSet,
        urlLooksRight,
        key: kind,
        query: result ? { ok: result.ok, status: result.status, error: result.error } : null,
      },
      producersOnSite: onSite,
      published,
    },
    { headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } },
  );
}
