import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAppMysqlPool } from '../../server/lib/mysqlPool.js';
import { hashPassword } from '../../server/lib/sessionAuth.js';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const body = req.body as Record<string, unknown>;
    const token = typeof body.token === 'string' ? body.token.trim() : '';
    const newPassword =
      typeof body.newPassword === 'string' ? body.newPassword : '';

    if (!token || !newPassword) {
      res.status(400).json({ error: 'Token and new password are required' });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters' });
      return;
    }

    const pool = getAppMysqlPool();
    const [rows] = await pool.query<Record<string, unknown>>(
      `SELECT id
       FROM users
       WHERE reset_token = ?
         AND reset_token_expiry IS NOT NULL
         AND reset_token_expiry > UTC_TIMESTAMP()
       LIMIT 1`,
      [token]
    );
    const list = rows as Record<string, unknown>[];
    if (!Array.isArray(list) || list.length === 0) {
      res.status(400).json({ error: 'Invalid or expired reset token' });
      return;
    }

    const userId = Number(list[0].id);
    await pool.query(
      `UPDATE users
       SET password = ?, reset_token = NULL, reset_token_expiry = NULL
       WHERE id = ?`,
      [hashPassword(newPassword), userId]
    );

    res.status(200).json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('auth/reset-password:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
