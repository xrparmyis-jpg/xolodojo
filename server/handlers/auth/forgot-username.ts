import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getProfileByEmail } from '../../lib/requestAuth.js';
import { getServiceRoleClient } from '../../lib/supabaseAdmin.js';
import { sendMail } from '../../lib/mail.js';

const GENERIC_MESSAGE =
  'If an account exists for that email, you should receive a message with your username shortly.';

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

    const profile = await getProfileByEmail(email);
    if (profile) {
      const username = profile.username.trim();
      if (username) {
        const mailResult = await sendMail({
          to: email,
          subject: 'Your XoloDojo username',
          text: [
            'You asked for a reminder of the username for your XoloDojo account.',
            '',
            `Username: ${username}`,
            '',
            'Sign in with your email and password. If you forgot your password, use "Forgot password" on the sign-in page.',
          ].join('\n'),
          html: `<p>You asked for a reminder of the username for your XoloDojo account.</p>
<p><strong>Username:</strong> ${username}</p>
<p>Sign in with your email and password. If you forgot your password, use <strong>Forgot password</strong> on the sign-in page.</p>`,
        });
        if (!mailResult.sent) {
          console.warn('[Forgot Username] Resend email failed:', mailResult.reason);
        }
      }
    }

    res.status(200).json({ message: GENERIC_MESSAGE });
  } catch (error) {
    console.error('auth/forgot-username:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
