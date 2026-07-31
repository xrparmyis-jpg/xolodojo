import type { VercelRequest, VercelResponse } from '@vercel/node';

type CreateApiApp = typeof import('../server/createApiApp.js').createApiApp;

let appPromise: ReturnType<CreateApiApp> | null = null;

async function getApp() {
  if (!appPromise) {
    // Dynamic import so bootstrap failures can be returned as JSON instead of
    // opaque FUNCTION_INVOCATION_FAILED when the module graph crashes at load.
    const { createApiApp } = await import('../server/createApiApp.js');
    appPromise = createApiApp();
  }
  return appPromise;
}

function envPresence() {
  return {
    hasSUPABASE_URL: Boolean(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL),
    hasSUPABASE_ANON_KEY: Boolean(
      process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
    ),
    hasSUPABASE_SERVICE_ROLE_KEY: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    hasAPP_PUBLIC_URL: Boolean(process.env.APP_PUBLIC_URL),
    hasRESEND_API_KEY: Boolean(process.env.RESEND_API_KEY),
    hasRESEND_FROM: Boolean(process.env.RESEND_FROM || process.env.EMAIL_FROM),
    APP_PUBLIC_URL: process.env.APP_PUBLIC_URL || null,
    VERCEL_ENV: process.env.VERCEL_ENV || null,
    VERCEL_URL: process.env.VERCEL_URL || null,
    NODE_ENV: process.env.NODE_ENV || null,
  };
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

/** After `/api/(.*)` → `/api?p=$1` rewrite, some query keys may exist only on `req.url` helpers — merge for Express. */
function mergeVercelQueryIntoUrl(url: string, query: VercelRequest['query']): string {
  if (!query || typeof query !== 'object') {
    return url;
  }
  try {
    const u = new URL(url, 'http://vc.local');
    for (const [key, val] of Object.entries(query)) {
      if (key === 'p' || val === undefined) {
        continue;
      }
      const v = Array.isArray(val) ? val[0] : val;
      if (typeof v === 'string' && v.length > 0 && !u.searchParams.has(key)) {
        u.searchParams.set(key, v);
      }
    }
    return u.pathname + (u.search ? u.search : '');
  } catch {
    return url;
  }
}

function isHealthRequest(req: VercelRequest, pathUrl: string): boolean {
  if (req.query?.health === '1' || req.query?.debug === 'env') {
    return true;
  }
  try {
    const pathname = new URL(pathUrl, 'http://vc.local').pathname;
    return pathname === '/api/health' || pathname === '/api/debug/env';
  } catch {
    return false;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  try {
    const pathUrl = expressUrlFromVercelRequest(req);
    (req as { url: string }).url = mergeVercelQueryIntoUrl(pathUrl, req.query);

    if (isHealthRequest(req, pathUrl)) {
      res.status(200).json({
        ok: true,
        path: (req as { url: string }).url,
        env: envPresence(),
      });
      return;
    }

    const app = await getApp();
    await new Promise<void>((resolve, reject) => {
      app(req as never, res as never, (err?: unknown) => {
        if (err) reject(err);
        else resolve();
      });
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('api/index bootstrap failure:', err);
    if (!res.headersSent) {
      res.status(500).json({
        error: 'API bootstrap failed',
        details: err.message,
        env: envPresence(),
      });
    }
  }
}
