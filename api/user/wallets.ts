import type { VercelRequest, VercelResponse } from '@vercel/node';
import mysql from 'mysql2/promise';
import { resolveCanonicalClassicAddress } from '../../server/xrplClassicAddress.js';

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

function parsePreferences(preferences: unknown): Record<string, unknown> {
  if (!preferences) {
    return {};
  }

  if (typeof preferences === 'string') {
    try {
      const parsed = JSON.parse(preferences) as unknown;
      return parsed && typeof parsed === 'object'
        ? (parsed as Record<string, unknown>)
        : {};
    } catch {
      return {};
    }
  }

  if (typeof preferences === 'object') {
    return preferences as Record<string, unknown>;
  }

  return {};
}

function isLikelyXrplAddress(value: string): boolean {
  return /^r[1-9A-HJ-NP-Za-km-z]{24,34}$/.test(value.trim());
}

function normalizeWalletAddressForStorage(
  value: string,
  walletType?: string
): string {
  const trimmed = value.trim();
  if (walletType === 'xaman' || walletType === 'joey') {
    const resolved = resolveCanonicalClassicAddress(trimmed);
    if (!resolved) {
      throw new Error('INVALID_XRPL_ADDRESS_CHECKSUM');
    }
    return resolved;
  }
  if (isLikelyXrplAddress(trimmed)) {
    const resolved = resolveCanonicalClassicAddress(trimmed);
    return resolved ?? trimmed;
  }

  return trimmed.toLowerCase();
}

function normalizeWalletAddressForComparison(value: string): string {
  return value.trim().toLowerCase();
}

function parseWalletLabels(preferences: Record<string, unknown>): Record<string, string> {
  const walletLabelsRaw = preferences.wallet_labels;
  if (!walletLabelsRaw || typeof walletLabelsRaw !== 'object') {
    return {};
  }

  const source = walletLabelsRaw as Record<string, unknown>;
  return Object.entries(source).reduce<Record<string, string>>((acc, [key, value]) => {
    if (typeof value !== 'string') {
      return acc;
    }

    const normalizedKey = normalizeWalletAddressForComparison(key);
    const normalizedLabel = value.trim();
    if (!normalizedKey || !normalizedLabel) {
      return acc;
    }

    acc[normalizedKey] = normalizedLabel;
    return acc;
  }, {});
}

async function getUserPreferences(pool: mysql.Pool, userId: number): Promise<Record<string, unknown>> {
  const [profileResult] = (await pool.execute(
    'SELECT preferences FROM user_profiles WHERE user_id = ?',
    [userId]
  )) as [any[], any];

  if (!Array.isArray(profileResult) || profileResult.length === 0) {
    return {};
  }

  return parsePreferences(profileResult[0].preferences);
}

async function upsertUserPreferences(pool: mysql.Pool, userId: number, preferences: Record<string, unknown>) {
  const preferencesJson = JSON.stringify(preferences);
  await pool.execute(
    `INSERT INTO user_profiles (user_id, preferences, updated_at)
     VALUES (?, ?, CURRENT_TIMESTAMP)
     ON DUPLICATE KEY UPDATE preferences = ?, updated_at = CURRENT_TIMESTAMP`,
    [userId, preferencesJson, preferencesJson]
  );
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const pool = getPool();

  // Get all wallets for a user
  if (req.method === 'GET') {
    try {
      const auth0Id = Array.isArray(req.query.auth0_id)
        ? req.query.auth0_id[0]
        : req.query.auth0_id;
      if (!auth0Id) {
        return res.status(400).json({ error: 'Missing auth0_id' });
      }

      const [userResult] = (await pool.execute(
        'SELECT id FROM users WHERE auth0_id = ?',
        [auth0Id]
      )) as [any[], any];

      if (!Array.isArray(userResult) || userResult.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      const userId = userResult[0].id;

      const [result] = (await pool.execute(
        `SELECT uw.* FROM user_wallets uw
         JOIN users u ON uw.user_id = u.id
         WHERE u.auth0_id = ?
         ORDER BY uw.updated_at DESC`,
        [auth0Id]
      )) as [any[], any];

      const preferences = await getUserPreferences(pool, userId);
      const walletLabels = parseWalletLabels(preferences);
      const wallets = (Array.isArray(result) ? result : []).map((wallet) => {
        const normalizedAddress = typeof wallet.wallet_address === 'string'
          ? normalizeWalletAddressForComparison(wallet.wallet_address)
          : '';

        return {
          ...wallet,
          wallet_label: walletLabels[normalizedAddress] ?? null,
        };
      });

      res.status(200).json({
        success: true,
        wallets,
      });
      return;
    } catch (error: any) {
      console.error('Error fetching wallets:', {
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

  // Add a new wallet
  if (req.method === 'POST') {
    try {
      const { auth0_id, wallet_address, wallet_type, wallet_label } = req.body;
      if (!auth0_id || !wallet_address || !wallet_type) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }

      // Get user ID
      const [userResult] = (await pool.execute(
        'SELECT id FROM users WHERE auth0_id = ?',
        [auth0_id]
      )) as [any[], any];

      if (!Array.isArray(userResult) || userResult.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      const userId = userResult[0].id;
      let normalizedWalletAddress: string;
      try {
        normalizedWalletAddress = normalizeWalletAddressForStorage(
          wallet_address,
          wallet_type
        );
      } catch (normalizeErr) {
        const msg =
          normalizeErr instanceof Error && normalizeErr.message === 'INVALID_XRPL_ADDRESS_CHECKSUM'
            ? 'Invalid XRPL address (checksum). Copy the address from your wallet; do not type it manually.'
            : normalizeErr instanceof Error
              ? normalizeErr.message
              : String(normalizeErr);
        res.status(400).json({ error: msg });
        return;
      }
      const comparisonWalletAddress = normalizeWalletAddressForComparison(wallet_address);

      // Check if wallet already exists, ignoring case so legacy XRPL rows still match.
      const [existingWallets] = (await pool.execute(
        'SELECT id, wallet_address FROM user_wallets WHERE user_id = ?',
        [userId]
      )) as [any[], any];

      const duplicateWallet = (Array.isArray(existingWallets) ? existingWallets : []).find(
        (wallet) =>
          typeof wallet.wallet_address === 'string' &&
          normalizeWalletAddressForComparison(wallet.wallet_address) === comparisonWalletAddress
      );

      if (duplicateWallet) {
        let preferences = await getUserPreferences(pool, userId);
        if (typeof wallet_label === 'string' && wallet_label.trim()) {
          const existingLabelsRaw = preferences.wallet_labels;
          const existingLabels =
            existingLabelsRaw && typeof existingLabelsRaw === 'object'
              ? (existingLabelsRaw as Record<string, unknown>)
              : {};
          preferences = {
            ...preferences,
            wallet_labels: {
              ...existingLabels,
              [comparisonWalletAddress]: wallet_label.trim(),
            },
          };
          await upsertUserPreferences(pool, userId, preferences);
          preferences = await getUserPreferences(pool, userId);
        }

        const [duplicateRow] = (await pool.execute(
          'SELECT * FROM user_wallets WHERE id = ? AND user_id = ?',
          [duplicateWallet.id, userId]
        )) as [any[], any];
        const walletRow =
          Array.isArray(duplicateRow) && duplicateRow.length > 0 ? duplicateRow[0] : null;
        if (!walletRow) {
          res.status(500).json({ error: 'Internal server error' });
          return;
        }
        const walletLabels = parseWalletLabels(preferences);
        const normalizedAddr = normalizeWalletAddressForComparison(walletRow.wallet_address);
        res.status(200).json({
          success: true,
          wallet: {
            ...walletRow,
            wallet_label: walletLabels[normalizedAddr] ?? null,
          },
          message: 'Wallet is now connected.',
          already_exists: true,
        });
        return;
      }

      // Insert new wallet (default: is_connected = false)
      const [insertResult] = (await pool.execute(
        `INSERT INTO user_wallets (user_id, wallet_address, wallet_type, is_connected)
         VALUES (?, ?, ?, false)`,
        [userId, normalizedWalletAddress, wallet_type]
      )) as [any, any];

      if (typeof wallet_label === 'string' && wallet_label.trim()) {
        const preferences = await getUserPreferences(pool, userId);
        const existingLabelsRaw = preferences.wallet_labels;
        const existingLabels =
          existingLabelsRaw && typeof existingLabelsRaw === 'object'
            ? (existingLabelsRaw as Record<string, unknown>)
            : {};

        await upsertUserPreferences(pool, userId, {
          ...preferences,
          wallet_labels: {
            ...existingLabels,
            [comparisonWalletAddress]: wallet_label.trim(),
          },
        });
      }

      // Get the inserted wallet
      const [newWallet] = (await pool.execute(
        'SELECT * FROM user_wallets WHERE id = ?',
        [insertResult.insertId]
      )) as [any[], any];

      res.status(201).json({
        success: true,
        wallet:
          Array.isArray(newWallet) && newWallet.length > 0
            ? {
                ...newWallet[0],
                wallet_label: typeof wallet_label === 'string' ? wallet_label.trim() || null : null,
              }
            : null,
        message: 'Wallet added successfully',
      });
      return;
    } catch (error: any) {
      console.error('Error adding wallet:', {
        message: error?.message,
        code: error?.code,
        errno: error?.errno,
        sqlState: error?.sqlState,
        sqlMessage: error?.sqlMessage,
        address: error?.address,
        port: error?.port,
        db: getDbDebugInfo(),
      });
      res.status(500).json({ error: 'Internal server error', details: error.message });
      return;
    }
  }

  res.status(405).json({ error: 'Method not allowed' });
  return;
}
