/**
 * Server-only access to the REVOL Team Supabase project.
 *
 * Uses the service role key, which bypasses RLS. That is why this file is
 * `server-only` and why every query here names its columns explicitly:
 * the select list, not a policy, is what keeps private profile fields
 * (payroll, comp plan, phone type) off the public site.
 *
 * Never import this from a "use client" component, and never give the key a
 * NEXT_PUBLIC_ prefix.
 */

import 'server-only';

/**
 * Reads an env var and forgives the usual paste mistakes: surrounding
 * whitespace, a trailing newline, or wrapping quotes copied along with the
 * value. Returns '' when unset.
 */
function env(name: string): string {
  return (process.env[name] ?? '').trim().replace(/^["']|["']$/g, '').trim();
}

export function supabaseConfigured(): boolean {
  return Boolean(env('SUPABASE_URL') && env('SUPABASE_SERVICE_ROLE_KEY'));
}

/**
 * The project URL, e.g. https://abcd1234.supabase.co. Also accepts the
 * "API URL" form with /rest/v1 on the end, since the dashboard shows both.
 */
export function supabaseUrl(): string {
  const url = env('SUPABASE_URL');
  if (!url) throw new Error('SUPABASE_URL is not set.');
  return url.replace(/\/+$/, '').replace(/\/rest\/v1$/, '').replace(/\/+$/, '');
}

export type KeyKind = 'missing' | 'service_role' | 'secret' | 'anon' | 'publishable' | 'unknown';

/**
 * What kind of key is in SUPABASE_SERVICE_ROLE_KEY — never the key itself.
 *
 * Only `service_role` (legacy) and `secret` (new) work here. An `anon` or
 * `publishable` key is the easy mistake: it sits right next to the secret
 * one in the dashboard, and with it every query quietly returns zero rows
 * instead of failing, because RLS hides everything from a signed-out caller.
 */
export function keyKind(): KeyKind {
  const key = env('SUPABASE_SERVICE_ROLE_KEY');
  if (!key) return 'missing';
  if (key.startsWith('sb_secret_')) return 'secret';
  if (key.startsWith('sb_publishable_')) return 'publishable';
  if (key.startsWith('eyJ')) {
    try {
      const payload = key.split('.')[1] ?? '';
      const json = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { role?: string };
      if (json.role === 'service_role') return 'service_role';
      if (json.role === 'anon') return 'anon';
    } catch {
      /* fall through */
    }
  }
  return 'unknown';
}

export function keyIsServerKey(): boolean {
  const k = keyKind();
  return k === 'service_role' || k === 'secret';
}

/**
 * Works with either Supabase key format:
 *   - legacy service_role key — a JWT starting "eyJ". Sent on both apikey and
 *     Authorization: Bearer, the long-standing pattern.
 *   - new secret key — starts "sb_secret_". NOT a JWT; Supabase's guidance is
 *     to send it on the apikey header only. Putting it in Authorization: Bearer
 *     gets it parsed as a JWT and rejected.
 * Supabase is deprecating the legacy keys by the end of 2026, so this needs
 * to handle both.
 */
export function serviceHeaders(extra?: Record<string, string>): Record<string, string> {
  const key = env('SUPABASE_SERVICE_ROLE_KEY');
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set.');
  const isJwt = key.startsWith('eyJ');
  return {
    apikey: key,
    ...(isJwt ? { Authorization: `Bearer ${key}` } : {}),
    ...extra,
  };
}

/** Public URL for a file in the public `avatars` bucket. */
export function avatarUrl(path: string | null | undefined): string | null {
  if (!path || !env('SUPABASE_URL')) return null;
  if (path.startsWith('http')) return path;
  return `${supabaseUrl()}/storage/v1/object/public/avatars/${path.replace(/^\/+/, '')}`;
}
