import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAppMysqlPool } from '../../lib/mysqlPool.js';
import { getGlobePinByTokenId } from '../../lib/userPinsRepo.js';
import { normalizeNfTokenId } from '../../../src/utils/nfTokenId.js';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function publicSiteOrigin(): string {
  const v =
    process.env.SITE_URL ||
    process.env.APP_PUBLIC_URL ||
    process.env.VITE_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '') ||
    'https://xolodojo.vercel.app';
  return v.replace(/\/$/, '');
}

function absoluteOgImage(
  siteOrigin: string,
  imageUrl: string | null | undefined
): string {
  const fallback = `${siteOrigin}/team/Cryptonite.jpg`;
  if (typeof imageUrl !== 'string' || !imageUrl.trim()) {
    return fallback;
  }
  const u = imageUrl.trim();
  if (/^https?:\/\//i.test(u)) {
    return u;
  }
  if (u.startsWith('/')) {
    return `${siteOrigin}${u}`;
  }
  return `${siteOrigin}/${u}`;
}

function pinNoteToPlain(text: string | null | undefined, max: number): string {
  if (!text) {
    return '';
  }
  return text
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

const defaultTitle = 'XoloDojo | XGlobe';
const defaultDescription =
  'The Xoloitzquintle Collection: Ancient Legacy, 10,001 Unique XRPL NFTs — explore the globe.';

/**
 * Returns minimal HTML with Open Graph tags for a globe pin. Used by Edge middleware
 * when social crawlers request `/xglobe?pin=...`.
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  if (req.method !== 'GET') {
    res.status(405).end('Method not allowed');
    return;
  }

  const raw = req.query?.pin;
  const rawPin = Array.isArray(raw) ? raw[0] : raw;
  const pin = typeof rawPin === 'string' ? rawPin.trim() : '';
  const siteOrigin = publicSiteOrigin();

  let pageTitle = defaultTitle;
  let description = defaultDescription;
  let imageUrl = `${siteOrigin}/team/Cryptonite.jpg`;
  const canonicalKey = pin ? normalizeNfTokenId(pin) : '';
  const pageUrl = canonicalKey
    ? `${siteOrigin}/xglobe?pin=${encodeURIComponent(canonicalKey)}`
    : `${siteOrigin}/xglobe`;

  if (pin) {
    try {
      const pool = getAppMysqlPool();
      const row = await getGlobePinByTokenId(pool, pin);
      if (row) {
        const t = row.title?.trim();
        pageTitle = t ? `${t} | XGlobe` : 'Xolo pin | XGlobe';
        const plain = pinNoteToPlain(
          typeof row.pin_note === 'string' ? row.pin_note : null,
          220
        );
        description = plain || `A Xolo pin on the globe.`;
        imageUrl = absoluteOgImage(siteOrigin, row.image_url);
      }
    } catch (e) {
      console.error('og xglobe-pin-html:', e);
    }
  }

  const safeTitle = escapeHtml(pageTitle);
  const safeDesc = escapeHtml(description);
  const safeImage = escapeHtml(imageUrl);
  const safePageUrl = escapeHtml(pageUrl);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${safeTitle}</title>
<meta name="description" content="${safeDesc}" />
<link rel="canonical" href="${safePageUrl}" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="XoloDojo" />
<meta property="og:locale" content="en_US" />
<meta property="og:url" content="${safePageUrl}" />
<meta property="og:title" content="${safeTitle}" />
<meta property="og:description" content="${safeDesc}" />
<meta property="og:image" content="${safeImage}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${safeTitle}" />
<meta name="twitter:description" content="${safeDesc}" />
<meta name="twitter:image" content="${safeImage}" />
</head>
<body></body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300');
  res.status(200).send(html);
}
