import type { VercelRequest, VercelResponse } from '@vercel/node';
import mysql from 'mysql2/promise';

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

interface PinnedNftItem {
  token_id: string;
  issuer: string | null;
  uri: string | null;
  title?: string | null;
  collection_name?: string | null;
  pinned_at: string;
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

function parsePinnedNfts(preferences: Record<string, unknown>): PinnedNftItem[] {
  const value = preferences.pinned_nfts;
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(item => item && typeof item === 'object')
    .map(item => {
      const record = item as Record<string, unknown>;
      return {
        token_id:
          typeof record.token_id === 'string' ? record.token_id : '',
        issuer:
          typeof record.issuer === 'string' ? record.issuer : null,
        uri: typeof record.uri === 'string' ? record.uri : null,
        title: typeof record.title === 'string' ? record.title : null,
        collection_name:
          typeof record.collection_name === 'string'
            ? record.collection_name
            : null,
        pinned_at:
          typeof record.pinned_at === 'string'
            ? record.pinned_at
            : new Date().toISOString(),
      };
    })
    .filter(item => item.token_id.length > 0);
}

async function getUserAndPreferences(
  auth0Id: string
): Promise<{ userId: number; preferences: Record<string, unknown> }> {
  const dbPool = getPool();

  const [userResult] = (await dbPool.execute(
    'SELECT id FROM users WHERE auth0_id = ?',
    [auth0Id]
  )) as [any[], any];

  if (!Array.isArray(userResult) || userResult.length === 0) {
    throw new Error('USER_NOT_FOUND');
  }

  const userId = userResult[0].id as number;

  const [profileResult] = (await dbPool.execute(
    'SELECT preferences FROM user_profiles WHERE user_id = ?',
    [userId]
  )) as [any[], any];

  const preferences =
    Array.isArray(profileResult) && profileResult.length > 0
      ? parsePreferences(profileResult[0].preferences)
      : {};

  return { userId, preferences };
}

async function upsertPreferences(
  userId: number,
  preferences: Record<string, unknown>
): Promise<void> {
  const dbPool = getPool();
  const preferencesJson = JSON.stringify(preferences);

  await dbPool.execute(
    `INSERT INTO user_profiles (user_id, preferences, updated_at)
     VALUES (?, ?, CURRENT_TIMESTAMP)
     ON DUPLICATE KEY UPDATE preferences = ?, updated_at = CURRENT_TIMESTAMP`,
    [userId, preferencesJson, preferencesJson]
  );
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET' && req.method !== 'POST' && req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const auth0Id =
      req.method === 'GET'
        ? Array.isArray(req.query.auth0_id)
          ? req.query.auth0_id[0]
          : req.query.auth0_id
        : (req.body?.auth0_id as string | undefined);

    if (!auth0Id) {
      return res.status(400).json({ error: 'Missing auth0_id' });
    }

    const { userId, preferences } = await getUserAndPreferences(auth0Id);
    const pinnedNfts = parsePinnedNfts(preferences);

    if (req.method === 'GET') {
      return res.status(200).json({ success: true, pinned_nfts: pinnedNfts });
    }

    if (req.method === 'POST') {
      const nft = req.body?.nft as
        | {
            token_id?: string;
            issuer?: string | null;
            uri?: string | null;
            title?: string | null;
            collection_name?: string | null;
          }
        | undefined;

      const tokenId = nft?.token_id?.trim();
      if (!tokenId) {
        return res.status(400).json({ error: 'Missing nft.token_id' });
      }

      const existing = pinnedNfts.find(item => item.token_id === tokenId);
      const nowIso = new Date().toISOString();
      const nextPinnedNfts = existing
        ? pinnedNfts.map(item =>
            item.token_id === tokenId
              ? {
                  ...item,
                  issuer: nft?.issuer ?? item.issuer,
                  uri: nft?.uri ?? item.uri,
                  title: nft?.title ?? item.title,
                  collection_name: nft?.collection_name ?? item.collection_name,
                }
              : item
          )
        : [
            ...pinnedNfts,
            {
              token_id: tokenId,
              issuer: nft?.issuer ?? null,
              uri: nft?.uri ?? null,
              title: nft?.title ?? null,
              collection_name: nft?.collection_name ?? null,
              pinned_at: nowIso,
            },
          ];

      await upsertPreferences(userId, {
        ...preferences,
        pinned_nfts: nextPinnedNfts,
      });

      return res.status(200).json({ success: true, pinned_nfts: nextPinnedNfts });
    }

    const tokenId = (req.body?.token_id as string | undefined)?.trim();
    if (!tokenId) {
      return res.status(400).json({ error: 'Missing token_id' });
    }

    const nextPinnedNfts = pinnedNfts.filter(item => item.token_id !== tokenId);

    await upsertPreferences(userId, {
      ...preferences,
      pinned_nfts: nextPinnedNfts,
    });

    return res.status(200).json({ success: true, pinned_nfts: nextPinnedNfts });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));

    if (err.message === 'USER_NOT_FOUND') {
      return res.status(404).json({ error: 'User not found' });
    }

    console.error('Error handling pinned NFTs:', err);
    return res
      .status(500)
      .json({ error: 'Internal server error', details: err.message });
  }
}
