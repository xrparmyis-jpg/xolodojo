import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAnonClient } from '../../lib/supabaseAdmin.js';
import { getProfileByEmail, mapProfileToSessionUser } from '../../lib/requestAuth.js';

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

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const supabase = getAnonClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error || !data.user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    if (!data.user.email_confirmed_at) {
      res.status(403).json({
        error:
          'Please verify your email before signing in. Check your inbox and spam folder for the verification link we sent when you registered.',
        code: 'EMAIL_NOT_VERIFIED',
      });
      return;
    }

    const profile = await getProfileByEmail(email);
    if (!profile) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const user = mapProfileToSessionUser(profile, {
      email: data.user.email,
      email_confirmed_at: data.user.email_confirmed_at,
      created_at: data.user.created_at,
    });

    res.status(200).json({
      user: { ...user, authMode: 'password' },
      session: data.session,
      message: 'Login successful',
    });
  } catch (error) {
    console.error('auth/login:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
