import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  buildSessionClearCookie,
  deleteSessionByToken,
  getSessionTokenFromRequest,
} from '../../server/lib/sessionAuth.js';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const token = getSessionTokenFromRequest(req);
    if (token) {
      await deleteSessionByToken(token);
    }
    res.setHeader('Set-Cookie', buildSessionClearCookie());
    res.status(200).json({ message: 'Logout successful' });
  } catch (error) {
    console.error('auth/logout:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
