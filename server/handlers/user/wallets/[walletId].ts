import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAppMysqlPool } from '../../../lib/mysqlPool.js';
import { deletePinsForUserWallet } from '../../../lib/userPinsRepo.js';
import { resolveCanonicalClassicAddress } from '../../../xrplClassicAddress.js';
import { requireSessionUserId } from '../../../lib/sessionAuth.js';

function getDbDebugInfo() {
  return {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3308'),
    database: process.env.DB_NAME || 'donovan_db',
    nodeEnv: process.env.NODE_ENV || 'development',
    vercelEnv: process.env.VERCEL_ENV || 'local',
  };
}

function isLikelyXrplAddress(value: string): boolean {
  return /^r[1-9A-HJ-NP-Za-km-z]{24,34}$/.test(value.trim());
}

function normalizeWalletAddressForStorage(
  value: string,
  walletType?: string
): string {
  const trimmed = value.trim();
  if (walletType === 'xaman' || walletType === 'joey') {
    const resolved = resolveCanonicalClassicAddress(trimmed);
    if (!resolved) {
      throw new Error('INVALID_XRPL_ADDRESS_CHECKSUM');
    }
    return resolved;
  }
  if (isLikelyXrplAddress(trimmed)) {
    const resolved = resolveCanonicalClassicAddress(trimmed);
    return resolved ?? trimmed;
  }

  return trimmed.toLowerCase();
}

function normalizeWalletAddress(value: string): string {
  return value.trim().toLowerCase();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const pool = getAppMysqlPool();
  // walletId may be passed via query or as part of path; VercelRequest sometimes puts params in query
  let walletId = req.query.walletId as string;
  if (!walletId) {
    // try to extract from URL manually
    const match = req.url?.match(/\/wallets\/([^\/]+)/);
    if (match) walletId = match[1];
  }

  // Connect a wallet (set as active)
  if (req.url?.includes('/connect') && req.method === 'PUT') {
    try {
      const userId = await requireSessionUserId(req, res);
      if (userId === null) return;

      console.log('CONNECT HANDLER: walletId param:', walletId, 'userId:', userId);

      // Verify wallet belongs to user
      const [wallet] = (await pool.execute(
        'SELECT id FROM user_wallets WHERE id = ? AND user_id = ?',
        [walletId, userId]
      )) as [any[], any];

      console.log('CONNECT HANDLER: wallet lookup result:', wallet);

      if (!Array.isArray(wallet) || wallet.length === 0) {
        return res.status(404).json({ error: 'Wallet not found' });
      }

      // First, disconnect all wallets for this user
      await pool.execute(
        'UPDATE user_wallets SET is_connected = false WHERE user_id = ?',
        [userId]
      );

      // Then connect the selected wallet
      await pool.execute(
        'UPDATE user_wallets SET is_connected = true WHERE id = ? AND user_id = ?',
        [walletId, userId]
      );

      // Get updated wallet
      const [updatedWallet] = (await pool.execute(
        'SELECT * FROM user_wallets WHERE id = ?',
        [walletId]
      )) as [any[], any];

      return res.status(200).json({
        success: true,
        wallet:
          Array.isArray(updatedWallet) && updatedWallet.length > 0
            ? updatedWallet[0]
            : null,
        message: 'Wallet connected',
      });
    } catch (error: any) {
      console.error('Error connecting wallet:', {
        message: error?.message,
        code: error?.code,
        errno: error?.errno,
        sqlState: error?.sqlState,
        sqlMessage: error?.sqlMessage,
        address: error?.address,
        port: error?.port,
        db: getDbDebugInfo(),
      });
      return res
        .status(500)
        .json({ error: 'Internal server error', details: error.message });
    }
  }

  // Delete a wallet
  if (req.method === 'PATCH') {
    try {
      const userId = await requireSessionUserId(req, res);
      if (userId === null) return;

      const { wallet_address } = req.body as { wallet_address?: string };
      if (!wallet_address) {
        return res.status(400).json({ error: 'Missing wallet_address' });
      }

      const [walletLookup] = (await pool.execute(
        'SELECT id, wallet_type FROM user_wallets WHERE id = ? AND user_id = ?',
        [walletId, userId]
      )) as [any[], any];

      if (!Array.isArray(walletLookup) || walletLookup.length === 0) {
        return res.status(404).json({ error: 'Wallet not found' });
      }

      const walletType = walletLookup[0].wallet_type as string | undefined;
      let nextWalletAddress: string;
      try {
        nextWalletAddress = normalizeWalletAddressForStorage(
          wallet_address,
          walletType
        );
      } catch (normalizeErr) {
        const msg =
          normalizeErr instanceof Error && normalizeErr.message === 'INVALID_XRPL_ADDRESS_CHECKSUM'
            ? 'Invalid XRPL address (checksum). Copy the address from your wallet.'
            : normalizeErr instanceof Error
              ? normalizeErr.message
              : String(normalizeErr);
        return res.status(400).json({ error: msg });
      }
      const nextComparisonAddress = normalizeWalletAddress(wallet_address);

      const [allUserWallets] = (await pool.execute(
        'SELECT id, wallet_address FROM user_wallets WHERE user_id = ? AND id <> ?',
        [userId, walletId]
      )) as [any[], any];

      const duplicateWallet = (Array.isArray(allUserWallets) ? allUserWallets : []).find(
        wallet =>
          typeof wallet.wallet_address === 'string' &&
          normalizeWalletAddress(wallet.wallet_address) === nextComparisonAddress
      );

      if (duplicateWallet) {
        return res.status(409).json({ error: 'Wallet already exists for this user' });
      }

      await pool.execute(
        'UPDATE user_wallets SET wallet_address = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
        [nextWalletAddress, walletId, userId]
      );

      const [updatedWallet] = (await pool.execute(
        'SELECT * FROM user_wallets WHERE id = ?',
        [walletId]
      )) as [any[], any];

      return res.status(200).json({
        success: true,
        wallet:
          Array.isArray(updatedWallet) && updatedWallet.length > 0
            ? updatedWallet[0]
            : null,
        message: 'Wallet updated successfully',
      });
    } catch (error: any) {
      console.error('Error updating wallet:', {
        message: error?.message,
        code: error?.code,
        errno: error?.errno,
        sqlState: error?.sqlState,
        sqlMessage: error?.sqlMessage,
        address: error?.address,
        port: error?.port,
        db: getDbDebugInfo(),
      });
      return res
        .status(500)
        .json({ error: 'Internal server error', details: error.message });
    }
  }

  // Delete a wallet
  if (req.method === 'DELETE') {
    try {
      const userId = await requireSessionUserId(req, res);
      if (userId === null) return;

      const [walletLookup] = (await pool.execute(
        'SELECT wallet_address FROM user_wallets WHERE id = ? AND user_id = ?',
        [walletId, userId]
      )) as [any[], any];

      if (!Array.isArray(walletLookup) || walletLookup.length === 0) {
        return res.status(404).json({ error: 'Wallet not found' });
      }

      const walletAddressToDelete = walletLookup[0].wallet_address as string;

      await deletePinsForUserWallet(
        pool,
        userId,
        normalizeWalletAddress(walletAddressToDelete)
      );

      // Delete wallet (verify it belongs to user)
      const [result] = (await pool.execute(
        'DELETE FROM user_wallets WHERE id = ? AND user_id = ?',
        [walletId, userId]
      )) as [any, any];

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Wallet not found' });
      }

      return res.status(200).json({
        success: true,
        message: 'Wallet deleted successfully',
      });
    } catch (error: any) {
      console.error('Error deleting wallet:', {
        message: error?.message,
        code: error?.code,
        errno: error?.errno,
        sqlState: error?.sqlState,
        sqlMessage: error?.sqlMessage,
        address: error?.address,
        port: error?.port,
        db: getDbDebugInfo(),
      });
      return res
        .status(500)
        .json({ error: 'Internal server error', details: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
