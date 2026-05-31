import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAnonClient } from '../../lib/supabaseAdmin.js';
import {
  getAppPublicOrigin,
  getProfileByEmail,
  isUsernameAvailable,
} from '../../lib/requestAuth.js';
import { validateDisplayName, validateUsername } from '../../../src/lib/username.js';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const body = req.body as Record<string, unknown>;
    const email =
      typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    const nameRaw = typeof body.name === 'string' ? body.name : '';
    const usernameRaw = typeof body.username === 'string' ? body.username : '';

    const userCheck = validateUsername(usernameRaw);
    if (!userCheck.ok) {
      res.status(400).json({ error: userCheck.error });
      return;
    }
    const nameCheck = validateDisplayName(nameRaw);
    if (!nameCheck.ok) {
      res.status(400).json({ error: nameCheck.error });
      return;
    }

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters' });
      return;
    }

    const existingEmail = await getProfileByEmail(email);
    if (existingEmail) {
      res.status(409).json({ error: 'An account with that email already exists' });
      return;
    }

    const usernameAvailable = await isUsernameAvailable(userCheck.normalized);
    if (!usernameAvailable) {
      res.status(409).json({ error: 'That username is already taken' });
      return;
    }

    const redirectTo = `${getAppPublicOrigin()}/auth/callback`;
    const supabase = getAnonClient();

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectTo,
        data: {
          username: userCheck.normalized,
          name: nameCheck.normalized,
        },
      },
    });

    if (error) {
      console.error('auth/register signUp:', error);
      res.status(500).json({ error: error.message || 'Failed to create account' });
      return;
    }

    const emailSent = true;

    res.status(200).json({
      message: emailSent
        ? 'Account created. Check your email for a verification link before signing in.'
        : 'Account created, but no verification email was sent. Configure Supabase Auth email settings, then use "Resend verification" on login.',
      emailSent,
    });
  } catch (error) {
    console.error('auth/register:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
