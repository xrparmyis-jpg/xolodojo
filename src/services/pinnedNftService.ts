const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export interface PinnedNftItem {
  token_id: string;
  issuer: string | null;
  uri: string | null;
  title?: string | null;
  collection_name?: string | null;
  pinned_at: string;
}

interface PinnedNftsResponse {
  success: boolean;
  pinned_nfts: PinnedNftItem[];
}

export async function getPinnedNfts(
  auth0Id: string,
  accessToken?: string
): Promise<PinnedNftItem[]> {
  const response = await fetch(
    `${API_BASE_URL}/user/pinned-nfts?auth0_id=${encodeURIComponent(auth0Id)}`,
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
    issuer?: string | null;
    uri?: string | null;
    title?: string | null;
    collection_name?: string | null;
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
