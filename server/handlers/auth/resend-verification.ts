import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAnonClient } from '../../lib/supabaseAdmin.js';
import { getAppPublicOrigin } from '../../lib/getAppPublicOrigin.js';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const body = req.body as Record<string, unknown>;
    const email =
      typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';

    if (!email) {
      res.status(400).json({ error: 'Email is required' });
      return;
    }

    const supabase = getAnonClient();
    const redirectTo = `${getAppPublicOrigin()}/auth/callback?type=signup`;
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: redirectTo },
    });

    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }

    res.status(200).json({
      message: 'Check your inbox for the verification link.',
      emailSent: true,
    });
  } catch (error) {
    console.error('auth/resend-verification:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
