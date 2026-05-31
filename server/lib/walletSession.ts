import type { VercelRequest } from '@vercel/node';
import { randomBytes, randomUUID, createHash } from 'node:crypto';
import { getServiceRoleClient } from './supabaseAdmin.js';
import { normalizeWalletAddress } from './userPinsRepo.js';
import { resolveCanonicalClassicAddress } from '../xrplClassicAddress.js';

export const WALLET_SESSION_COOKIE_NAME = 'xolodojo_wallet_session';
const SESSION_TTL_DAYS = 30;

function getSessionExpiryDate(): Date {
  return new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function getWalletSessionTokenFromRequest(req: VercelRequest): string | undefined {
  const raw = req.headers.cookie;
  if (!raw || typeof raw !== 'string') return undefined;
  for (const part of raw.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const k = part.slice(0, idx).trim();
    if (k !== WALLET_SESSION_COOKIE_NAME) continue;
    return decodeURIComponent(part.slice(idx + 1).trim());
  }
  return undefined;
}

export function buildWalletSessionSetCookie(token: string, expiresAt: Date): string {
  const secure = process.env.NODE_ENV === 'production';
  const attrs = [
    `${WALLET_SESSION_COOKIE_NAME}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Expires=${expiresAt.toUTCString()}`,
  ];
  if (secure) attrs.push('Secure');
  return attrs.join('; ');
}

export function buildWalletSessionClearCookie(): string {
  const secure = process.env.NODE_ENV === 'production';
  const attrs = [
    `${WALLET_SESSION_COOKIE_NAME}=`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Expires=Thu, 01 Jan 1970 00:00:00 GMT',
  ];
  if (secure) attrs.push('Secure');
  return attrs.join('; ');
}

export async function deleteExpiredWalletSessions(): Promise<void> {
  const supabase = getServiceRoleClient();
  await supabase
    .from('wallet_sessions')
    .delete()
    .lte('expires_at', new Date().toISOString());
}

export async function createWalletSession(
  walletAddress: string,
  walletType: string
): Promise<{ token: string; expiresAt: Date }> {
  await deleteExpiredWalletSessions();
  const supabase = getServiceRoleClient();
  const token = `${randomUUID()}-${randomBytes(24).toString('hex')}`;
  const expiresAt = getSessionExpiryDate();
  const trimmed = walletAddress.trim();
  const wa =
    resolveCanonicalClassicAddress(trimmed) ??
    resolveCanonicalClassicAddress(trimmed.toLowerCase()) ??
    normalizeWalletAddress(trimmed);
  const wt = walletType.trim().slice(0, 50) || 'unknown';

  const { error } = await supabase.from('wallet_sessions').insert({
    wallet_address: wa,
    wallet_type: wt,
    token_hash: hashToken(token),
    expires_at: expiresAt.toISOString(),
  });
  if (error) {
    throw error;
  }
  return { token, expiresAt };
}

export async function getWalletSessionFromRequest(
  req: VercelRequest
): Promise<{ walletAddress: string; walletType: string } | null> {
  const sessionToken = getWalletSessionTokenFromRequest(req);
  if (!sessionToken) {
    return null;
  }

  await deleteExpiredWalletSessions();

  const supabase = getServiceRoleClient();
  const { data, error } = await supabase
    .from('wallet_sessions')
    .select('wallet_address, wallet_type')
    .eq('token_hash', hashToken(sessionToken))
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const raw = data.wallet_address?.trim();
  if (!raw) {
    return null;
  }
  const walletAddress =
    resolveCanonicalClassicAddress(raw) ??
    resolveCanonicalClassicAddress(raw.toLowerCase()) ??
    normalizeWalletAddress(raw);
  const walletType =
    typeof data.wallet_type === 'string' && data.wallet_type.trim()
      ? data.wallet_type.trim()
      : 'unknown';

  return { walletAddress, walletType };
}

export async function deleteWalletSessionByToken(token: string): Promise<void> {
  const supabase = getServiceRoleClient();
  await supabase.from('wallet_sessions').delete().eq('token_hash', hashToken(token));
}
