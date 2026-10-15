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

export function supabaseConfigured(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function supabaseUrl(): string {
  const url = process.env.SUPABASE_URL;
  if (!url) throw new Error('SUPABASE_URL is not set.');
  return url.replace(/\/+$/, '');
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
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
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
  if (!path || !process.env.SUPABASE_URL) return null;
  if (path.startsWith('http')) return path;
  return `${supabaseUrl()}/storage/v1/object/public/avatars/${path.replace(/^\/+/, '')}`;
}
