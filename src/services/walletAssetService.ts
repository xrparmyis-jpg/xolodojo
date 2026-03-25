const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

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
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
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
  };

  return {
    wallet_address: data.wallet_address,
    is_xrpl: data.is_xrpl,
    xrp_balance: data.xrp_balance,
    nft_count: data.nft_count,
    nfts: data.nfts || [],
  };
}
