import type { VercelRequest, VercelResponse } from '@vercel/node';
import { randomBytes } from 'node:crypto';
import { getAppMysqlPool } from '../../server/lib/mysqlPool.js';
import { getUserByUsername, getAppPublicOrigin } from '../../server/lib/sessionAuth.js';
import { sendMail } from '../../server/lib/mail.js';
import { validateUsername } from '../../src/lib/username.js';

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

    const row = await getUserByUsername(parsed.normalized);
    if (row) {
      const email = typeof row.email === 'string' ? row.email.trim().toLowerCase() : '';
      if (!email) {
        res.status(200).json({ message: FORGOT_PASSWORD_SUCCESS_MESSAGE });
        return;
      }

      const token = randomBytes(32).toString('hex');
      const expiry = new Date(Date.now() + 60 * 60 * 1000)
        .toISOString()
        .slice(0, 19)
        .replace('T', ' ');

      await getAppMysqlPool().query(
        'UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE LOWER(username) = ?',
        [token, expiry, parsed.normalized]
      );

      const appBaseUrl = getAppPublicOrigin();
      const resetUrl = `${appBaseUrl}/?resetToken=${encodeURIComponent(token)}`;

      const mailResult = await sendMail({
        to: email,
        subject: 'XoloDojo password reset',
        text: [
          'You asked to reset your XoloDojo password.',
          '',
          'Open this reset password link in your browser:',
          resetUrl,
          '',
          'On that page, enter your new password, then confirm it, and submit.',
        ].join('\n'),
        html: `<p>You asked to reset your XoloDojo password.</p>
<p><a href="${resetUrl}">Reset password</a></p>
<p style="margin-top:12px;font-size:14px;color:#444;">Or copy this link:<br/><span style="word-break:break-all;">${resetUrl}</span></p>`,
      });

      if (!mailResult.sent) {
        console.warn('[Forgot Password] Email not sent:', mailResult.reason);
      }

      if (process.env.NODE_ENV !== 'production') {
        res.status(200).json({
          message: FORGOT_PASSWORD_SUCCESS_MESSAGE,
          resetUrl,
          emailSent: mailResult.sent,
        });
        return;
      }
    }

    res.status(200).json({
      message: FORGOT_PASSWORD_SUCCESS_MESSAGE,
    });
  } catch (error) {
    console.error('auth/forgot-password:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
