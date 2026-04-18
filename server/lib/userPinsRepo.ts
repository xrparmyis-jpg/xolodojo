import type mysql from 'mysql2/promise';
import type { ResultSetHeader } from 'mysql2';

export interface PinnedNftSocials {
  twitter?: string;
  discord?: string;
  tiktok?: string;
  instagram?: string;
  telegram?: string;
  linkedin?: string;
}

/** API / DB shape for one globe pin (matches prior `preferences.pinned_nfts[]`). */
export interface PinnedNftItem {
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
  pin_note?: string | null;
  website_url?: string | null;
  pinned_at: string;
}

export function normalizeWalletAddress(value: string): string {
  return value.trim().toLowerCase();
}

function toFiniteNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function parseSocialsFromDb(value: unknown): PinnedNftSocials | null {
  if (value == null) {
    return null;
  }
  let obj: unknown = value;
  if (typeof value === 'string') {
    try {
      obj = JSON.parse(value) as unknown;
    } catch {
      return null;
    }
  }
  if (!obj || typeof obj !== 'object') {
    return null;
  }
  const source = obj as Record<string, unknown>;
  const allowed = [
    'twitter',
    'discord',
    'tiktok',
    'instagram',
    'telegram',
    'linkedin',
  ] as const;
  const socials = allowed.reduce<PinnedNftSocials>((acc, key) => {
    const v = source[key];
    if (typeof v !== 'string') {
      return acc;
    }
    const t = v.trim().replace(/^@+/, '');
    if (!t) {
      return acc;
    }
    acc[key] = t;
    return acc;
  }, {});
  return Object.keys(socials).length > 0 ? socials : null;
}

function pinnedAtToIso(value: unknown): string {
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === 'string' && value.length > 0) {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) {
      return d.toISOString();
    }
    return value;
  }
  return new Date().toISOString();
}

function mapRow(row: Record<string, unknown>): PinnedNftItem {
  const lat = toFiniteNumber(row.latitude);
  const lng = toFiniteNumber(row.longitude);
  return {
    token_id: typeof row.token_id === 'string' ? row.token_id : '',
    wallet_address:
      typeof row.wallet_address === 'string'
        ? normalizeWalletAddress(row.wallet_address)
        : '',
    issuer: typeof row.issuer === 'string' ? row.issuer : null,
    uri: typeof row.uri === 'string' ? row.uri : null,
    latitude: lat,
    longitude: lng,
    image_url: typeof row.image_url === 'string' ? row.image_url : null,
    title: typeof row.title === 'string' ? row.title : null,
    collection_name:
      typeof row.collection_name === 'string' ? row.collection_name : null,
    socials: parseSocialsFromDb(row.socials),
    pin_note: typeof row.pin_note === 'string' ? row.pin_note : null,
    website_url: typeof row.website_url === 'string' ? row.website_url : null,
    pinned_at: pinnedAtToIso(row.pinned_at),
  };
}

export async function listPinsForUser(
  pool: mysql.Pool,
  userId: number,
  walletAddress?: string
): Promise<PinnedNftItem[]> {
  const baseSql = `SELECT token_id, wallet_address, issuer, uri, latitude, longitude,
    image_url, title, collection_name, socials, pin_note, website_url, pinned_at
    FROM user_pins WHERE user_id = ?`;
  const [rows] = (walletAddress
    ? await pool.execute(
        `${baseSql} AND wallet_address = ? ORDER BY pinned_at DESC`,
        [userId, normalizeWalletAddress(walletAddress)]
      )
    : await pool.execute(`${baseSql} ORDER BY pinned_at DESC`, [userId])) as [
    Record<string, unknown>[],
    unknown,
  ];
  return rows.map(mapRow);
}

/** Pins created while logged in with wallet-only session (`user_id` IS NULL). */
export async function listPinsForWalletOwner(
  pool: mysql.Pool,
  walletAddress: string
): Promise<PinnedNftItem[]> {
  const wa = normalizeWalletAddress(walletAddress);
  const [rows] = (await pool.execute(
    `SELECT token_id, wallet_address, issuer, uri, latitude, longitude,
      image_url, title, collection_name, socials, pin_note, website_url, pinned_at
     FROM user_pins
     WHERE user_id IS NULL AND wallet_address = ?
     ORDER BY pinned_at DESC`,
    [wa]
  )) as [Record<string, unknown>[], unknown];
  return rows.map(mapRow);
}

export async function upsertUserPin(
  pool: mysql.Pool,
  params: {
    userId: number | null;
    tokenId: string;
    walletAddress: string;
    issuer: string | null;
    uri: string | null;
    latitude: number;
    longitude: number;
    imageUrl: string | null;
    title: string | null;
    collectionName: string | null;
    socials: PinnedNftSocials | null;
    pinNote: string | null;
    websiteUrl: string | null;
    /** ISO string for new pins only; duplicate key updates keep existing `pinned_at`. */
    pinnedAtIsoForInsert: string;
  }
): Promise<void> {
  const wa = normalizeWalletAddress(params.walletAddress);
  const pinnedDate = new Date(params.pinnedAtIsoForInsert);
  const pinnedAtMysql = Number.isNaN(pinnedDate.getTime())
    ? new Date()
    : pinnedDate;

  const socialsParam =
    params.socials === null ? null : JSON.stringify(params.socials);

  await pool.execute(
    `INSERT INTO user_pins (
      user_id, token_id, wallet_address, issuer, uri,
      latitude, longitude, image_url, title, collection_name,
      socials, pin_note, website_url, pinned_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      issuer = VALUES(issuer),
      uri = VALUES(uri),
      latitude = VALUES(latitude),
      longitude = VALUES(longitude),
      image_url = VALUES(image_url),
      title = VALUES(title),
      collection_name = VALUES(collection_name),
      socials = VALUES(socials),
      pin_note = VALUES(pin_note),
      website_url = VALUES(website_url)`,
    [
      params.userId,
      params.tokenId,
      wa,
      params.issuer,
      params.uri,
      params.latitude,
      params.longitude,
      params.imageUrl,
      params.title,
      params.collectionName,
      socialsParam,
      params.pinNote,
      params.websiteUrl,
      pinnedAtMysql,
    ]
  );
}

export async function deleteUserPin(
  pool: mysql.Pool,
  userId: number | null,
  tokenId: string,
  walletAddress: string
): Promise<void> {
  const wa = normalizeWalletAddress(walletAddress);
  if (userId == null) {
    await pool.execute(
      `DELETE FROM user_pins WHERE user_id IS NULL AND token_id = ? AND wallet_address = ?`,
      [tokenId, wa]
    );
    return;
  }
  await pool.execute(
    `DELETE FROM user_pins WHERE user_id = ? AND token_id = ? AND wallet_address = ?`,
    [userId, tokenId, wa]
  );
}

export async function deletePinsForUserWallet(
  pool: mysql.Pool,
  userId: number,
  walletAddress: string
): Promise<void> {
  await pool.execute(
    `DELETE FROM user_pins WHERE user_id = ? AND wallet_address = ?`,
    [userId, normalizeWalletAddress(walletAddress)]
  );
}

/**
 * Deletes pins for this user+wallet when the NFTokenID is not present in the
 * wallet on-chain (uses full ledger list, not UI collection filter).
 * If the wallet holds no NFTs, all pins for that wallet row are removed.
 */
export async function deletePinsForWalletNotHeld(
  pool: mysql.Pool,
  userId: number | null,
  walletAddress: string,
  heldNfTokenIds: Set<string>
): Promise<number> {
  const wa = normalizeWalletAddress(walletAddress);
  const userClause =
    userId == null ? 'user_id IS NULL' : 'user_id = ?';
  const userParams = userId == null ? [] : [userId];

  if (heldNfTokenIds.size === 0) {
    const [result] = await pool.execute(
      `DELETE FROM user_pins WHERE ${userClause} AND wallet_address = ?`,
      [...userParams, wa]
    );
    return (result as ResultSetHeader).affectedRows;
  }
  const ids = [...heldNfTokenIds];
  const placeholders = ids.map(() => '?').join(', ');
  const [result] = await pool.execute(
    `DELETE FROM user_pins WHERE ${userClause} AND wallet_address = ? AND token_id NOT IN (${placeholders})`,
    [...userParams, wa, ...ids]
  );
  return (result as ResultSetHeader).affectedRows;
}

function toUniquePins(items: PinnedNftItem[]): PinnedNftItem[] {
  const seen = new Set<string>();
  const unique: PinnedNftItem[] = [];
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

/** All pins for the public globe feed (deduped by wallet + token_id, like prior implementation). */
export async function listGlobePins(pool: mysql.Pool): Promise<PinnedNftItem[]> {
  const [rows] = (await pool.execute(
    `SELECT token_id, wallet_address, issuer, uri, latitude, longitude,
      image_url, title, collection_name, socials, pin_note, website_url, pinned_at
     FROM user_pins
     ORDER BY pinned_at DESC`
  )) as [Record<string, unknown>[], unknown];

  const mapped = rows
    .map(mapRow)
    .filter(
      item =>
        item.token_id.length > 0 &&
        item.wallet_address.length > 0 &&
        toFiniteNumber(item.latitude) != null &&
        toFiniteNumber(item.longitude) != null
    );

  return toUniquePins(mapped).sort((left, right) => {
    return (
      new Date(right.pinned_at).getTime() - new Date(left.pinned_at).getTime()
    );
  });
}
