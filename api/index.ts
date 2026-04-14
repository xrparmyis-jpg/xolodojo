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
 * Single serverless entry for all `/api/*` traffic.
 * Vercel rewrites `/api/(.*)` → `/api?p=$1` so this file always matches (avoids edge NOT_FOUND when
 * dynamic `api/[...path].ts` is not registered for Vite static output).
 */
function expressUrlFromVercelRequest(req: VercelRequest): string {
  const rawUrl = req.url ?? '/api';
  try {
    const u = new URL(rawUrl, 'http://vc.local');
    const hadP = u.searchParams.has('p');
    const p = u.searchParams.get('p');
    if (hadP) {
      u.searchParams.delete('p');
    }
    if (p != null && p.length > 0) {
      const qs = u.searchParams.toString();
      const segment = p.replace(/^\/+/, '');
      if (segment.split('/').some((s) => s === '..')) {
        return '/api' + (qs ? `?${qs}` : '');
      }
      const path = '/api/' + segment;
      return path + (qs ? `?${qs}` : '');
    }
    const pathname = u.pathname;
    if (pathname.startsWith('/api/') || pathname === '/api') {
      const qs = u.searchParams.toString();
      return pathname + (qs ? `?${qs}` : '');
    }
  } catch {
    /* fall through */
  }
  return rawUrl.startsWith('/api') ? rawUrl : `/api${rawUrl.startsWith('/') ? rawUrl : `/${rawUrl}`}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  (req as { url: string }).url = expressUrlFromVercelRequest(req);

  const app = await getApp();
  await new Promise<void>((resolve, reject) => {
    app(req as never, res as never, (err?: unknown) => {
      if (err) reject(err);
      else resolve();
    });
  });
}
