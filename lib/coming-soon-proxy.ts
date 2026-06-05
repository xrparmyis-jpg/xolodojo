import { rewrite } from '@vercel/edge';

/** Static landing page served when COMING_SOON_MODE=1. */
export const COMING_SOON_PATH = '/coming-soon.html';

const STATIC_ASSET =
  /\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff2?|ttf|map|txt|html)$/i;

/**
 * Paths that bypass the coming-soon gate. API routes and static assets must still
 * resolve while the rest of the site is gated.
 */
export function isComingSoonAllowed(pathname: string): boolean {
  if (pathname === COMING_SOON_PATH || pathname === '/coming-soon') {
    return true;
  }
  if (pathname === '/api' || pathname.startsWith('/api/')) {
    return true;
  }
  if (pathname.startsWith('/_vercel/')) {
    return true;
  }
  if (pathname.startsWith('/assets/')) {
    return true;
  }
  if (STATIC_ASSET.test(pathname)) {
    return true;
  }
  return false;
}

/** True only when COMING_SOON_MODE is exactly the string "1". */
export function isComingSoonMode(): boolean {
  return process.env.COMING_SOON_MODE === '1';
}

/**
 * Hosts that always see the full site, even when COMING_SOON_MODE=1.
 * *.vercel.app is excluded so the default deployment URL stays usable for team preview.
 */
export function isComingSoonBypassHost(hostname: string): boolean {
  const host = hostname.toLowerCase().split(':')[0];
  if (host === 'localhost' || host === '127.0.0.1') {
    return true;
  }
  if (host.endsWith('.vercel.app')) {
    return true;
  }
  return false;
}

/**
 * When coming-soon mode is on, rewrite gated requests to the static landing page.
 * Returns null when the request should pass through unchanged.
 */
export function comingSoonRewriteResponse(request: Request): Response | null {
  const url = new URL(request.url);
  if (isComingSoonBypassHost(url.hostname)) {
    return null;
  }
  if (isComingSoonAllowed(url.pathname)) {
    return null;
  }
  return rewrite(new URL(COMING_SOON_PATH, request.url));
}
