import type { VercelRequest } from '@vercel/node';
import { getAnonClient, getServiceRoleClient } from './supabaseAdmin.js';
import { getWalletSessionFromRequest } from './walletSession.js';

export interface ProfileRow {
  id: string;
  username: string;
  name: string | null;
  role: string;
  picture_url: string | null;
  bio: string | null;
  wallet_address: string | null;
  wallet_type: string | null;
  preferences: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  email?: string;
  email_verified_at?: string | null;
}

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

export type RequestAuthState =
  | { kind: 'user'; userId: string; sessionUser: SessionAuthUser }
  | { kind: 'wallet'; walletAddress: string; walletType: string };

function getBearerToken(req: VercelRequest): string | undefined {
  const raw = req.headers.authorization;
  if (!raw || typeof raw !== 'string') return undefined;
  const match = raw.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || undefined;
}

function formatDateValue(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
    return value;
  }
  return new Date().toISOString();
}

function parsePreferences(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, unknown>;
}

export function mapProfileToSessionUser(
  profile: ProfileRow,
  authUser: { email?: string; email_confirmed_at?: string | null; created_at?: string }
): SessionAuthUser {
  const username =
    typeof profile.username === 'string' && profile.username.trim()
      ? profile.username.trim()
      : '';
  const rawName = typeof profile.name === 'string' ? profile.name.trim() : '';
  const pictureUrl =
    typeof profile.picture_url === 'string' && profile.picture_url.trim()
      ? profile.picture_url.trim()
      : undefined;

  return {
    id: profile.id,
    email: authUser.email ?? '',
    username,
    name: rawName || undefined,
    pictureUrl,
    role: typeof profile.role === 'string' ? profile.role : 'user',
    createdAt: formatDateValue(profile.created_at ?? authUser.created_at),
    emailVerified: Boolean(authUser.email_confirmed_at),
  };
}

export async function getProfileById(userId: string): Promise<ProfileRow | null> {
  const supabase = getServiceRoleClient();
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  if (error || !data) {
    return null;
  }
  return {
    ...data,
    preferences: parsePreferences(data.preferences),
    created_at: formatDateValue(data.created_at),
    updated_at: formatDateValue(data.updated_at),
  } as ProfileRow;
}

export async function getProfileByUsername(username: string): Promise<ProfileRow | null> {
  const normalized = username.trim().toLowerCase();
  if (!normalized) return null;
  const supabase = getServiceRoleClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', normalized)
    .maybeSingle();
  if (error || !data) {
    return null;
  }
  return {
    ...data,
    preferences: parsePreferences(data.preferences),
    created_at: formatDateValue(data.created_at),
    updated_at: formatDateValue(data.updated_at),
  } as ProfileRow;
}

export async function getProfileByEmail(email: string): Promise<(ProfileRow & { email: string }) | null> {
  const supabase = getServiceRoleClient();
  const normalized = email.trim().toLowerCase();
  const { data: listData, error: listError } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  if (listError) {
    return null;
  }
  const authUser = listData.users.find(
    (u) => typeof u.email === 'string' && u.email.toLowerCase() === normalized
  );
  if (!authUser) {
    return null;
  }
  const profile = await getProfileById(authUser.id);
  if (!profile) {
    return null;
  }
  return {
    ...profile,
    email: authUser.email ?? normalized,
    email_verified_at: authUser.email_confirmed_at ?? null,
  };
}

export async function getRequestAuth(req: VercelRequest): Promise<RequestAuthState | null> {
  const bearer = getBearerToken(req);
  if (bearer) {
    const supabase = getAnonClient();
    const { data, error } = await supabase.auth.getUser(bearer);
    if (!error && data.user) {
      const profile = await getProfileById(data.user.id);
      if (profile) {
        return {
          kind: 'user',
          userId: data.user.id,
          sessionUser: mapProfileToSessionUser(profile, {
            email: data.user.email,
            email_confirmed_at: data.user.email_confirmed_at,
            created_at: data.user.created_at,
          }),
        };
      }
    }
  }

  const walletSession = await getWalletSessionFromRequest(req);
  if (walletSession) {
    return {
      kind: 'wallet',
      walletAddress: walletSession.walletAddress,
      walletType: walletSession.walletType,
    };
  }

  return null;
}

export async function requireAuthUserId(
  req: VercelRequest,
  res: import('@vercel/node').VercelResponse
): Promise<string | null> {
  const auth = await getRequestAuth(req);
  if (auth?.kind !== 'user') {
    res.status(401).json({ error: 'Unauthorized' });
    return null;
  }
  return auth.userId;
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

/** @deprecated use requireAuthUserId */
export async function requireSessionUserId(
  req: VercelRequest,
  res: import('@vercel/node').VercelResponse
): Promise<string | null> {
  return requireAuthUserId(req, res);
}

export async function isUsernameAvailable(username: string): Promise<boolean> {
  const existing = await getProfileByUsername(username);
  return !existing;
}

export { getAppPublicOrigin } from './getAppPublicOrigin.js';
