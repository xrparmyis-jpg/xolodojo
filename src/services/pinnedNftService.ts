import { apiFetch, API_BASE_URL } from '../lib/apiFetch';

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
  success?: boolean;
  pinned_nfts?: PinnedNftItem[];
}

export type PinNftPayload = {
  token_id: string;
  wallet_address: string;
  issuer?: string | null;
  uri?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  image_url?: string | null;
  title?: string | null;
  collection_name?: string | null;
  socials?: PinnedNftSocials | null;
  pin_note?: string | null;
};

function extractPinnedNfts(data: PinnedNftsResponse): PinnedNftItem[] {
  return Array.isArray(data.pinned_nfts) ? data.pinned_nfts : [];
}

export async function getPinnedNfts(walletAddress?: string): Promise<PinnedNftItem[]> {
  const query = walletAddress
    ? `?wallet_address=${encodeURIComponent(walletAddress)}`
    : '';
  const response = await apiFetch(`${API_BASE_URL}/user/pinned-nfts${query}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }

  const data = (await response.json()) as PinnedNftsResponse;
  return extractPinnedNfts(data);
}

export async function pinNft(payload: PinNftPayload): Promise<PinnedNftItem[]> {
  const { wallet_address, ...nft } = payload;
  const response = await apiFetch(`${API_BASE_URL}/user/pinned-nfts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      wallet_address,
      nft,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }

  const data = (await response.json()) as PinnedNftsResponse;
  return extractPinnedNfts(data);
}

export async function unpinNft(
  tokenId: string,
  walletAddress: string
): Promise<PinnedNftItem[]> {
  const response = await apiFetch(`${API_BASE_URL}/user/pinned-nfts`, {
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
  return extractPinnedNfts(data);
}
