import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getGlobePinByQueryParam } from '../../lib/userPinsRepo.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const rawPin = Array.isArray(req.query.Xpin)
      ? req.query.Xpin[0]
      : req.query.Xpin ?? req.query.pin;
    const pin = typeof rawPin === 'string' ? rawPin : '';
    const item = await getGlobePinByQueryParam(pin);
    if (!item) {
      res.status(404).send('Pin not found');
      return;
    }

    const title = item.title?.trim() || 'XoloGlobe Pin';
    const description = item.pin_note?.replace(/<[^>]+>/g, ' ').trim() || title;
    const image = item.image_url?.startsWith('http')
      ? item.image_url
      : item.image_url
        ? `${process.env.APP_PUBLIC_URL || 'https://xolodojo.vercel.app'}${item.image_url}`
        : '';

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(`<!DOCTYPE html>
<html><head>
<meta property="og:title" content="${escapeHtml(title)}" />
<meta property="og:description" content="${escapeHtml(description.slice(0, 200))}" />
${image ? `<meta property="og:image" content="${escapeHtml(image)}" />` : ''}
</head><body></body></html>`);
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    res.status(500).send(err.message);
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
