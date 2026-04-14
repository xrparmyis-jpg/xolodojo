import type { VercelRequest, VercelResponse } from '@vercel/node';
import mysql from 'mysql2/promise';
import { requireSessionUserId } from '../../../server/lib/sessionAuth.js';

let pool: mysql.Pool | null = null;

function getDbDebugInfo() {
  return {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3308'),
    database: process.env.DB_NAME || 'donovan_db',
    nodeEnv: process.env.NODE_ENV || 'development',
    vercelEnv: process.env.VERCEL_ENV || 'local',
  };
}

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
    const userId = await requireSessionUserId(req, res);
    if (userId === null) return;

    // Disconnect all wallets for this user
    await pool.execute(
      'UPDATE user_wallets SET is_connected = false WHERE user_id = ?',
      [userId]
    );

    return res.status(200).json({
      success: true,
      message: 'All wallets disconnected',
    });
  } catch (error: any) {
    console.error('Error disconnecting wallet:', {
      message: error?.message,
      code: error?.code,
      errno: error?.errno,
      sqlState: error?.sqlState,
      sqlMessage: error?.sqlMessage,
      address: error?.address,
      port: error?.port,
      db: getDbDebugInfo(),
    });
    return res
      .status(500)
      .json({ error: 'Internal server error', details: error.message });
  }
}
