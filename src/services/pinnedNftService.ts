const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const credFetch = (input: string, init?: RequestInit) =>
  fetch(input, { ...init, credentials: 'include' });

export interface PinnedNftSocials {
  twitter?: string;
  discord?: string;
  tiktok?: string;
  instagram?: string;
  telegram?: string;
  linkedin?: string;
}

export interface PinnedNftItem {
  token_id: string;
  wallet_address: string;
  issuer: string | null;
  uri: string | null;
  latitude?: number | null;
  longitude?: number | null;
  image_url?: string | null;
  title?: string | null;
  collection_name?: string | null;
  socials?: PinnedNftSocials | null;
  pin_note?: string | null;
  pinned_at: string;
}

interface PinnedNftsResponse {
  success: boolean;
  pinned_nfts: PinnedNftItem[];
}

export async function getPinnedNfts(walletAddress?: string): Promise<PinnedNftItem[]> {
  const walletQuery = walletAddress
    ? `?wallet_address=${encodeURIComponent(walletAddress)}`
    : '';
  const response = await credFetch(`${API_BASE_URL}/user/pinned-nfts${walletQuery}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }

  const data = (await response.json()) as PinnedNftsResponse;
  return data.pinned_nfts || [];
}

export async function pinNft(nft: {
  token_id: string;
  wallet_address: string;
  issuer?: string | null;
  uri?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  image_url?: string | null;
  title?: string | null;
  collection_name?: string | null;
  socials?: PinnedNftSocials;
  pin_note?: string | null;
}): Promise<PinnedNftItem[]> {
  const response = await credFetch(`${API_BASE_URL}/user/pinned-nfts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nft }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }

  const data = (await response.json()) as PinnedNftsResponse;
  return data.pinned_nfts || [];
}

export async function unpinNft(
  tokenId: string,
  walletAddress: string
): Promise<PinnedNftItem[]> {
  const response = await credFetch(`${API_BASE_URL}/user/pinned-nfts`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token_id: tokenId,
      wallet_address: walletAddress,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }

  const data = (await response.json()) as PinnedNftsResponse;
  return data.pinned_nfts || [];
}
