import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getServiceRoleClient } from '../../lib/supabaseAdmin.js';
import { getProfileById, requireAuthUserId } from '../../lib/requestAuth.js';

type ProfileSocials = {
  twitter?: string;
  discord?: string;
  tiktok?: string;
  instagram?: string;
  telegram?: string;
  linkedin?: string;
};

function parsePreferences(preferences: unknown): Record<string, unknown> {
  if (!preferences || typeof preferences !== 'object' || Array.isArray(preferences)) {
    return {};
  }
  return preferences as Record<string, unknown>;
}

function sanitizeSocials(input: unknown): ProfileSocials {
  if (!input || typeof input !== 'object') return {};
  const source = input as Record<string, unknown>;
  const keys: Array<keyof ProfileSocials> = [
    'twitter',
    'discord',
    'tiktok',
    'instagram',
    'telegram',
    'linkedin',
  ];
  return keys.reduce<ProfileSocials>((acc, key) => {
    const value = source[key];
    if (typeof value !== 'string') return acc;
    const normalized = value.trim().replace(/^@+/, '');
    if (normalized) acc[key] = normalized;
    return acc;
  }, {});
}

async function getUserPayload(userId: string) {
  const supabase = getServiceRoleClient();
  const profile = await getProfileById(userId);
  if (!profile) return null;

  const { data: authData } = await supabase.auth.admin.getUserById(userId);
  const authUser = authData.user;

  return {
    id: profile.id,
    email: authUser?.email ?? '',
    username: profile.username,
    name: profile.name,
    role: profile.role,
    picture_url: profile.picture_url,
    email_verified_at: authUser?.email_confirmed_at ?? null,
    created_at: profile.created_at,
    updated_at: profile.updated_at,
    bio: profile.bio,
    wallet_address: profile.wallet_address,
    wallet_type: profile.wallet_type,
    preferences: profile.preferences,
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method === 'GET') {
    try {
      const userId = await requireAuthUserId(req, res);
      if (userId === null) return;

      const user = await getUserPayload(userId);
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }
      res.status(200).json({ success: true, user });
      return;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      res.status(500).json({ error: 'Internal server error', details: err.message });
      return;
    }
  }

  if (req.method === 'PUT') {
    try {
      const userId = await requireAuthUserId(req, res);
      if (userId === null) return;

      const { bio, socials } = req.body as { bio?: string; socials?: unknown };
      const supabase = getServiceRoleClient();

      const { data: existing } = await supabase
        .from('profiles')
        .select('preferences')
        .eq('id', userId)
        .maybeSingle();

      const currentPreferences = parsePreferences(existing?.preferences);
      const nextPreferences = {
        ...currentPreferences,
        socials: sanitizeSocials(socials),
      };

      const { error } = await supabase
        .from('profiles')
        .update({
          bio: bio || null,
          preferences: nextPreferences,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) {
        res.status(500).json({ error: 'Database error', details: error.message });
        return;
      }

      const user = await getUserPayload(userId);
      res.status(200).json({ success: true, user });
      return;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      res.status(500).json({ error: 'Internal server error', details: err.message });
      return;
    }
  }

  res.status(405).json({ error: 'Method not allowed' });
}
