import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getUserByEmail } from '../../server/lib/sessionAuth.js';
import { sendMail } from '../../server/lib/mail.js';

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

    const row = await getUserByEmail(email);
    if (row) {
      const to = typeof row.email === 'string' ? row.email : email;
      const username =
        typeof row.username === 'string' ? row.username.trim() : '';

      if (to && username) {
        await sendMail({
          to,
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
      }
    }

    res.status(200).json({ message: GENERIC_MESSAGE });
  } catch (error) {
    console.error('auth/forgot-username:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
