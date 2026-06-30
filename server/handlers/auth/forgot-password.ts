import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getProfileByUsername } from '../../lib/requestAuth.js';
import { getAnonClient, getServiceRoleClient } from '../../lib/supabaseAdmin.js';
import { getAppPublicOrigin } from '../../lib/getAppPublicOrigin.js';
import { validateUsername } from '../../../src/lib/username.js';
import { authDebugError, authDebugLog, authDebugWarn } from '../../lib/authDebugLog.js';

const SCOPE = 'Forgot Password';

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

    authDebugLog(SCOPE, 'request received', {
      username: usernameRaw.trim() || null,
      provider: 'Supabase Auth (resetPasswordForEmail)',
    });

    const parsed = validateUsername(usernameRaw);
    if (!parsed.ok) {
      authDebugWarn(SCOPE, 'rejected — invalid username', { error: parsed.error });
      res.status(400).json({ error: parsed.error });
      return;
    }

    const profile = await getProfileByUsername(parsed.normalized);
    if (!profile) {
      authDebugWarn(SCOPE, 'no profile found for username', {
        username: parsed.normalized,
      });
      res.status(200).json({ message: FORGOT_PASSWORD_SUCCESS_MESSAGE });
      return;
    }

    authDebugLog(SCOPE, 'profile found', {
      username: parsed.normalized,
      userId: profile.id,
    });

    const supabase = getServiceRoleClient();
    const { data: userData, error: userLookupError } = await supabase.auth.admin.getUserById(
      profile.id
    );
    if (userLookupError) {
      authDebugError(SCOPE, 'auth user lookup failed', {
        userId: profile.id,
        error: userLookupError.message,
      });
      res.status(200).json({ message: FORGOT_PASSWORD_SUCCESS_MESSAGE });
      return;
    }

    const email = userData.user?.email?.trim().toLowerCase();
    if (!email) {
      authDebugWarn(SCOPE, 'profile found but auth user has no email', {
        userId: profile.id,
        username: parsed.normalized,
      });
      res.status(200).json({ message: FORGOT_PASSWORD_SUCCESS_MESSAGE });
      return;
    }

    const redirectTo = `${getAppPublicOrigin()}/auth/callback?type=recovery`;
    authDebugLog(SCOPE, 'sending reset email via Supabase', {
      userId: profile.id,
      username: parsed.normalized,
      email,
      redirectTo,
    });

    const anon = getAnonClient();
    const { error } = await anon.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) {
      authDebugError(SCOPE, 'Supabase reset email failed', {
        userId: profile.id,
        email,
        redirectTo,
        error: error.message,
        fix: 'Check Supabase Dashboard → Authentication → SMTP Settings and email templates.',
      });
    } else {
      authDebugLog(SCOPE, 'Supabase reset email accepted', {
        userId: profile.id,
        email,
        redirectTo,
      });
    }

    res.status(200).json({ message: FORGOT_PASSWORD_SUCCESS_MESSAGE });
  } catch (error) {
    authDebugError(SCOPE, 'handler error', {
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({ error: 'Internal server error' });
  }
}
