import type { VercelRequest, VercelResponse } from '@vercel/node';
import mysql from 'mysql2/promise';

let pool: mysql.Pool | null = null;

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

function isLikelyXrplAddress(address: string) {
  return /^r[1-9A-HJ-NP-Za-km-z]{24,34}$/.test(address);
}

function getConfiguredCollectionAddress(): string | null {
  const configuredAddress =
    process.env.NFT_COLLECTION_CONTRACT_ADDRESS ||
    process.env.VITE_NFT_COLLECTION_CONTRACT_ADDRESS ||
    '';

  const normalized = configuredAddress.trim();
  return normalized ? normalized.toLowerCase() : null;
}

async function callXrpl<T>(method: string, params: Record<string, unknown>) {
  const xrplUrl =
    process.env.XRPL_RPC_URL ||
    process.env.VITE_XRPL_RPC_URL ||
    'https://s1.ripple.com:51234/';

  const response = await fetch(xrplUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ method, params: [params] }),
  });

  if (!response.ok) {
    throw new Error(`XRPL RPC request failed with status ${response.status}`);
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

  return data.result as T;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const auth0Id = Array.isArray(req.query.auth0_id)
      ? req.query.auth0_id[0]
      : req.query.auth0_id;
    const walletAddress = Array.isArray(req.query.wallet_address)
      ? req.query.wallet_address[0]
      : req.query.wallet_address;

    if (!auth0Id || !walletAddress) {
      return res
        .status(400)
        .json({ error: 'Missing auth0_id or wallet_address' });
    }

    if (!isLikelyXrplAddress(walletAddress)) {
      return res.status(200).json({
        success: true,
        wallet_address: walletAddress,
        is_xrpl: false,
        xrp_balance: null,
        nft_count: 0,
        nfts: [],
      });
    }

    const dbPool = getPool();

    const [userResult] = (await dbPool.execute(
      'SELECT id FROM users WHERE auth0_id = ?',
      [auth0Id]
    )) as [any[], any];

    if (!Array.isArray(userResult) || userResult.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userId = userResult[0].id;

    const [walletResult] = (await dbPool.execute(
      'SELECT id FROM user_wallets WHERE user_id = ? AND wallet_address = ?',
      [userId, walletAddress]
    )) as [any[], any];

    if (!Array.isArray(walletResult) || walletResult.length === 0) {
      return res.status(404).json({ error: 'Wallet not found for user' });
    }

    const accountInfo = await callXrpl<{
      account_data?: { Balance?: string };
    }>('account_info', {
      account: walletAddress,
      ledger_index: 'validated',
      strict: true,
    });

    const accountNfts = await callXrpl<{
      account_nfts?: Array<{
        NFTokenID: string;
        Issuer?: string;
        URI?: string;
        NFTokenTaxon?: number;
      }>;
    }>('account_nfts', {
      account: walletAddress,
      ledger_index: 'validated',
      limit: 100,
    }).catch(() => ({ account_nfts: [] }));

    const balanceDrops = accountInfo.account_data?.Balance || '0';
    const xrpBalance = (Number(balanceDrops) / 1_000_000).toFixed(6);
    const nfts = accountNfts.account_nfts || [];
    const configuredCollectionAddress = getConfiguredCollectionAddress();
    const filteredNfts = configuredCollectionAddress
      ? nfts.filter(
          nft =>
            typeof nft.Issuer === 'string' &&
            nft.Issuer.toLowerCase() === configuredCollectionAddress
        )
      : nfts;

    return res.status(200).json({
      success: true,
      wallet_address: walletAddress,
      is_xrpl: true,
      xrp_balance: xrpBalance,
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
    return res
      .status(500)
      .json({ error: 'Internal server error', details: error.message });
  }
}
