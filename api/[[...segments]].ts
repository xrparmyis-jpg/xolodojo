import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createApiApp } from '../server/createApiApp.js';

let appPromise: ReturnType<typeof createApiApp> | null = null;

async function getApp() {
  if (!appPromise) {
    appPromise = createApiApp();
  }
  return appPromise;
}

/**
 * Single serverless entry for all `/api` and `/api/*` paths (Hobby function limit).
 * Optional catch-all preserves the real path for Express routing.
 */
export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  const raw = req.query.segments;
  const parts = raw === undefined ? [] : Array.isArray(raw) ? raw : [raw];
  const path = '/api' + (parts.length > 0 ? '/' + parts.map(String).join('/') : '');
  const searchIdx = (req.url ?? '').indexOf('?');
  const search = searchIdx >= 0 ? (req.url ?? '').slice(searchIdx) : '';
  (req as { url: string }).url = path + search;

  const app = await getApp();
  await new Promise<void>((resolve, reject) => {
    app(req as never, res as never, (err?: unknown) => {
      if (err) reject(err);
      else resolve();
    });
  });
}
