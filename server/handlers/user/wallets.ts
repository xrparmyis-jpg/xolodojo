import type { VercelRequest, VercelResponse } from '@vercel/node';
import { resolveCanonicalClassicAddress } from '../../xrplClassicAddress.js';
import { requireAuthUserId } from '../../lib/requestAuth.js';
import { getServiceRoleClient } from '../../lib/supabaseAdmin.js';

function parsePreferences(preferences: unknown): Record<string, unknown> {
  if (!preferences || typeof preferences !== 'object' || Array.isArray(preferences)) {
    return {};
  }
  return preferences as Record<string, unknown>;
}

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

function normalizeWalletAddressForComparison(value: string): string {
  return value.trim().toLowerCase();
}

function parseWalletLabels(preferences: Record<string, unknown>): Record<string, string> {
  const walletLabelsRaw = preferences.wallet_labels;
  if (!walletLabelsRaw || typeof walletLabelsRaw !== 'object') return {};
  const source = walletLabelsRaw as Record<string, unknown>;
  return Object.entries(source).reduce<Record<string, string>>((acc, [key, value]) => {
    if (typeof value !== 'string') return acc;
    const normalizedKey = normalizeWalletAddressForComparison(key);
    const normalizedLabel = value.trim();
    if (!normalizedKey || !normalizedLabel) return acc;
    acc[normalizedKey] = normalizedLabel;
    return acc;
  }, {});
}

async function getUserPreferences(userId: string): Promise<Record<string, unknown>> {
  const supabase = getServiceRoleClient();
  const { data } = await supabase
    .from('profiles')
    .select('preferences')
    .eq('id', userId)
    .maybeSingle();
  return parsePreferences(data?.preferences);
}

async function upsertUserPreferences(userId: string, preferences: Record<string, unknown>) {
  const supabase = getServiceRoleClient();
  await supabase
    .from('profiles')
    .update({ preferences, updated_at: new Date().toISOString() })
    .eq('id', userId);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    try {
      const userId = await requireAuthUserId(req, res);
      if (userId === null) return;

      const supabase = getServiceRoleClient();
      const { data: result, error } = await supabase
        .from('user_wallets')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });
      if (error) throw error;

      const preferences = await getUserPreferences(userId);
      const walletLabels = parseWalletLabels(preferences);
      const wallets = (result ?? []).map((wallet) => {
        const normalizedAddress =
          typeof wallet.wallet_address === 'string'
            ? normalizeWalletAddressForComparison(wallet.wallet_address)
            : '';
        return { ...wallet, wallet_label: walletLabels[normalizedAddress] ?? null };
      });

      res.status(200).json({ success: true, wallets });
      return;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      res.status(500).json({ error: 'Internal server error', details: err.message });
      return;
    }
  }

  if (req.method === 'POST') {
    try {
      const userId = await requireAuthUserId(req, res);
      if (userId === null) return;

      const body = req.body as Record<string, unknown>;
      const wallet_address = body.wallet_address;
      const wallet_type = body.wallet_type;
      const wallet_label = body.wallet_label;
      if (typeof wallet_address !== 'string' || typeof wallet_type !== 'string') {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }

      let normalizedWalletAddress: string;
      try {
        normalizedWalletAddress = normalizeWalletAddressForStorage(wallet_address, wallet_type);
      } catch (normalizeErr) {
        const msg =
          normalizeErr instanceof Error && normalizeErr.message === 'INVALID_XRPL_ADDRESS_CHECKSUM'
            ? 'Invalid XRPL address (checksum). Copy the address from your wallet; do not type it manually.'
            : normalizeErr instanceof Error
              ? normalizeErr.message
              : String(normalizeErr);
        res.status(400).json({ error: msg });
        return;
      }
      const comparisonWalletAddress = normalizeWalletAddressForComparison(wallet_address);
      const supabase = getServiceRoleClient();

      const { data: existingWallets } = await supabase
        .from('user_wallets')
        .select('id, wallet_address')
        .eq('user_id', userId);

      const duplicateWallet = (existingWallets ?? []).find(
        (wallet) =>
          typeof wallet.wallet_address === 'string' &&
          normalizeWalletAddressForComparison(wallet.wallet_address) === comparisonWalletAddress
      );

      if (duplicateWallet) {
        let preferences = await getUserPreferences(userId);
        if (typeof wallet_label === 'string' && wallet_label.trim()) {
          const existingLabelsRaw = preferences.wallet_labels;
          const existingLabels =
            existingLabelsRaw && typeof existingLabelsRaw === 'object'
              ? (existingLabelsRaw as Record<string, unknown>)
              : {};
          preferences = {
            ...preferences,
            wallet_labels: {
              ...existingLabels,
              [comparisonWalletAddress]: wallet_label.trim(),
            },
          };
          await upsertUserPreferences(userId, preferences);
          preferences = await getUserPreferences(userId);
        }

        const { data: walletRow } = await supabase
          .from('user_wallets')
          .select('*')
          .eq('id', duplicateWallet.id)
          .eq('user_id', userId)
          .maybeSingle();
        if (!walletRow) {
          res.status(500).json({ error: 'Internal server error' });
          return;
        }
        const walletLabels = parseWalletLabels(preferences);
        const normalizedAddr = normalizeWalletAddressForComparison(walletRow.wallet_address);
        res.status(200).json({
          success: true,
          wallet: { ...walletRow, wallet_label: walletLabels[normalizedAddr] ?? null },
          message: 'Wallet is now connected.',
          already_exists: true,
        });
        return;
      }

      const { data: newWallet, error: insertError } = await supabase
        .from('user_wallets')
        .insert({
          user_id: userId,
          wallet_address: normalizedWalletAddress,
          wallet_type,
          is_connected: false,
        })
        .select('*')
        .single();
      if (insertError) throw insertError;

      if (typeof wallet_label === 'string' && wallet_label.trim()) {
        const preferences = await getUserPreferences(userId);
        const existingLabelsRaw = preferences.wallet_labels;
        const existingLabels =
          existingLabelsRaw && typeof existingLabelsRaw === 'object'
            ? (existingLabelsRaw as Record<string, unknown>)
            : {};
        await upsertUserPreferences(userId, {
          ...preferences,
          wallet_labels: {
            ...existingLabels,
            [comparisonWalletAddress]: wallet_label.trim(),
          },
        });
      }

      res.status(201).json({
        success: true,
        wallet: newWallet
          ? {
              ...newWallet,
              wallet_label: typeof wallet_label === 'string' ? wallet_label.trim() || null : null,
            }
          : null,
        message: 'Wallet added successfully',
      });
      return;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      res.status(500).json({ error: 'Internal server error', details: err.message });
      return;
    }
  }

  res.status(405).json({ error: 'Method not allowed' });
}
