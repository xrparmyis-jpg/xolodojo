import type { VercelRequest, VercelResponse } from '@vercel/node';
import mysql from 'mysql2/promise';
import { PIN_NOTE_MAX_LENGTH } from '../../src/constants/pinNote.js';

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
  wallet_address: string;
  issuer: string | null;
  uri: string | null;
  latitude?: number | null;
  longitude?: number | null;
  image_url?: string | null;
  title?: string | null;
  collection_name?: string | null;
  socials?: PinnedNftSocials | null;
  /** Short optional blurb on the globe pin (see PIN_NOTE_MAX_LENGTH). */
  pin_note?: string | null;
  pinned_at: string;
}

interface PinnedNftSocials {
  twitter?: string;
  discord?: string;
  tiktok?: string;
  instagram?: string;
  telegram?: string;
}

function normalizeWalletAddress(value: string): string {
  return value.trim().toLowerCase();
}

function parseOptionalNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
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

const allowedSocialKeys = ['twitter', 'discord', 'tiktok', 'instagram', 'telegram'] as const;

function parsePinnedNftSocials(value: unknown): PinnedNftSocials | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const source = value as Record<string, unknown>;
  const socials = allowedSocialKeys.reduce<PinnedNftSocials>((acc, key) => {
    const nextValue = source[key];
    if (typeof nextValue !== 'string') {
      return acc;
    }

    const normalized = nextValue.trim().replace(/^@+/, '');
    if (!normalized) {
      return acc;
    }

    acc[key] = normalized;
    return acc;
  }, {});

  return Object.keys(socials).length > 0 ? socials : null;
}

function parsePinNote(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const collapsed = value.trim().replace(/\s+/g, ' ');
  if (!collapsed) {
    return null;
  }
  return collapsed.slice(0, PIN_NOTE_MAX_LENGTH);
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
      const walletAddress =
        typeof record.wallet_address === 'string'
          ? normalizeWalletAddress(record.wallet_address)
          : '';
      return {
        token_id:
          typeof record.token_id === 'string' ? record.token_id : '',
        wallet_address: walletAddress,
        issuer:
          typeof record.issuer === 'string' ? record.issuer : null,
        uri: typeof record.uri === 'string' ? record.uri : null,
        latitude: parseOptionalNumber(record.latitude),
        longitude: parseOptionalNumber(record.longitude),
        image_url:
          typeof record.image_url === 'string' ? record.image_url : null,
        title: typeof record.title === 'string' ? record.title : null,
        collection_name:
          typeof record.collection_name === 'string'
            ? record.collection_name
            : null,
        socials: parsePinnedNftSocials(record.socials),
        pin_note: parsePinNote(record.pin_note),
        pinned_at:
          typeof record.pinned_at === 'string'
            ? record.pinned_at
            : new Date().toISOString(),
      };
    })
    .filter(item => item.token_id.length > 0 && item.wallet_address.length > 0);
}

function filterPinnedByWallet(
  pinnedNfts: PinnedNftItem[],
  walletAddress?: string
): PinnedNftItem[] {
  if (!walletAddress) {
    return pinnedNfts;
  }

  const normalizedWalletAddress = normalizeWalletAddress(walletAddress);
  return pinnedNfts.filter(
    item => item.wallet_address === normalizedWalletAddress
  );
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
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const auth0Id =
      req.method === 'GET'
        ? Array.isArray(req.query.auth0_id)
          ? req.query.auth0_id[0]
          : req.query.auth0_id
        : (req.body?.auth0_id as string | undefined);
    const walletAddressInput =
      req.method === 'GET'
        ? Array.isArray(req.query.wallet_address)
          ? req.query.wallet_address[0]
          : req.query.wallet_address
        : (req.body?.wallet_address as string | undefined);
    const walletAddress = walletAddressInput
      ? normalizeWalletAddress(walletAddressInput)
      : undefined;

    if (!auth0Id) {
      res.status(400).json({ error: 'Missing auth0_id' });
      return;
    }

    const { userId, preferences } = await getUserAndPreferences(auth0Id);
    const pinnedNfts = parsePinnedNfts(preferences);
    const scopedPinnedNfts = filterPinnedByWallet(pinnedNfts, walletAddress);

    if (req.method === 'GET') {
      res.status(200).json({ success: true, pinned_nfts: scopedPinnedNfts });
      return;
    }

    if (req.method === 'POST') {
      const nft = req.body?.nft as
        | {
            token_id?: string;
            issuer?: string | null;
            uri?: string | null;
            title?: string | null;
            collection_name?: string | null;
            wallet_address?: string | null;
            latitude?: number | null;
            longitude?: number | null;
            image_url?: string | null;
            socials?: PinnedNftSocials | null;
            pin_note?: string | null;
          }
        | undefined;

      const tokenId = nft?.token_id?.trim();
      if (!tokenId) {
        res.status(400).json({ error: 'Missing nft.token_id' });
        return;
      }

      const pinWalletAddress =
        typeof nft?.wallet_address === 'string'
          ? normalizeWalletAddress(nft.wallet_address)
          : walletAddress;

      if (!pinWalletAddress) {
        res.status(400).json({ error: 'Missing wallet_address for pin operation' });
        return;
      }

      const existing = pinnedNfts.find(
        item =>
          item.token_id === tokenId &&
          item.wallet_address === pinWalletAddress
      );
      const nowIso = new Date().toISOString();
      const latitude = parseOptionalNumber(nft?.latitude);
      const longitude = parseOptionalNumber(nft?.longitude);
      const socials = parsePinnedNftSocials(nft?.socials);
      const resolvePinNote = (previous: string | null | undefined): string | null => {
        if (nft?.pin_note === undefined) {
          return previous ?? null;
        }
        return parsePinNote(nft.pin_note);
      };

      if (latitude == null || longitude == null) {
        res.status(400).json({ error: 'Missing valid nft.latitude or nft.longitude' });
        return;
      }

      if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        res.status(400).json({ error: 'Invalid nft latitude/longitude range' });
        return;
      }

      const nextPinnedNfts = existing
        ? pinnedNfts.map(item =>
            item.token_id === tokenId &&
            item.wallet_address === pinWalletAddress
              ? {
                  ...item,
                  issuer: nft?.issuer ?? item.issuer,
                  uri: nft?.uri ?? item.uri,
                  latitude,
                  longitude,
                  image_url: nft?.image_url ?? item.image_url ?? null,
                  title: nft?.title ?? item.title,
                  collection_name: nft?.collection_name ?? item.collection_name,
                  socials,
                  pin_note: resolvePinNote(item.pin_note),
                }
              : item
          )
        : [
            ...pinnedNfts,
            {
              token_id: tokenId,
              wallet_address: pinWalletAddress,
              issuer: nft?.issuer ?? null,
              uri: nft?.uri ?? null,
              latitude,
              longitude,
              image_url: nft?.image_url ?? null,
              title: nft?.title ?? null,
              collection_name: nft?.collection_name ?? null,
              socials,
              pin_note: resolvePinNote(undefined),
              pinned_at: nowIso,
            },
          ];

      await upsertPreferences(userId, {
        ...preferences,
        pinned_nfts: nextPinnedNfts,
      });

      return res.status(200).json({
        success: true,
        pinned_nfts: filterPinnedByWallet(nextPinnedNfts, pinWalletAddress),
      });
    }

    const tokenId = (req.body?.token_id as string | undefined)?.trim();
    if (!tokenId) {
      return res.status(400).json({ error: 'Missing token_id' });
    }

    if (!walletAddress) {
      return res
        .status(400)
        .json({ error: 'Missing wallet_address for unpin operation' });
    }

    const nextPinnedNfts = pinnedNfts.filter(
      item =>
        !(
          item.token_id === tokenId &&
          item.wallet_address === walletAddress
        )
    );

    await upsertPreferences(userId, {
      ...preferences,
      pinned_nfts: nextPinnedNfts,
    });

    return res.status(200).json({
      success: true,
      pinned_nfts: filterPinnedByWallet(nextPinnedNfts, walletAddress),
    });
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
