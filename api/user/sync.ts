import type { VercelRequest, VercelResponse } from '@vercel/node';
import mysql from 'mysql2/promise';

// Initialize MySQL connection pool
// In production, use connection pooling with environment variables
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
      connectionLimit: 1, // Limit connections for serverless
      queueLimit: 0,
    });
  }
  return pool;
}

interface Auth0User {
  sub: string;
  email?: string;
  name?: string;
  picture?: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    // Authorization is optional for local development
    // In production, you should verify the Auth0 token here
    const authHeader = req.headers.authorization;

    const userData: Auth0User = req.body;
    console.log('API sync: Received user data:', {
      sub: userData.sub,
      email: userData.email,
    });

    if (!userData.sub) {
      res.status(400).json({ error: 'Missing user.sub (Auth0 ID)' });
      return;
    }

    const pool = getPool();
    const dbConfig = {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || '3308',
      database: process.env.DB_NAME || 'donovan_db',
      user: process.env.DB_USER || 'donovan_user',
      hasPassword: !!process.env.DB_PASSWORD,
      nodeEnv: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV,
    };
    console.log('API sync: Connecting to database:', dbConfig);
    console.log('API sync: Environment check:', {
      hasDB_HOST: !!process.env.DB_HOST,
      hasDB_PORT: !!process.env.DB_PORT,
      hasDB_NAME: !!process.env.DB_NAME,
      hasDB_USER: !!process.env.DB_USER,
      hasDB_PASSWORD: !!process.env.DB_PASSWORD,
    });

    try {
      // Check if user already exists
      console.log('API sync: Checking if user exists:', userData.sub);
      const [existingUser] = (await pool.execute(
        'SELECT id FROM users WHERE auth0_id = ?',
        [userData.sub]
      )) as [any[], any];

      console.log('API sync: Existing user check:', {
        found: Array.isArray(existingUser) && existingUser.length > 0,
      });

      let userId: number;

      if (Array.isArray(existingUser) && existingUser.length > 0) {
        // User exists, update their info
        userId = existingUser[0].id;
        await pool.execute(
          `UPDATE users 
           SET email = ?, name = ?, picture_url = ?, updated_at = CURRENT_TIMESTAMP
           WHERE auth0_id = ?`,
          [
            userData.email || null,
            userData.name || null,
            userData.picture || null,
            userData.sub,
          ]
        );
      } else {
        // Create new user
        const [result] = (await pool.execute(
          `INSERT INTO users (auth0_id, email, name, picture_url)
           VALUES (?, ?, ?, ?)`,
          [
            userData.sub,
            userData.email || null,
            userData.name || null,
            userData.picture || null,
          ]
        )) as [any, any];
        userId = result.insertId;

        // Create empty user profile
        await pool.execute(
          `INSERT INTO user_profiles (user_id, preferences)
           VALUES (?, '{}')
           ON DUPLICATE KEY UPDATE user_id = user_id`,
          [userId]
        );
      }

      // Get full user data
      const [userResult] = (await pool.execute(
        `SELECT u.*, up.bio, up.wallet_address, up.wallet_type, up.preferences
         FROM users u
         LEFT JOIN user_profiles up ON u.id = up.user_id
         WHERE u.id = ?`,
        [userId]
      )) as [any[], any];

      res.status(200).json({
        success: true,
        user:
          Array.isArray(userResult) && userResult.length > 0
            ? userResult[0]
            : null,
        isNewUser: !Array.isArray(existingUser) || existingUser.length === 0,
      });
      return;
    } catch (dbError: any) {
      console.error('API sync: Database error:', dbError);
      console.error('API sync: Database error details:', {
        message: dbError.message,
        code: dbError.code,
        errno: dbError.errno,
        sqlState: dbError.sqlState,
        sqlMessage: dbError.sqlMessage,
        stack: dbError.stack,
      });
      console.error('API sync: Database config at error time:', {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        hasPassword: !!process.env.DB_PASSWORD,
      });
      res.status(500).json({
        error: 'Database error',
        details: dbError.message,
        code: dbError.code,
        ...(process.env.NODE_ENV !== 'production' && {
          config: {
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            database: process.env.DB_NAME,
            user: process.env.DB_USER,
          },
        }),
      });
      return;
    }
  } catch (error: any) {
    console.error('API error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
    return;
  }
}
