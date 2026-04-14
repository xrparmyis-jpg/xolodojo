import type { VercelRequest, VercelResponse } from '@vercel/node';
import { randomBytes } from 'node:crypto';
import { getAppMysqlPool } from '../../lib/mysqlPool.js';
import {
  getUserByEmail,
  isEmailVerifiedRow,
  verifyPassword,
  getAppPublicOrigin,
} from '../../lib/sessionAuth.js';
import { sendMail } from '../../lib/mail.js';

const VERIFY_TTL_MS = 48 * 60 * 60 * 1000;

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

    const userRow = await getUserByEmail(email);
    if (!userRow || typeof userRow.password !== 'string') {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    if (!verifyPassword(password, userRow.password)) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    if (isEmailVerifiedRow(userRow)) {
      res.status(400).json({
        error: 'This email is already verified. You can sign in.',
      });
      return;
    }

    const role = typeof userRow.role === 'string' ? userRow.role : 'user';
    if (role !== 'user') {
      res.status(400).json({
        error:
          'Verification is only required for standard accounts. Try signing in or contact support.',
      });
      return;
    }

    const verificationToken = randomBytes(32).toString('hex');
    const verificationExpiry = new Date(Date.now() + VERIFY_TTL_MS);
    const verificationExpirySql = verificationExpiry
      .toISOString()
      .slice(0, 19)
      .replace('T', ' ');

    const pool = getAppMysqlPool();
    await pool.query(
      `UPDATE users SET verification_token = ?, verification_token_expiry = ?, updated_at = UTC_TIMESTAMP() WHERE id = ?`,
      [verificationToken, verificationExpirySql, userRow.id]
    );

    const appBaseUrl = getAppPublicOrigin();
    const verifyUrl = `${appBaseUrl}/api/auth/verify-email?token=${verificationToken}`;

    const mailResult = await sendMail({
      to: email,
      subject: 'Verify your XoloDojo account',
      text: `Verify your XoloDojo email by opening this link (valid 48 hours):\n${verifyUrl}`,
      html: `<p>Please <a href="${verifyUrl}">verify your email address</a> to activate your account. This link expires in 48 hours.</p>`,
    });

    if (!mailResult.sent) {
      console.warn('[resend-verification] Email not sent:', mailResult.reason);
    }

    res.status(200).json({
      message: mailResult.sent
        ? 'We sent a new verification link. Check your inbox and spam folder.'
        : `Verification link was updated, but no email was sent. The API needs SMTP (e.g. set SMTP_HOST=127.0.0.1 and SMTP_PORT=1025 in .env.local for MailHog/Mailpit). Reason: ${mailResult.reason ?? 'unknown'}`,
      emailSent: mailResult.sent,
    });
  } catch (error) {
    console.error('auth/resend-verification:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
