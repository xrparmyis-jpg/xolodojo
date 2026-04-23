import { next } from '@vercel/edge';

/**
 * Link previews (Slack, Discord, iMessage, etc.) use these crawlers. Serve OG HTML
 * that includes the pin's NFT image while humans still get the SPA (no ?pin in matcher-only — we check query).
 * @see server/handlers/og/xglobe-pin-html.ts
 */
const CRAWLER_UA =
  /Slackbot|Slack-ImgProxy|facebookexternalhit|Facebot|Twitterbot|LinkedInBot|WhatsApp|Telegram|Discord|SkypeUriPreview|Googlebot|bingbot|applebot|Embedly|Quora|Preview|vkShare|Pinterest|redditbot|SkypeUrlPreview|MicrosoftPreview|opengraph/i;

export const config = {
  matcher: '/xglobe',
};

export default async function middleware(request: Request): Promise<Response> {
  const url = new URL(request.url);
  if (url.pathname !== '/xglobe') {
    return next();
  }
  const pin = url.searchParams.get('pin')?.trim();
  if (!pin) {
    return next();
  }
  const ua = request.headers.get('user-agent') ?? '';
  if (!CRAWLER_UA.test(ua)) {
    return next();
  }
  const api = new URL('/api/og/xglobe-pin-html', url.origin);
  api.searchParams.set('pin', pin);
  return fetch(api.toString(), {
    method: 'GET',
    headers: { Accept: 'text/html' },
  });
}
