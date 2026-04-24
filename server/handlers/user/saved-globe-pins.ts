import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { ResultSetHeader } from 'mysql2';
import { getRequestAuth, type RequestAuthState } from '../../lib/sessionAuth.js';
import { getAppMysqlPool } from '../../lib/mysqlPool.js';
import { normalizeWalletAddress } from '../../lib/userPinsRepo.js';
import { normalizeNfTokenId } from '../../../src/utils/nfTokenId.js';

function accountKeyFromAuth(auth: RequestAuthState): string | null {
  if (auth.kind === 'user') {
    return `u:${auth.userId}`;
  }
  if (auth.kind === 'wallet') {
    return `w:${normalizeWalletAddress(auth.walletAddress)}`;
  }
  return null;
}

function parseTokenId(body: unknown): string | null {
  if (!body || typeof body !== 'object') {
    return null;
  }
  const raw = (body as { token_id?: unknown }).token_id;
  if (typeof raw !== 'string') {
    return null;
  }
  const t = normalizeNfTokenId(raw.trim());
  return t.length > 0 ? t : null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET' && req.method !== 'POST' && req.method !== 'DELETE') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const auth = await getRequestAuth(req);
    if (!auth) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const accountKey = accountKeyFromAuth(auth);
    if (!accountKey) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const pool = getAppMysqlPool();

    if (req.method === 'GET') {
      const [rows] = await pool.execute(
        `SELECT b.token_id, b.created_at,
          (SELECT title FROM user_pins WHERE UPPER(TRIM(token_id)) = UPPER(TRIM(b.token_id)) LIMIT 1) AS title,
          (SELECT image_url FROM user_pins WHERE UPPER(TRIM(token_id)) = UPPER(TRIM(b.token_id)) LIMIT 1) AS image_url
         FROM globe_pin_bookmarks b
         WHERE b.account_key = ?
         ORDER BY b.created_at DESC`,
        [accountKey]
      );

      const list = (rows as Record<string, unknown>[]).map(row => ({
        token_id:
          typeof row.token_id === 'string' ? normalizeNfTokenId(row.token_id) : '',
        title: typeof row.title === 'string' ? row.title : null,
        image_url: typeof row.image_url === 'string' ? row.image_url : null,
        created_at:
          row.created_at instanceof Date
            ? row.created_at.toISOString()
            : String(row.created_at ?? ''),
      }));

      res.status(200).json({ success: true, pins: list });
      return;
    }

    const tokenId = parseTokenId(req.body);
    if (!tokenId) {
      res.status(400).json({ error: 'Missing or invalid token_id' });
      return;
    }

    if (req.method === 'POST') {
      try {
        await pool.execute(
          `INSERT INTO globe_pin_bookmarks (account_key, token_id) VALUES (?, ?)`,
          [accountKey, tokenId]
        );
      } catch (e: unknown) {
        const err = e as { code?: string };
        if (err?.code === 'ER_DUP_ENTRY') {
          res.status(200).json({ success: true, already: true });
          return;
        }
        throw e;
      }
      res.status(200).json({ success: true });
      return;
    }

    // DELETE
    const [result] = await pool.execute(
      `DELETE FROM globe_pin_bookmarks WHERE account_key = ? AND UPPER(TRIM(token_id)) = UPPER(?)`,
      [accountKey, tokenId]
    ) as [ResultSetHeader, unknown];
    res.status(200).json({ success: true, removed: (result as ResultSetHeader).affectedRows ?? 0 });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('saved-globe-pins:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
}
