import type { VercelRequest, VercelResponse } from '@vercel/node';
import mysql from 'mysql2/promise';
import { requireSessionUserId } from '../../../../server/lib/sessionAuth.js';

let pool: mysql.Pool | null = null;

function getPool(): mysql.Pool {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3308'),
      database: process.env.DB_NAME || 'donovan_db',
      user: process.env.DB_USER || 'donovan_user',
      password: process.env.DB_PASSWORD || 'donovan_password',
      ssl:
        process.env.NODE_ENV === 'production'
          ? { rejectUnauthorized: false }
          : undefined,
      waitForConnections: true,
      connectionLimit: 1,
      queueLimit: 0,
    });
  }
  return pool;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const pool = getPool();
    const walletIdParam = Array.isArray(req.query.walletId)
      ? req.query.walletId[0]
      : req.query.walletId;
    const walletId = Number(walletIdParam);

    if (!Number.isFinite(walletId) || walletId <= 0) {
      return res.status(400).json({ error: 'Invalid walletId' });
    }

    const userId = await requireSessionUserId(req, res);
    if (userId === null) return;

    const [walletLookup] = (await pool.execute(
      'SELECT id FROM user_wallets WHERE id = ? AND user_id = ?',
      [walletId, userId]
    )) as [any[], any];

    if (!Array.isArray(walletLookup) || walletLookup.length === 0) {
      return res.status(404).json({ error: 'Wallet not found' });
    }

    await pool.execute(
      'UPDATE user_wallets SET is_connected = false WHERE user_id = ?',
      [userId]
    );

    await pool.execute(
      'UPDATE user_wallets SET is_connected = true WHERE id = ? AND user_id = ?',
      [walletId, userId]
    );

    const [updatedWallet] = (await pool.execute(
      'SELECT * FROM user_wallets WHERE id = ?',
      [walletId]
    )) as [any[], any];

    return res.status(200).json({
      success: true,
      wallet:
        Array.isArray(updatedWallet) && updatedWallet.length > 0
          ? updatedWallet[0]
          : null,
      message: 'Wallet connected',
    });
  } catch (error: any) {
    console.error('Error connecting wallet:', error);
    return res
      .status(500)
      .json({ error: 'Internal server error', details: error.message });
  }
}
