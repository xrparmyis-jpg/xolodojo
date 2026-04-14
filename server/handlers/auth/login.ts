import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  buildSessionSetCookie,
  createSession,
  getUserByEmail,
  isEmailVerifiedRow,
  mapSessionUser,
  verifyPassword,
} from '../../lib/sessionAuth.js';

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

    const role = typeof userRow.role === 'string' ? userRow.role : 'user';
    if (role === 'user' && !isEmailVerifiedRow(userRow)) {
      res.status(403).json({
        error:
          'Please verify your email before signing in. Check your inbox and spam folder for the verification link we sent when you registered.',
        code: 'EMAIL_NOT_VERIFIED',
      });
      return;
    }

    const userId = Number(userRow.id);
    const { token, expiresAt } = await createSession(userId);
    const user = mapSessionUser(userRow);

    res.setHeader('Set-Cookie', buildSessionSetCookie(token, expiresAt));
    res.status(200).json({ user, message: 'Login successful' });
  } catch (error) {
    console.error('auth/login:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
