import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getRequestAuth } from '../../lib/sessionAuth.js';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const auth = await getRequestAuth(req);
    if (!auth) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (auth.kind === 'wallet') {
      res.status(200).json({
        user: {
          id: `wallet:${auth.walletAddress}`,
          authMode: 'wallet',
          email: '',
          username: '',
          walletAddress: auth.walletAddress,
          walletType: auth.walletType,
          createdAt: new Date().toISOString(),
        },
      });
      return;
    }

    const u = auth.sessionUser;
    res.status(200).json({
      user: {
        ...u,
        authMode: 'password',
      },
    });
  } catch (error) {
    console.error('auth/me:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
