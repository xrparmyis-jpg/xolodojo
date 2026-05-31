import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAppPublicOrigin } from '../../lib/getAppPublicOrigin.js';

/** Legacy verify-email redirect — Supabase Auth handles verification via /auth/callback. */
export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const origin = getAppPublicOrigin();
  res.writeHead(302, { Location: `${origin}/auth/callback${req.url?.includes('?') ? req.url.slice(req.url.indexOf('?')) : ''}` });
  res.end();
}
