import type { VercelRequest, VercelResponse } from '@vercel/node';
import mysql from 'mysql2/promise';
import { requireSessionUserId } from '../../server/lib/sessionAuth.js';

let pool: mysql.Pool | null = null;

type ProfileSocials = {
  twitter?: string;
  discord?: string;
  tiktok?: string;
  instagram?: string;
  telegram?: string;
  linkedin?: string;
};

function getPool(): mysql.Pool {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3308'),
      database: process.env.DB_NAME || 'donovan_db',
      user: process.env.DB_USER || 'donovan_user',
      password: process.env.DB_PASSWORD || 'donovan_password',
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
      waitForConnections: true,
      connectionLimit: 1,
      queueLimit: 0,
    });
  }
  return pool;
}

function parsePreferences(preferences: unknown): Record<string, unknown> {
  if (!preferences) return {};
  if (typeof preferences === 'string') {
    try {
      const parsed = JSON.parse(preferences) as unknown;
      return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {};
    } catch {
      return {};
    }
  }
  if (typeof preferences === 'object') return preferences as Record<string, unknown>;
  return {};
}

function sanitizeSocials(input: unknown): ProfileSocials {
  if (!input || typeof input !== 'object') return {};
  const source = input as Record<string, unknown>;
  const keys: Array<keyof ProfileSocials> = ['twitter', 'discord', 'tiktok', 'instagram', 'telegram', 'linkedin'];
  return keys.reduce<ProfileSocials>((acc, key) => {
    const value = source[key];
    if (typeof value !== 'string') return acc;
    const normalized = value.trim().replace(/^@+/, '');
    if (normalized) acc[key] = normalized;
    return acc;
  }, {});
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  const debugParam = Array.isArray(req.query.debug) ? req.query.debug[0] : req.query.debug;
  const testParam = Array.isArray(req.query.test) ? req.query.test[0] : req.query.test;

  if (process.env.NODE_ENV === 'production') {
    if (debugParam === 'env' || testParam === 'connection') {
      res.status(404).json({ error: 'Not found' });
      return;
    }
  }

  if (req.method === 'GET' && debugParam === 'env') {
    res.json({
      hasDB_HOST: !!process.env.DB_HOST,
      hasDB_PORT: !!process.env.DB_PORT,
      hasDB_NAME: !!process.env.DB_NAME,
      hasDB_USER: !!process.env.DB_USER,
      hasDB_PASSWORD: !!process.env.DB_PASSWORD,
      DB_HOST: process.env.DB_HOST ? `${process.env.DB_HOST.substring(0, 3)}***` : 'missing',
      DB_PORT: process.env.DB_PORT || 'missing',
      DB_USER: process.env.DB_USER ? '***set***' : 'missing',
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_ENV: process.env.VERCEL_ENV,
      queryParams: req.query
    });
    return;
  }

  if (req.method === 'GET' && testParam === 'connection') {
    try {
      const pool = getPool();
      await pool.execute('SELECT 1 as test');
      res.json({
        success: true,
        message: 'Database connection successful',
        config: {
          host: process.env.DB_HOST ? `${process.env.DB_HOST.substring(0, 3)}***` : 'missing',
          port: process.env.DB_PORT || 'missing',
          database: process.env.DB_NAME ? '***set***' : 'missing',
          user: process.env.DB_USER ? '***set***' : 'missing'
        }
      });
      return;
    } catch (error: any) {
      console.error('Connection test error:', error);
      res.status(500).json({
        success: false,
        error: 'Connection failed',
        details: error.message,
        code: error.code,
        errno: error.errno
      });
      return;
    }
  }

  if (req.method === 'GET') {
    try {
      const userId = await requireSessionUserId(req, res);
      if (userId === null) return;

      const pool = getPool();
      try {
        const [result] = await pool.execute(
          `SELECT u.id, u.email, u.username, u.name, u.role, u.picture_url, u.email_verified_at, u.created_at, u.updated_at,
 up.bio, up.wallet_address, up.wallet_type, up.preferences
           FROM users u
           LEFT JOIN user_profiles up ON u.id = up.user_id
           WHERE u.id = ?`,
          [userId]
        ) as [any[], any];
        if (!Array.isArray(result) || result.length === 0) {
          res.status(404).json({ error: 'User not found' });
          return;
        }
        res.status(200).json({ success: true, user: result[0] });
        return;
      } catch (dbError: any) {
        res.status(500).json({ error: 'Database error', details: dbError.message });
        return;
      }
    } catch (error: any) {
      res.status(500).json({ error: 'Internal server error', details: error.message });
      return;
    }
  }

  if (req.method === 'PUT') {
    try {
      const userId = await requireSessionUserId(req, res);
      if (userId === null) return;

      const { bio, socials } = req.body as { bio?: string; socials?: unknown };
      const pool = getPool();
      try {
        const [profileResult] = await pool.execute(
          'SELECT preferences FROM user_profiles WHERE user_id = ?',
          [userId]
        ) as [any[], any];
        const currentPreferences =
          Array.isArray(profileResult) && profileResult.length > 0
            ? parsePreferences(profileResult[0].preferences)
            : {};
        const nextPreferences = {
          ...currentPreferences,
          socials: sanitizeSocials(socials),
        };
        await pool.execute(
          `INSERT INTO user_profiles (user_id, bio, preferences, updated_at)
           VALUES (?, ?, ?, CURRENT_TIMESTAMP)
           ON DUPLICATE KEY UPDATE bio = ?, preferences = ?, updated_at = CURRENT_TIMESTAMP`,
          [
            userId,
            bio || null,
            JSON.stringify(nextPreferences),
            bio || null,
            JSON.stringify(nextPreferences),
          ]
        );
        const [result] = await pool.execute(
          `SELECT u.id, u.email, u.username, u.name, u.role, u.picture_url, u.email_verified_at, u.created_at, u.updated_at,
                  up.bio, up.wallet_address, up.wallet_type, up.preferences
           FROM users u
           LEFT JOIN user_profiles up ON u.id = up.user_id
           WHERE u.id = ?`,
          [userId]
        ) as [any[], any];
        res.status(200).json({ success: true, user: Array.isArray(result) && result.length > 0 ? result[0] : null });
        return;
      } catch (dbError: any) {
        res.status(500).json({ error: 'Database error', details: dbError.message });
        return;
      }
    } catch (error: any) {
      res.status(500).json({ error: 'Internal server error', details: error.message });
      return;
    }
  }

  res.status(405).json({ error: 'Method not allowed' });
  return;
}