import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getProfileByEmail, getProfileByUsername } from '../../lib/requestAuth.js';
import { getAnonClient, getServiceRoleClient } from '../../lib/supabaseAdmin.js';
import { getAppPublicOrigin } from '../../lib/getAppPublicOrigin.js';
import { validateUsername } from '../../../src/lib/username.js';

const FORGOT_PASSWORD_SUCCESS_MESSAGE =
  'If an account exists for that username, check your inbox for a message with a reset password link. The link opens a page where you enter your new password and confirm it.';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const body = req.body as Record<string, unknown>;
    const usernameRaw = typeof body.username === 'string' ? body.username : '';

    const parsed = validateUsername(usernameRaw);
    if (!parsed.ok) {
      res.status(400).json({ error: parsed.error });
      return;
    }

    const profile = await getProfileByUsername(parsed.normalized);
    if (profile) {
      const supabase = getServiceRoleClient();
      const { data: userData } = await supabase.auth.admin.getUserById(profile.id);
      const email = userData.user?.email?.trim().toLowerCase();

      if (email) {
        const redirectTo = `${getAppPublicOrigin()}/auth/callback?type=recovery`;
        const anon = getAnonClient();
        const { error } = await anon.auth.resetPasswordForEmail(email, { redirectTo });
        if (error) {
          console.warn('[Forgot Password] Supabase reset email failed:', error.message);
        }
      }
    }

    res.status(200).json({ message: FORGOT_PASSWORD_SUCCESS_MESSAGE });
  } catch (error) {
    console.error('auth/forgot-password:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
