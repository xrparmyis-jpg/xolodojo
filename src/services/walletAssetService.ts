import { walletAddressPreview, walletDebugLog } from '../utils/walletDebugLog';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const XRPL_CLASSIC_ADDRESS = /^r[1-9A-HJ-NP-Za-km-z]{24,34}$/;

export interface WalletAssetSummary {
  wallet_address: string;
  is_xrpl: boolean;
  xrp_balance: string | null;
  nft_count: number;
  /** On-chain summary only. Trait/rarity data is off-chain — fetch JSON from `uri` (see NftGallery). */
  nfts: Array<{
    token_id: string;
    issuer: string | null;
    taxon: number | null;
    uri: string | null;
  }>;
  /** Present when API matched wallet to configured Xolo collection issuer (see server wallet-assets). */
  collection_filter_applied?: boolean;
  configured_collection_address?: string | null;
  /** True when XRPL RPC failed and server returned an empty safe fallback (NFTs may exist on-chain). */
  xrpl_fetch_failed?: boolean;
  xrpl_fetch_error?: string | null;
  xrpl_rpc_urls_attempted?: string[];
}

export async function getWalletAssetSummary(
  auth0Id: string,
  walletAddress: string,
  accessToken?: string
): Promise<WalletAssetSummary> {
  const response = await fetch(
    `${API_BASE_URL}/user/wallet-assets?auth0_id=${encodeURIComponent(auth0Id)}&wallet_address=${encodeURIComponent(walletAddress)}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      },
    }
  );

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: 'Unknown error' }));
    const message = (error as { error?: string }).error || `HTTP error! status: ${response.status}`;
    walletDebugLog('wallet-assets request failed', {
      status: response.status,
      message,
      addressPreview: walletAddressPreview(walletAddress),
      looksLikeClassicXrpl: XRPL_CLASSIC_ADDRESS.test(walletAddress.trim()),
    });
    throw new Error(message);
  }

  const data = (await response.json()) as {
    success: boolean;
    wallet_address: string;
    is_xrpl: boolean;
    xrp_balance: string | null;
    nft_count: number;
    nfts: Array<{
      token_id: string;
      issuer: string | null;
      taxon: number | null;
      uri: string | null;
    }>;
    collection_filter_applied?: boolean;
    configured_collection_address?: string | null;
    xrpl_fetch_failed?: boolean;
    xrpl_fetch_error?: string | null;
    xrpl_rpc_urls_attempted?: string[];
  };

  const summary: WalletAssetSummary = {
    wallet_address: data.wallet_address,
    is_xrpl: data.is_xrpl,
    xrp_balance: data.xrp_balance,
    nft_count: data.nft_count,
    nfts: data.nfts || [],
    collection_filter_applied: data.collection_filter_applied,
    configured_collection_address: data.configured_collection_address ?? null,
    xrpl_fetch_failed: data.xrpl_fetch_failed,
    xrpl_fetch_error: data.xrpl_fetch_error ?? null,
    xrpl_rpc_urls_attempted: data.xrpl_rpc_urls_attempted,
  };

  walletDebugLog('wallet-assets response', {
    addressPreview: walletAddressPreview(summary.wallet_address),
    is_xrpl: summary.is_xrpl,
    nft_count: summary.nft_count,
    nftsInResponse: summary.nfts.length,
    collection_filter_applied: summary.collection_filter_applied,
    configured_collection_address: summary.configured_collection_address,
    xrpl_fetch_failed: summary.xrpl_fetch_failed,
    xrpl_fetch_error: summary.xrpl_fetch_error,
    sampleIssuers: [...new Set(summary.nfts.map((n) => n.issuer).filter(Boolean))].slice(0, 5),
    sampleTokenIds: summary.nfts.slice(0, 3).map((n) => n.token_id),
  });

  return summary;
}
