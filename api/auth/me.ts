import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSessionUserFromRequest } from '../../server/lib/sessionAuth.js';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const user = await getSessionUserFromRequest(req);
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    res.status(200).json({ user });
  } catch (error) {
    console.error('auth/me:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
