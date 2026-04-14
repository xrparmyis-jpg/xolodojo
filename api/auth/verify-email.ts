import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAppMysqlPool } from '../../server/lib/mysqlPool.js';
import { getAppPublicOrigin } from '../../server/lib/sessionAuth.js';

function redirect(res: VercelResponse, pathWithQuery: string): void {
  const base = getAppPublicOrigin();
  const location = pathWithQuery.startsWith('http') ? pathWithQuery : `${base}${pathWithQuery}`;
  res.status(302);
  res.setHeader('Location', location);
  res.end();
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const tokenRaw = req.query.token;
  const token = typeof tokenRaw === 'string' ? tokenRaw.trim() : '';

  if (!token) {
    redirect(res, '/?authError=verify');
    return;
  }

  try {
    const pool = getAppMysqlPool();
    const [rows] = await pool.query<Record<string, unknown>>(
      'SELECT id, verification_token_expiry FROM users WHERE verification_token = ? LIMIT 1',
      [token]
    );
    const list = rows as Record<string, unknown>[];
    if (!Array.isArray(list) || list.length === 0) {
      redirect(res, '/?authError=verify');
      return;
    }

    const row = list[0];
    const exp = row.verification_token_expiry;
    if (exp != null) {
      const expTime =
        exp instanceof Date ? exp.getTime() : new Date(String(exp)).getTime();
      if (Number.isNaN(expTime) || expTime < Date.now()) {
        redirect(res, '/?authError=expired');
        return;
      }
    }

    await pool.query(
      'UPDATE users SET email_verified_at = UTC_TIMESTAMP(), verification_token = NULL, verification_token_expiry = NULL WHERE verification_token = ?',
      [token]
    );

    redirect(res, '/?verified=1');
  } catch (e) {
    console.error('auth/verify-email:', e);
    redirect(res, '/?authError=verify');
  }
}
