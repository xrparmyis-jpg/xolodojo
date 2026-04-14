import type { VercelRequest, VercelResponse } from '@vercel/node';
import { randomBytes } from 'node:crypto';
import { getAppMysqlPool } from '../../server/lib/mysqlPool.js';
import { getUserByEmail, getUserByUsername, hashPassword, getAppPublicOrigin } from '../../server/lib/sessionAuth.js';
import { sendMail } from '../../server/lib/mail.js';
import { validateDisplayName, validateUsername } from '../../src/lib/username.js';

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

    const existingEmail = await getUserByEmail(email);
    if (existingEmail) {
      res.status(409).json({ error: 'An account with that email already exists' });
      return;
    }

    const existingUsername = await getUserByUsername(userCheck.normalized);
    if (existingUsername) {
      res.status(409).json({ error: 'That username is already taken' });
      return;
    }

    const pool = getAppMysqlPool();
    const hashed = hashPassword(password);
    const verificationToken = randomBytes(32).toString('hex');
    const verificationExpiry = new Date(Date.now() + VERIFY_TTL_MS);
    const verificationExpirySql = verificationExpiry
      .toISOString()
      .slice(0, 19)
      .replace('T', ' ');

    await pool.query(
      `INSERT INTO users (
        email, username, name, password, role,
        verification_token, verification_token_expiry,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, 'user', ?, ?, UTC_TIMESTAMP(), UTC_TIMESTAMP())`,
      [email, userCheck.normalized, nameCheck.normalized, hashed, verificationToken, verificationExpirySql]
    );

    const appBaseUrl = getAppPublicOrigin();
    const verifyUrl = `${appBaseUrl}/api/auth/verify-email?token=${verificationToken}`;

    const mailResult = await sendMail({
      to: email,
      subject: 'Verify your XoloDojo account',
      text: `Welcome to XoloDojo. Verify your email by opening this link (valid 48 hours):\n${verifyUrl}`,
      html: `<p>Welcome to XoloDojo.</p><p>Please <a href="${verifyUrl}">verify your email address</a> to activate your account. This link expires in 48 hours.</p>`,
    });

    if (!mailResult.sent) {
      console.warn('[Register] Verification email not sent:', mailResult.reason);
    }

    res.status(200).json({
      message: mailResult.sent
        ? 'Account created. Check your email for a verification link before signing in.'
        : `Account created, but no verification email was sent. Set SMTP_HOST and SMTP_PORT in .env.local (for the API), restart the API, then use "Resend verification" on login. Reason: ${mailResult.reason ?? 'unknown'}`,
      emailSent: mailResult.sent,
    });
  } catch (error) {
    console.error('auth/register:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
