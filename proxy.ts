import { NextResponse, type NextRequest } from 'next/server';

/**
 * Producer subdomains: ryan-sebeck.revolinsurance.com shows Ryan's page, and
 * ryan-sebeck.revolinsurance.com/auto his auto rate check. The subdomain is the
 * producer's page address from REVOL Team.
 *
 * Each subdomain needs DNS: add it as a domain on the revolinsurance project in
 * Vercel, then the CNAME Vercel shows in GoDaddy. Everything else on a
 * subdomain (the API, images, the legal pages) is the main site as usual, so
 * leads still post to /api/lead and land with that producer in REVOL Team.
 *
 * <slug>.localhost works the same way for testing on a computer.
 */

const TOOLS = new Set(['home-auto', 'auto', 'new-home', 'life']);
// Subdomains that are never a producer.
const RESERVED = new Set(['www', 'app', 'api', 'mail', 'email', 'admin', 'team', 'clients', 'portal', 'quote', 'agents', 'staging', 'dev', 'preview']);

export function proxy(request: NextRequest) {
  const host = (request.headers.get('host') ?? '').toLowerCase().split(':')[0];
  const m = host.match(/^([a-z0-9]+(?:-[a-z0-9]+)*)\.(?:revolinsurance\.com|localhost)$/);
  if (!m || RESERVED.has(m[1])) return NextResponse.next();
  const slug = m[1];
  const path = request.nextUrl.pathname.replace(/\/+$/, '');
  const url = request.nextUrl.clone();
  if (path === '') {
    url.pathname = `/agents/${slug}`;
    return NextResponse.rewrite(url);
  }
  const tool = path.slice(1);
  if (TOOLS.has(tool)) {
    url.pathname = `/agents/${slug}/${tool}`;
    return NextResponse.rewrite(url);
  }
  return NextResponse.next();
}

export const config = {
  // Pages only: never the API, Next's own files, or anything with a file extension.
  matcher: ['/((?!api|_next|.*\\..*).*)'],
};
