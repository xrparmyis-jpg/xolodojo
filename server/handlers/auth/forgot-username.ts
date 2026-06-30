import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getProfileByEmail } from '../../lib/requestAuth.js';
import { authDebugError, authDebugLog, authDebugWarn } from '../../lib/authDebugLog.js';
import { getMailConfigStatus, sendMail } from '../../lib/mail.js';

const SCOPE = 'Forgot Username';

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

    authDebugLog(SCOPE, 'request received', {
      email: email || null,
      mailConfig: getMailConfigStatus(),
      note: 'Forgot-username uses Resend (not Supabase SMTP). Forgot-password uses Supabase.',
    });

    if (!email) {
      authDebugWarn(SCOPE, 'rejected — email missing');
      res.status(400).json({ error: 'Email is required' });
      return;
    }

    const profile = await getProfileByEmail(email);
    if (!profile) {
      authDebugWarn(SCOPE, 'no profile found for email', { email });
      res.status(200).json({ message: GENERIC_MESSAGE });
      return;
    }

    authDebugLog(SCOPE, 'profile found', {
      email,
      userId: profile.id,
      username: profile.username,
    });

    const username = profile.username.trim();
    if (!username) {
      authDebugWarn(SCOPE, 'profile found but username is empty', {
        email,
        userId: profile.id,
      });
      res.status(200).json({ message: GENERIC_MESSAGE });
      return;
    }

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
      authDebugError(SCOPE, 'email not sent', {
        email,
        userId: profile.id,
        username,
        reason: mailResult.reason,
        mailConfig: getMailConfigStatus(),
        fix:
          'Set RESEND_API_KEY and RESEND_FROM in .env.local (or Vercel env). Forgot-password does not need these — it uses Supabase Auth SMTP.',
      });
    } else {
      authDebugLog(SCOPE, 'email sent via Resend', {
        email,
        userId: profile.id,
        username,
        resendId: mailResult.resendId ?? null,
      });
    }

    res.status(200).json({ message: GENERIC_MESSAGE });
  } catch (error) {
    authDebugError(SCOPE, 'handler error', {
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({ error: 'Internal server error' });
  }
}
