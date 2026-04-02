import type { VercelRequest, VercelResponse } from '@vercel/node';
import mysql from 'mysql2/promise';
import { PIN_NOTE_MAX_LENGTH } from '../../src/constants/pinNote.js';

let pool: mysql.Pool | null = null;

function getPool(): mysql.Pool {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3308', 10),
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

interface XoloGlobePin {
  token_id: string;
  wallet_address: string;
  issuer: string | null;
  uri: string | null;
  latitude: number;
  longitude: number;
  image_url: string | null;
  title: string | null;
  collection_name: string | null;
  socials?: XoloGlobePinSocials | null;
  pin_note?: string | null;
  pinned_at: string;
}

interface XoloGlobePinSocials {
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

const allowedSocialKeys = [
  'twitter',
  'discord',
  'tiktok',
  'instagram',
  'telegram',
] as const;

function parsePinSocials(value: unknown): XoloGlobePinSocials | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const source = value as Record<string, unknown>;
  const socials = allowedSocialKeys.reduce<XoloGlobePinSocials>((acc, key) => {
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
  const normalized = value.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
  if (!normalized) {
    return null;
  }
  return normalized.slice(0, PIN_NOTE_MAX_LENGTH);
}

function parsePinnedNfts(preferences: Record<string, unknown>): XoloGlobePin[] {
  const value = preferences.pinned_nfts;
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(item => item && typeof item === 'object')
    .map(item => {
      const record = item as Record<string, unknown>;
      const latitude = parseOptionalNumber(record.latitude);
      const longitude = parseOptionalNumber(record.longitude);
      const walletAddress =
        typeof record.wallet_address === 'string'
          ? normalizeWalletAddress(record.wallet_address)
          : '';

      return {
        token_id: typeof record.token_id === 'string' ? record.token_id : '',
        wallet_address: walletAddress,
        issuer: typeof record.issuer === 'string' ? record.issuer : null,
        uri: typeof record.uri === 'string' ? record.uri : null,
        latitude: latitude ?? NaN,
        longitude: longitude ?? NaN,
        image_url:
          typeof record.image_url === 'string' ? record.image_url : null,
        title: typeof record.title === 'string' ? record.title : null,
        collection_name:
          typeof record.collection_name === 'string'
            ? record.collection_name
            : null,
        socials: parsePinSocials(record.socials),
        pin_note: parsePinNote(record.pin_note),
        pinned_at:
          typeof record.pinned_at === 'string'
            ? record.pinned_at
            : new Date().toISOString(),
      };
    })
    .filter(
      item =>
        item.token_id.length > 0 &&
        item.wallet_address.length > 0 &&
        Number.isFinite(item.latitude) &&
        Number.isFinite(item.longitude)
    );
}

function toUniquePins(items: XoloGlobePin[]): XoloGlobePin[] {
  const seen = new Set<string>();
  const unique: XoloGlobePin[] = [];

  for (const item of items) {
    const key = `${item.wallet_address}:${item.token_id}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    unique.push(item);
  }

  return unique;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const dbPool = getPool();
    const [rows] = (await dbPool.execute(
      'SELECT preferences FROM user_profiles WHERE preferences IS NOT NULL'
    )) as [{ preferences: unknown }[], any];

    const allPins = rows.flatMap(row => {
      const preferences = parsePreferences(row.preferences);
      return parsePinnedNfts(preferences);
    });

    const uniquePins = toUniquePins(allPins).sort((left, right) => {
      return (
        new Date(right.pinned_at).getTime() - new Date(left.pinned_at).getTime()
      );
    });

    res.status(200).json({
      success: true,
      pins: uniquePins,
    });
    return;
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('Error loading Xglobe pins:', err);
    res
      .status(500)
      .json({ error: 'Internal server error', details: err.message });
    return;
  }
}
