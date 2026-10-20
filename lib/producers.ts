/**
 * Producer directory.
 *
 * Source of truth is the REVOL Team `profiles` table. A producer appears on
 * the site when active = true, sells_insurance = true and
 * ins_page_published = true (see supabase/migrations/0003_producer_pages.sql).
 * Their bio, photo, phone, email and social links come straight from what
 * they already entered in REVOL Team.
 *
 * When Supabase is not configured, the site falls back to FALLBACK_PRODUCERS
 * below (empty), so a local build or a preview without credentials still
 * renders — just with the honest empty state.
 */

import 'server-only';
import { cache } from 'react';
import {
  avatarUrl,
  keyIsServerKey,
  keyKind,
  serviceHeaders,
  supabaseConfigured,
  supabaseUrl,
} from './supabase-server';

export type LicenseType = 'pc' | 'life';

export type Producer = {
  /** REVOL Team profile id — what a lead is assigned to. */
  profileId: string | null;
  slug: string;
  name: string;
  title: string;
  licenses: LicenseType[];
  statesLicensed: string[];
  npn: string;
  phone: string;
  email: string;
  bio: string[];
  headshot: string | null;
  calendarUrl: string | null;
  social: { instagram?: string; facebook?: string; linkedin?: string };
  carriers: string[];
  alsoRealEstate: boolean;
};

const FALLBACK_PRODUCERS: Producer[] = [];

// Columns are listed explicitly. The service role sees everything, so this
// list is the boundary between public page data and private profile data.
const PUBLIC_COLUMNS = [
  'id',
  'full_name',
  'title',
  'bio',
  'phone',
  'email',
  'avatar_path',
  'instagram',
  'facebook',
  'linkedin',
  'sells_real_estate',
  'ins_slug',
  'ins_lines',
  'ins_states',
  'npn',
  'ins_carriers',
  'ins_calendar_url',
  'ins_instagram',
  'ins_facebook',
  'ins_linkedin',
  // The producer's insurance email (REVOL Team update 38). Shown on their page
  // and where their leads go; blank falls back to their main email.
  'ins_email',
].join(',');

/** The same list without ins_email, for a database that does not have it yet. */
const COLUMNS_BEFORE_38 = PUBLIC_COLUMNS.split(',').filter((c) => c !== 'ins_email').join(',');

type ProfileRow = {
  id: string;
  full_name: string | null;
  title: string | null;
  bio: string | null;
  phone: string | null;
  email: string | null;
  avatar_path: string | null;
  instagram: string | null;
  facebook: string | null;
  linkedin: string | null;
  sells_real_estate: boolean | null;
  ins_slug: string | null;
  ins_lines: string[] | null;
  ins_states: string[] | null;
  npn: string | null;
  ins_carriers: string[] | null;
  ins_calendar_url: string | null;
  ins_instagram: string | null;
  ins_facebook: string | null;
  ins_linkedin: string | null;
  ins_email?: string | null;
};

/** 4432440155 or (443) 244-0155 or +1 443… → 443-244-0155, the site's style. */
function formatPhone(raw: string | null): string {
  if (!raw) return '';
  const digits = raw.replace(/\D/g, '').replace(/^1(?=\d{10}$)/, '');
  return digits.length === 10 ? `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}` : raw.trim();
}

function toProducer(r: ProfileRow): Producer | null {
  if (!r.ins_slug || !r.full_name) return null;
  const licenses = (r.ins_lines ?? []).filter((l): l is LicenseType => l === 'pc' || l === 'life');
  if (licenses.length === 0) return null;

  return {
    profileId: r.id,
    slug: r.ins_slug,
    name: r.full_name.trim(),
    title: r.title?.trim() || (licenses.includes('pc') ? 'Insurance Producer' : 'Life & Health Producer'),
    licenses,
    statesLicensed: (r.ins_states ?? []).map((s) => s.toUpperCase()),
    npn: r.npn ?? '',
    phone: formatPhone(r.phone),
    email: r.ins_email?.trim() || r.email || '',
    bio: (r.bio ?? '')
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean),
    headshot: avatarUrl(r.avatar_path),
    calendarUrl: r.ins_calendar_url,
    social: {
      instagram: r.ins_instagram ?? r.instagram ?? undefined,
      facebook: r.ins_facebook ?? r.facebook ?? undefined,
      linkedin: r.ins_linkedin ?? r.linkedin ?? undefined,
    },
    carriers: r.ins_carriers ?? [],
    alsoRealEstate: Boolean(r.sells_real_estate),
  };
}

export type ProducerQueryResult = {
  ok: boolean;
  /** HTTP status from Supabase, or null if the request never completed. */
  status: number | null;
  /** Supabase's own error message when the query was rejected. */
  error: string | null;
  rows: number;
  producers: Producer[];
};

/**
 * The one query behind every producer page. Uncached when `fresh` is set,
 * which is what the /api/health check uses.
 */
export async function queryProducers(fresh = false): Promise<ProducerQueryResult> {
  const empty = { rows: 0, producers: FALLBACK_PRODUCERS };

  if (!supabaseConfigured()) {
    console.warn(
      '[producers] Supabase not configured — SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing in this deployment. Showing no producers.',
    );
    return { ok: false, status: null, error: 'not configured', ...empty };
  }
  if (!keyIsServerKey()) {
    console.warn(
      `[producers] SUPABASE_SERVICE_ROLE_KEY looks like a "${keyKind()}" key. Use the service_role (or sb_secret_) key — other keys return zero rows.`,
    );
  }

  try {
    const request = (columns: string) =>
      fetch(
        `${supabaseUrl()}/rest/v1/profiles?${new URLSearchParams({
          select: columns,
          active: 'is.true',
          sells_insurance: 'is.true',
          ins_page_published: 'is.true',
          order: 'full_name.asc',
        })}`,
        {
          headers: serviceHeaders(),
          ...(fresh ? { cache: 'no-store' as const } : { next: { revalidate: 300 } }),
        },
      );
    let res = await request(PUBLIC_COLUMNS);
    // Before update 38 there is no ins_email column; ask again without it rather than show no producers.
    if (res.status === 400) {
      const peek = await res.clone().text().catch(() => '');
      if (/ins_email/.test(peek)) res = await request(COLUMNS_BEFORE_38);
    }
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      let message = body.slice(0, 300);
      try {
        message = (JSON.parse(body) as { message?: string }).message ?? message;
      } catch {
        /* not JSON */
      }
      console.error('[producers] profiles query failed', res.status, message);
      return { ok: false, status: res.status, error: message || `HTTP ${res.status}`, ...empty };
    }
    const data = (await res.json()) as ProfileRow[];
    const producers = data.map(toProducer).filter((p): p is Producer => p !== null);
    if (producers.length === 0) {
      console.warn(`[producers] query ok but 0 published producers (${data.length} rows returned).`);
    }
    return { ok: true, status: res.status, error: null, rows: data.length, producers };
  } catch (err) {
    console.error('[producers] profiles query threw', err);
    return { ok: false, status: null, error: err instanceof Error ? err.message : String(err), ...empty };
  }
}

/**
 * All published producers. Cached per request; pages revalidate every five
 * minutes, so a change in REVOL Team shows on the site within that window.
 */
export const getActiveProducers = cache(async (): Promise<Producer[]> => {
  return (await queryProducers()).producers;
});

export async function getProducer(slug: string): Promise<Producer | null> {
  const all = await getActiveProducers();
  return all.find((p) => p.slug === slug) ?? null;
}

export function hasPC(p: Producer): boolean {
  return p.licenses.includes('pc');
}

export function hasLife(p: Producer): boolean {
  return p.licenses.includes('life');
}

export function licenseLabel(p: Producer): string {
  if (hasPC(p) && hasLife(p)) return 'Property & casualty, life';
  if (hasPC(p)) return 'Property & casualty';
  if (hasLife(p)) return 'Life & health';
  return '';
}
