import type { VercelRequest } from '@vercel/node';
import { randomBytes, randomUUID, createHash, scryptSync, timingSafeEqual } from 'node:crypto';
import { getAppMysqlPool } from './mysqlPool.js';
import { normalizeWalletAddress } from './userPinsRepo.js';
import { resolveCanonicalClassicAddress } from '../xrplClassicAddress.js';

export const SESSION_COOKIE_NAME = 'xolodojo_session';
const SESSION_TTL_DAYS = 30;

type DbRow = Record<string, unknown>;

export interface SessionAuthUser {
  id: string;
  email: string;
  username: string;
  name?: string;
  pictureUrl?: string;
  role?: string;
  createdAt: string;
  emailVerified?: boolean;
}

function getSessionExpiryDate(): Date {
  return new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);
}

function toMysqlDateTime(date: Date): string {
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function formatDateValue(value: unknown): string {
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === 'string') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
    return value;
  }
  return new Date().toISOString();
}

export function isEmailVerifiedRow(row: DbRow): boolean {
  const v = row.email_verified_at;
  if (v == null) return false;
  if (v instanceof Date) return !Number.isNaN(v.getTime());
  if (typeof v === 'string') return v.length > 0;
  return false;
}

export function mapSessionUser(row: DbRow): SessionAuthUser {
  const username =
    typeof row.username === 'string' && row.username.trim() ? row.username.trim() : '';
  const rawName = typeof row.name === 'string' ? row.name.trim() : '';
  const name = rawName || undefined;
  const pictureUrl =
    typeof row.picture_url === 'string' && row.picture_url.trim()
      ? row.picture_url.trim()
      : undefined;

  return {
    id: String(row.id ?? ''),
    email: String(row.email ?? ''),
    username,
    name,
    pictureUrl,
    role: typeof row.role === 'string' ? row.role : undefined,
    createdAt: formatDateValue(row.created_at),
    emailVerified: isEmailVerifiedRow(row),
  };
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const derived = scryptSync(password, salt, 64).toString('hex');
  return `scrypt:${salt}:${derived}`;
}

export function verifyPassword(password: string, storedPassword: string): boolean {
  if (!storedPassword) {
    return false;
  }

  if (storedPassword.startsWith('scrypt:')) {
    const parts = storedPassword.split(':');
    if (parts.length !== 3) {
      return false;
    }
    const [, salt, storedHash] = parts;
    const derived = scryptSync(password, salt, 64).toString('hex');
    const storedBuf = Buffer.from(storedHash, 'hex');
    const derivedBuf = Buffer.from(derived, 'hex');
    if (storedBuf.length !== derivedBuf.length) {
      return false;
    }
    return timingSafeEqual(storedBuf, derivedBuf);
  }

  return password === storedPassword;
}

export function getSessionTokenFromRequest(req: VercelRequest): string | undefined {
  const raw = req.headers.cookie;
  if (!raw || typeof raw !== 'string') return undefined;
  const parts = raw.split(';');
  for (const p of parts) {
    const idx = p.indexOf('=');
    if (idx === -1) continue;
    const k = p.slice(0, idx).trim();
    if (k !== SESSION_COOKIE_NAME) continue;
    return decodeURIComponent(p.slice(idx + 1).trim());
  }
  return undefined;
}

/** Build Set-Cookie value for session token (single cookie line). */
export function buildSessionSetCookie(token: string, expiresAt: Date): string {
  const secure = process.env.NODE_ENV === 'production';
  const attrs = [
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Expires=${expiresAt.toUTCString()}`,
  ];
  if (secure) attrs.push('Secure');
  return attrs.join('; ');
}

export function buildSessionClearCookie(): string {
  const secure = process.env.NODE_ENV === 'production';
  const attrs = [
    `${SESSION_COOKIE_NAME}=`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Expires=Thu, 01 Jan 1970 00:00:00 GMT',
  ];
  if (secure) attrs.push('Secure');
  return attrs.join('; ');
}

export async function deleteExpiredSessions(): Promise<void> {
  const pool = getAppMysqlPool();
  await pool.query('DELETE FROM user_sessions WHERE expires_at <= UTC_TIMESTAMP()');
}

export async function createSession(userId: number): Promise<{ token: string; expiresAt: Date }> {
  await deleteExpiredSessions();
  const pool = getAppMysqlPool();
  const token = `${randomUUID()}-${randomBytes(24).toString('hex')}`;
  const expiresAt = getSessionExpiryDate();
  await pool.query(
    'INSERT INTO user_sessions (id, user_id, wallet_address, wallet_type, token_hash, expires_at) VALUES (?, ?, NULL, NULL, ?, ?)',
    [randomUUID(), userId, hashToken(token), toMysqlDateTime(expiresAt)]
  );
  return { token, expiresAt };
}

/** Cookie session for users without an account row (wallet-only). */
export async function createWalletSession(
  walletAddress: string,
  walletType: string
): Promise<{ token: string; expiresAt: Date }> {
  await deleteExpiredSessions();
  const pool = getAppMysqlPool();
  const token = `${randomUUID()}-${randomBytes(24).toString('hex')}`;
  const expiresAt = getSessionExpiryDate();
  const trimmed = walletAddress.trim();
  const wa =
    resolveCanonicalClassicAddress(trimmed) ??
    resolveCanonicalClassicAddress(trimmed.toLowerCase()) ??
    normalizeWalletAddress(trimmed);
  const wt = walletType.trim().slice(0, 50) || 'unknown';
  await pool.query(
    'INSERT INTO user_sessions (id, user_id, wallet_address, wallet_type, token_hash, expires_at) VALUES (?, NULL, ?, ?, ?, ?)',
    [randomUUID(), wa, wt, hashToken(token), toMysqlDateTime(expiresAt)]
  );
  return { token, expiresAt };
}

export type RequestAuthState =
  | { kind: 'user'; userId: number; sessionUser: SessionAuthUser }
  | { kind: 'wallet'; walletAddress: string; walletType: string };

async function getUserRowById(userId: number): Promise<DbRow | null> {
  const pool = getAppMysqlPool();
  const [rows] = await pool.query<DbRow>('SELECT * FROM users WHERE id = ? LIMIT 1', [userId]);
  const list = rows as unknown as DbRow[];
  return list[0] ?? null;
}

export async function getRequestAuth(req: VercelRequest): Promise<RequestAuthState | null> {
  const sessionToken = getSessionTokenFromRequest(req);
  if (!sessionToken) {
    return null;
  }

  await deleteExpiredSessions();

  const pool = getAppMysqlPool();
  const [sessRows] = await pool.query<DbRow>(
    `SELECT user_id, wallet_address, wallet_type FROM user_sessions
     WHERE token_hash = ? AND expires_at > UTC_TIMESTAMP()
     LIMIT 1`,
    [hashToken(sessionToken)]
  );
  const sessList = sessRows as unknown as DbRow[];
  const sess = sessList[0];
  if (!sess) {
    return null;
  }

  const uidRaw = sess.user_id;
  if (uidRaw != null && uidRaw !== '') {
    const userId = Number(uidRaw);
    if (Number.isFinite(userId)) {
      const userRow = await getUserRowById(userId);
      if (!userRow) {
        return null;
      }
      return { kind: 'user', userId, sessionUser: mapSessionUser(userRow) };
    }
  }

  const waRaw = sess.wallet_address;
  if (typeof waRaw === 'string' && waRaw.trim()) {
    const raw = waRaw.trim();
    const walletAddress =
      resolveCanonicalClassicAddress(raw) ??
      resolveCanonicalClassicAddress(raw.toLowerCase()) ??
      normalizeWalletAddress(raw);
    const wtRaw = sess.wallet_type;
    const walletType = typeof wtRaw === 'string' && wtRaw.trim() ? wtRaw.trim() : 'unknown';
    return { kind: 'wallet', walletAddress, walletType };
  }

  return null;
}

export async function deleteSessionByToken(token: string): Promise<void> {
  const pool = getAppMysqlPool();
  await pool.query('DELETE FROM user_sessions WHERE token_hash = ?', [hashToken(token)]);
}

export async function getUserRowBySessionToken(
  sessionToken: string | undefined
): Promise<DbRow | null> {
  if (!sessionToken) {
    return null;
  }

  await deleteExpiredSessions();

  const pool = getAppMysqlPool();
  const [rows] = await pool.query<DbRow>(
    `SELECT u.*
     FROM user_sessions s
     INNER JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = ? AND s.expires_at > UTC_TIMESTAMP()
     LIMIT 1`,
    [hashToken(sessionToken)]
  );

  const list = rows as unknown as DbRow[];
  return list[0] ?? null;
}

export async function getSessionUserFromRequest(
  req: VercelRequest
): Promise<SessionAuthUser | null> {
  const auth = await getRequestAuth(req);
  if (auth?.kind === 'user') {
    return auth.sessionUser;
  }
  return null;
}

export async function requireSessionUserId(
  req: VercelRequest,
  res: import('@vercel/node').VercelResponse
): Promise<number | null> {
  const user = await getSessionUserFromRequest(req);
  if (!user?.id) {
    res.status(401).json({ error: 'Unauthorized' });
    return null;
  }
  const id = Number(user.id);
  if (!Number.isFinite(id)) {
    res.status(401).json({ error: 'Unauthorized' });
    return null;
  }
  return id;
}

export async function getUserByEmail(email: string): Promise<DbRow | null> {
  const pool = getAppMysqlPool();
  const [rows] = await pool.query<DbRow>('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
  const list = rows as unknown as DbRow[];
  return list[0] ?? null;
}

export async function getUserByUsername(username: string): Promise<DbRow | null> {
  const normalized = username.trim().toLowerCase();
  if (!normalized) {
    return null;
  }
  const pool = getAppMysqlPool();
  const [rows] = await pool.query<DbRow>(
    'SELECT * FROM users WHERE LOWER(username) = ? LIMIT 1',
    [normalized]
  );
  const list = rows as unknown as DbRow[];
  return list[0] ?? null;
}

/** Public site URL for links in emails and post-auth redirects (server-side). */
export function getAppPublicOrigin(): string {
  const trimmed = (value: string) => value.replace(/\/$/, '');
  if (process.env.APP_PUBLIC_URL) {
    return trimmed(process.env.APP_PUBLIC_URL);
  }
  // Without APP_PUBLIC_URL, VERCEL_URL is the *deployment* host (e.g. xolodojo-abc123.vercel.app),
  // not the production alias — bad for verify-email redirects and email links.
  const productionHost = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (process.env.VERCEL_ENV === 'production' && productionHost) {
    return `https://${trimmed(productionHost)}`;
  }
  if (process.env.VERCEL_URL) {
    return `https://${trimmed(process.env.VERCEL_URL)}`;
  }
  return 'http://localhost:5173';
}
