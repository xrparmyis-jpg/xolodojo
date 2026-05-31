import type { VercelRequest, VercelResponse } from '@vercel/node';
import { deletePinsForUserWallet } from '../../../lib/userPinsRepo.js';
import { resolveCanonicalClassicAddress } from '../../../xrplClassicAddress.js';
import { requireAuthUserId } from '../../../lib/requestAuth.js';
import { getServiceRoleClient } from '../../../lib/supabaseAdmin.js';

function isLikelyXrplAddress(value: string): boolean {
  return /^r[1-9A-HJ-NP-Za-km-z]{24,34}$/.test(value.trim());
}

function normalizeWalletAddressForStorage(value: string, walletType?: string): string {
  const trimmed = value.trim();
  if (walletType === 'xaman' || walletType === 'joey') {
    const resolved = resolveCanonicalClassicAddress(trimmed);
    if (!resolved) throw new Error('INVALID_XRPL_ADDRESS_CHECKSUM');
    return resolved;
  }
  if (isLikelyXrplAddress(trimmed)) {
    return resolveCanonicalClassicAddress(trimmed) ?? trimmed;
  }
  return trimmed.toLowerCase();
}

function normalizeWalletAddress(value: string): string {
  return value.trim().toLowerCase();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  let walletId = req.query.walletId as string;
  if (!walletId) {
    const match = req.url?.match(/\/wallets\/([^/]+)/);
    if (match) walletId = match[1];
  }

  const supabase = getServiceRoleClient();

  if (req.url?.includes('/connect') && req.method === 'PUT') {
    try {
      const userId = await requireAuthUserId(req, res);
      if (userId === null) return;

      const { data: wallet } = await supabase
        .from('user_wallets')
        .select('id')
        .eq('id', walletId)
        .eq('user_id', userId)
        .maybeSingle();

      if (!wallet) {
        return res.status(404).json({ error: 'Wallet not found' });
      }

      await supabase.from('user_wallets').update({ is_connected: false }).eq('user_id', userId);
      await supabase
        .from('user_wallets')
        .update({ is_connected: true, updated_at: new Date().toISOString() })
        .eq('id', walletId)
        .eq('user_id', userId);

      const { data: updatedWallet } = await supabase
        .from('user_wallets')
        .select('*')
        .eq('id', walletId)
        .maybeSingle();

      return res.status(200).json({
        success: true,
        wallet: updatedWallet ?? null,
        message: 'Wallet connected',
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      return res.status(500).json({ error: 'Internal server error', details: err.message });
    }
  }

  if (req.method === 'PATCH') {
    try {
      const userId = await requireAuthUserId(req, res);
      if (userId === null) return;

      const { wallet_address } = req.body as { wallet_address?: string };
      if (!wallet_address) {
        return res.status(400).json({ error: 'Missing wallet_address' });
      }

      const { data: walletLookup } = await supabase
        .from('user_wallets')
        .select('id, wallet_type')
        .eq('id', walletId)
        .eq('user_id', userId)
        .maybeSingle();

      if (!walletLookup) {
        return res.status(404).json({ error: 'Wallet not found' });
      }

      let nextWalletAddress: string;
      try {
        nextWalletAddress = normalizeWalletAddressForStorage(
          wallet_address,
          walletLookup.wallet_type
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

      const { data: allUserWallets } = await supabase
        .from('user_wallets')
        .select('id, wallet_address')
        .eq('user_id', userId)
        .neq('id', walletId);

      const duplicateWallet = (allUserWallets ?? []).find(
        (w) =>
          typeof w.wallet_address === 'string' &&
          normalizeWalletAddress(w.wallet_address) === nextComparisonAddress
      );

      if (duplicateWallet) {
        return res.status(409).json({ error: 'Wallet already exists for this user' });
      }

      await supabase
        .from('user_wallets')
        .update({ wallet_address: nextWalletAddress, updated_at: new Date().toISOString() })
        .eq('id', walletId)
        .eq('user_id', userId);

      const { data: updatedWallet } = await supabase
        .from('user_wallets')
        .select('*')
        .eq('id', walletId)
        .maybeSingle();

      return res.status(200).json({
        success: true,
        wallet: updatedWallet ?? null,
        message: 'Wallet updated successfully',
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      return res.status(500).json({ error: 'Internal server error', details: err.message });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const userId = await requireAuthUserId(req, res);
      if (userId === null) return;

      const { data: walletLookup } = await supabase
        .from('user_wallets')
        .select('wallet_address')
        .eq('id', walletId)
        .eq('user_id', userId)
        .maybeSingle();

      if (!walletLookup) {
        return res.status(404).json({ error: 'Wallet not found' });
      }

      await deletePinsForUserWallet(userId, normalizeWalletAddress(walletLookup.wallet_address));

      const { data: deleted, error } = await supabase
        .from('user_wallets')
        .delete()
        .eq('id', walletId)
        .eq('user_id', userId)
        .select('id');

      if (error) throw error;
      if (!deleted?.length) {
        return res.status(404).json({ error: 'Wallet not found' });
      }

      return res.status(200).json({ success: true, message: 'Wallet deleted successfully' });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      return res.status(500).json({ error: 'Internal server error', details: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
