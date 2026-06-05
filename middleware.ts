import { comingSoonRewriteResponse, isComingSoonMode } from './lib/coming-soon-proxy';
import { next } from '@vercel/edge';

/**
 * Link previews (Slack, Discord, iMessage, etc.) use these crawlers. Serve OG HTML
 * that includes the pin's NFT image while humans still get the SPA (we check `Xpin` / legacy `pin`).
 * @see server/handlers/og/xglobe-pin-html.ts
 */
const CRAWLER_UA =
  /Slackbot|Slack-ImgProxy|facebookexternalhit|Facebot|Twitterbot|LinkedInBot|WhatsApp|Telegram|Discord|SkypeUriPreview|Googlebot|bingbot|applebot|Embedly|Quora|Preview|vkShare|Pinterest|redditbot|SkypeUrlPreview|MicrosoftPreview|opengraph/i;

export default async function middleware(request: Request): Promise<Response> {
  if (isComingSoonMode()) {
    const rewrite = comingSoonRewriteResponse(request);
    if (rewrite) return rewrite;
    return next();
  }

  const url = new URL(request.url);
  if (url.pathname !== '/xglobe') {
    return next();
  }
  const pin =
    url.searchParams.get('Xpin')?.trim() ||
    url.searchParams.get('pin')?.trim();
  if (!pin) {
    return next();
  }
  const ua = request.headers.get('user-agent') ?? '';
  if (!CRAWLER_UA.test(ua)) {
    return next();
  }
  const api = new URL('/api/og/xglobe-pin-html', url.origin);
  api.searchParams.set('Xpin', pin);
  return fetch(api.toString(), {
    method: 'GET',
    headers: { Accept: 'text/html' },
  });
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
