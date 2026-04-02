const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export interface PinnedNftSocials {
  twitter?: string;
  discord?: string;
  tiktok?: string;
  instagram?: string;
  telegram?: string;
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
  /** Pin description on the globe popup (`src/constants/pinNote.ts`; min length enforced on pin). */
  pin_note?: string | null;
  /** Optional site URL without scheme (e.g. example.com); shown as https in popup. */
  website_url?: string | null;
  pinned_at: string;
}

interface PinnedNftsResponse {
  success: boolean;
  pinned_nfts: PinnedNftItem[];
}

export async function getPinnedNfts(
  auth0Id: string,
  walletAddress?: string,
  accessToken?: string
): Promise<PinnedNftItem[]> {
  const walletQuery = walletAddress
    ? `&wallet_address=${encodeURIComponent(walletAddress)}`
    : '';
  const response = await fetch(
    `${API_BASE_URL}/user/pinned-nfts?auth0_id=${encodeURIComponent(auth0Id)}${walletQuery}`,
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

  const data = (await response.json()) as PinnedNftsResponse;
  return data.pinned_nfts || [];
}

export async function pinNft(
  auth0Id: string,
  nft: {
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
    website_url?: string | null;
  },
  accessToken?: string
): Promise<PinnedNftItem[]> {
  const response = await fetch(`${API_BASE_URL}/user/pinned-nfts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
    },
    body: JSON.stringify({
      auth0_id: auth0Id,
      nft,
    }),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }

  const data = (await response.json()) as PinnedNftsResponse;
  return data.pinned_nfts || [];
}

export async function unpinNft(
  auth0Id: string,
  tokenId: string,
  walletAddress: string,
  accessToken?: string
): Promise<PinnedNftItem[]> {
  const response = await fetch(`${API_BASE_URL}/user/pinned-nfts`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
    },
    body: JSON.stringify({
      auth0_id: auth0Id,
      token_id: tokenId,
      wallet_address: walletAddress,
    }),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }

  const data = (await response.json()) as PinnedNftsResponse;
  return data.pinned_nfts || [];
}
