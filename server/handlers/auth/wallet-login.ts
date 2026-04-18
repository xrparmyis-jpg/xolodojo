import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  buildSessionSetCookie,
  createWalletSession,
} from '../../lib/sessionAuth.js';
import { getXamanAccountFromUserJwt } from '../../lib/xamanUserJwt.js';
import { resolveCanonicalClassicAddress } from '../../xrplClassicAddress.js';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const body = req.body as Record<string, unknown>;
    const rawAddress = typeof body.wallet_address === 'string' ? body.wallet_address.trim() : '';
    const walletType = typeof body.wallet_type === 'string' ? body.wallet_type.trim() : '';

    if (!rawAddress || !walletType) {
      res.status(400).json({ error: 'wallet_address and wallet_type are required' });
      return;
    }

    const classic = resolveCanonicalClassicAddress(rawAddress) ?? resolveCanonicalClassicAddress(rawAddress.toLowerCase());
    if (!classic) {
      res.status(400).json({ error: 'Invalid XRPL wallet address' });
      return;
    }

    const wtLower = walletType.toLowerCase();
    if (wtLower === 'xaman') {
      const xamanJwt = typeof body.xaman_jwt === 'string' ? body.xaman_jwt.trim() : '';
      if (!xamanJwt) {
        res.status(400).json({ error: 'xaman_jwt is required for Xaman wallet sign-in' });
        return;
      }
      const verifiedAccount = await getXamanAccountFromUserJwt(xamanJwt);
      if (!verifiedAccount || verifiedAccount.toLowerCase() !== classic.toLowerCase()) {
        res.status(401).json({ error: 'Xaman session does not match this wallet address' });
        return;
      }
    }

    const { token, expiresAt } = await createWalletSession(classic, walletType);
    const walletAddress = classic;
    const user = {
      id: `wallet:${walletAddress.toLowerCase()}`,
      authMode: 'wallet' as const,
      email: '',
      username: '',
      walletAddress,
      walletType,
      createdAt: new Date().toISOString(),
    };

    res.setHeader('Set-Cookie', buildSessionSetCookie(token, expiresAt));
    res.status(200).json({ user, message: 'Wallet session created' });
  } catch (error) {
    console.error('auth/wallet-login:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
