import type { VercelRequest, VercelResponse } from '@vercel/node';
import mysql from 'mysql2/promise';
import { readFile } from 'node:fs/promises';
import { deletePinsForWalletNotHeld } from '../../lib/userPinsRepo.js';
import {
	isResolvableLedgerAccount,
	resolveCanonicalClassicAddress,
	stripInvisible,
} from '../../xrplClassicAddress.js';
import { getRequestAuth } from '../../lib/sessionAuth.js';

let pool: mysql.Pool | null = null;
let cachedCollectionAddress: string | null | undefined;

function getPool(): mysql.Pool {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3308'),
      database: process.env.DB_NAME || 'donovan_db',
      user: process.env.DB_USER || 'donovan_user',
      password: process.env.DB_PASSWORD || 'donovan_password',
      ssl:
        process.env.NODE_ENV === 'production'
          ? { rejectUnauthorized: false }
          : undefined,
      waitForConnections: true,
      connectionLimit: 1,
      queueLimit: 0,
    });
  }
  return pool;
}

function isLikelyClassicShape(address: string) {
  return /^r[1-9A-HJ-NP-Za-km-z]{24,34}$/.test(address);
}

function getSafeXrplFallback(
  walletAddress: string,
  details?: {
    error?: string;
    rpc_urls_attempted?: string[];
  }
) {
  return {
    success: true,
    wallet_address: walletAddress,
    is_xrpl: true,
    xrp_balance: '0.000000',
    nft_count: 0,
    nfts: [],
    xrpl_fetch_failed: true,
    xrpl_fetch_error: details?.error || null,
    xrpl_rpc_urls_attempted: details?.rpc_urls_attempted || [],
  };
}

function getXrplRpcUrls() {
  const configured =
    process.env.XRPL_RPC_URL || process.env.VITE_XRPL_RPC_URL || '';

  const configuredUrls = configured
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);

  const defaultUrls = [
    'https://xrplcluster.com/',
    'https://xrpl.ws/',
    'https://s1.ripple.com:51234/',
  ];

  const urls = configuredUrls.length > 0 ? configuredUrls : defaultUrls;
  return Array.from(new Set(urls));
}

function normalizeCollectionAddress(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const normalized = value.trim().replace(/^['"]|['"]$/g, '').trim();
  return normalized ? normalized.toLowerCase() : null;
}

async function getConfiguredCollectionAddress(): Promise<string | null> {
  if (cachedCollectionAddress !== undefined) {
    return cachedCollectionAddress;
  }

  const envAddress = normalizeCollectionAddress(
    process.env.NFT_COLLECTION_CONTRACT_ADDRESS ||
      process.env.VITE_NFT_COLLECTION_CONTRACT_ADDRESS
  );

  if (envAddress) {
    cachedCollectionAddress = envAddress;
    return cachedCollectionAddress;
  }

  try {
    const envLocalPath = new URL('../../.env.local', import.meta.url);
    const envLocalContent = await readFile(envLocalPath, 'utf8');
    const line = envLocalContent
      .split(/\r?\n/)
      .find(item => item.trim().startsWith('NFT_COLLECTION_CONTRACT_ADDRESS='));

    if (!line) {
      cachedCollectionAddress = null;
      return cachedCollectionAddress;
    }

    const [, value = ''] = line.split('=', 2);
    cachedCollectionAddress = normalizeCollectionAddress(value);
    return cachedCollectionAddress;
  } catch {
    cachedCollectionAddress = null;
    return cachedCollectionAddress;
  }
}

async function callXrpl<T>(method: string, params: Record<string, unknown>) {
  const rpcUrls = getXrplRpcUrls();
  const errors: string[] = [];

  for (const xrplUrl of rpcUrls) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    try {
      const response = await fetch(xrplUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method, params: [params] }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`status ${response.status}`);
      }

      const data = (await response.json()) as {
        result?: {
          status?: string;
          error_message?: string;
          error?: string;
        } & T;
      };

      if (!data.result || data.result.status !== 'success') {
        throw new Error(
          data.result?.error_message || data.result?.error || 'XRPL request failed'
        );
      }

      clearTimeout(timeout);
      return data.result as T;
    } catch (error: any) {
      clearTimeout(timeout);
      errors.push(`${xrplUrl} -> ${error?.message || 'unknown error'}`);
    }
  }

  throw new Error(`XRPL RPC failed on all endpoints: ${errors.join(' | ')}`);
}

function isAccountMissingRippledError(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes('actnotfound') ||
    m.includes('account not found') ||
    m.includes('invalid account') ||
    (m.includes('could not find ledger') && m.includes('account'))
  );
}

async function fetchAllAccountNfts(
  accountForRpc: string
): Promise<Array<{ NFTokenID: string; Issuer?: string; URI?: string; NFTokenTaxon?: number }>> {
  let allNfts: Array<{ NFTokenID: string; Issuer?: string; URI?: string; NFTokenTaxon?: number }> = [];
  let marker: string | undefined;
  do {
    const params: Record<string, unknown> = {
      account: accountForRpc,
      ledger_index: 'validated',
    };
    if (marker) params.marker = marker;
    const resp = await callXrpl<{
      account_nfts?: Array<{ NFTokenID: string; Issuer?: string; URI?: string; NFTokenTaxon?: number }>;
      marker?: string;
    }>('account_nfts', params);
    if (resp.account_nfts) allNfts = allNfts.concat(resp.account_nfts);
    marker = resp.marker;
  } while (marker);
  return allNfts;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const auth = await getRequestAuth(req);
    if (!auth) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const walletAddress = Array.isArray(req.query.wallet_address)
      ? req.query.wallet_address[0]
      : req.query.wallet_address;

    if (!walletAddress) {
      return res.status(400).json({ error: 'Missing wallet_address' });
    }

    const queryTrim = stripInvisible(String(walletAddress));
    const queryResolved = resolveCanonicalClassicAddress(queryTrim);
    if (!queryResolved && !isLikelyClassicShape(queryTrim) && !isResolvableLedgerAccount(queryTrim)) {
      return res.status(200).json({
        success: true,
        wallet_address: walletAddress,
        is_xrpl: false,
        xrp_balance: null,
        nft_count: 0,
        nfts: [],
        xrpl_fetch_failed: false,
      });
    }

    const dbPool = getPool();

    let userId: number | null = null;
    let storedWalletAddress: string;
    let accountWalletRowId: number | null = null;

    if (auth.kind === 'wallet') {
      if (queryTrim.toLowerCase() !== auth.walletAddress.toLowerCase()) {
        return res.status(403).json({ error: 'Wallet address does not match session' });
      }
      storedWalletAddress = auth.walletAddress;
    } else {
      userId = auth.userId;
      const [walletResult] = (await dbPool.execute(
        'SELECT id, wallet_address FROM user_wallets WHERE user_id = ? AND LOWER(wallet_address) = LOWER(?)',
        [userId, walletAddress]
      )) as [any[], any];

      if (!Array.isArray(walletResult) || walletResult.length === 0) {
        return res.status(404).json({ error: 'Wallet not found for user' });
      }

      const walletRow = walletResult[0] as { id: number; wallet_address: string };
      accountWalletRowId = walletRow.id;
      storedWalletAddress = String(walletRow.wallet_address ?? '');
    }

    /** Never call rippled with an invalid-checksum string; decode+encode only via resolve (or null). */
    const accountForRpc =
      resolveCanonicalClassicAddress(storedWalletAddress) ??
      resolveCanonicalClassicAddress(queryTrim) ??
      null;

    if (!accountForRpc) {
      return res.status(200).json(
        getSafeXrplFallback(storedWalletAddress || queryTrim, {
          error:
            'XRPL address checksum invalid (often caused by lowercased address). Remove the wallet and add it again, or contact support.',
          rpc_urls_attempted: getXrplRpcUrls(),
        })
      );
    }

    if (
      auth.kind === 'user' &&
      accountWalletRowId != null &&
      userId != null &&
      accountForRpc !== storedWalletAddress &&
      isLikelyClassicShape(accountForRpc)
    ) {
      void dbPool
        .execute(
          'UPDATE user_wallets SET wallet_address = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
          [accountForRpc, accountWalletRowId, userId]
        )
        .catch((e: unknown) => {
          console.warn('[wallet-assets] Could not upgrade wallet_address checksum casing:', e);
        });
    }

    const rpcUrlsAttempted = getXrplRpcUrls();

    const accountInfo = await callXrpl<{
      account_data?: { Balance?: string };
    }>('account_info', {
      account: accountForRpc,
      ledger_index: 'validated',
      strict: true,
    }).catch((error: Error) => {
      console.warn('XRPL account_info failed (will try account_nfts if not missing-account):', {
        accountForRpc,
        queryWalletAddress: walletAddress,
        message: error.message,
        rpcUrlsAttempted,
      });
      return { error };
    });

    let accountInfoUnavailable = false;
    let xrpBalance = '0.000000';

    if ('error' in accountInfo) {
      const errMsg = accountInfo.error.message || '';
      if (isAccountMissingRippledError(errMsg)) {
        return res.status(200).json(
          getSafeXrplFallback(accountForRpc, {
            error: errMsg,
            rpc_urls_attempted: rpcUrlsAttempted,
          })
        );
      }
      accountInfoUnavailable = true;
    } else {
      const balanceDrops = accountInfo.account_data?.Balance || '0';
      xrpBalance = (Number(balanceDrops) / 1_000_000).toFixed(6);
    }

    let nfts: Array<{ NFTokenID: string; Issuer?: string; URI?: string; NFTokenTaxon?: number }> = [];
    try {
      nfts = await fetchAllAccountNfts(accountForRpc);
    } catch (nftErr: unknown) {
      const msg = nftErr instanceof Error ? nftErr.message : String(nftErr);
      console.warn('XRPL account_nfts failed after account_info issue or alone:', {
        accountForRpc,
        accountInfoUnavailable,
        message: msg,
      });
      if (accountInfoUnavailable) {
        return res.status(200).json(
          getSafeXrplFallback(accountForRpc, {
            error: `account_info and account_nfts failed: ${msg}`,
            rpc_urls_attempted: rpcUrlsAttempted,
          })
        );
      }
      return res.status(200).json(
        getSafeXrplFallback(accountForRpc, {
          error: msg,
          rpc_urls_attempted: rpcUrlsAttempted,
        })
      );
    }
    const configuredCollectionAddress = await getConfiguredCollectionAddress();

    // Restore filtering by collection address
    let filteredNfts = nfts;
    if (configuredCollectionAddress) {
      filteredNfts = nfts.filter(
        (nft) => (nft.Issuer || '').toLowerCase() === configuredCollectionAddress
      );
      if (filteredNfts.length === 0) {
        // Add detailed logs for debugging
        console.log('[NFT DEBUG] No NFTs found for collection', {
          accountForRpc,
          configuredCollectionAddress,
          allNftCount: nfts.length,
          allNftIds: nfts.map(n => n.NFTokenID),
          allNftIssuers: nfts.map(n => n.Issuer),
        });
      } else {
        console.log('[NFT DEBUG] Filtered NFTs for collection', {
          accountForRpc,
          configuredCollectionAddress,
          filteredCount: filteredNfts.length,
          filteredNftIds: filteredNfts.map(n => n.NFTokenID),
        });
      }
    } else {
      console.log('[NFT DEBUG] No collection address configured, returning all NFTs', {
        accountForRpc,
        allNftCount: nfts.length,
      });
    }

    // Wallet-only sessions (`user_id IS NULL` pins): do not reconcile pins from ledger here.
    // The NOT IN (held tokens) delete can drop pins when rippled NFTokenID strings and DB
    // token_id differ slightly; email+wallet users still get cleanup below.
    if (auth.kind !== 'wallet') {
      const heldNfTokenIds = new Set(
        nfts
          .map(n => n.NFTokenID)
          .filter((id): id is string => typeof id === 'string' && id.length > 0)
      );
      try {
        const removed = await deletePinsForWalletNotHeld(
          dbPool,
          userId,
          accountForRpc,
          heldNfTokenIds,
          nfts.length
        );
        if (removed > 0) {
          console.log('[wallet-assets] Removed stale pins (NFT no longer in wallet)', {
            userId,
            account: accountForRpc,
            removed,
            onChainNftCount: heldNfTokenIds.size,
          });
        }
      } catch (reconcileErr) {
        console.warn('[wallet-assets] Pin reconcile failed (non-fatal):', reconcileErr);
      }
    }

    return res.status(200).json({
      success: true,
      wallet_address: accountForRpc,
      is_xrpl: true,
      xrp_balance: xrpBalance,
      xrpl_fetch_failed: false,
      ...(accountInfoUnavailable ? { account_info_unavailable: true } : {}),
      collection_filter_applied: Boolean(configuredCollectionAddress),
      configured_collection_address: configuredCollectionAddress,
      nft_count: filteredNfts.length,
      nfts: filteredNfts.map(nft => ({
        token_id: nft.NFTokenID,
        issuer: nft.Issuer || null,
        taxon: nft.NFTokenTaxon ?? null,
        uri: nft.URI || null,
      })),
    });
  } catch (error: any) {
    console.error('Error fetching wallet assets:', error);
      res.status(500).json({ error: 'Internal server error', details: error.message });
      return;
  }
}
