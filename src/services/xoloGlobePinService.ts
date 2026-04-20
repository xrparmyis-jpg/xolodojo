const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export interface XoloGlobePinSocials {
  twitter?: string;
  discord?: string;
  tiktok?: string;
  instagram?: string;
  telegram?: string;
  linkedin?: string;
}

export interface XoloGlobePin {
  token_id: string;
  wallet_address: string;
  issuer: string | null;
  uri: string | null;
  latitude: number;
  longitude: number;
  image_url: string | null;
  title: string | null;
  collection_name: string | null;
  socials?: XoloGlobePinSocials | null;
  pin_note?: string | null;
  pinned_at: string;
}

interface XoloGlobePinsResponse {
  success: boolean;
  pins: XoloGlobePin[];
}

export async function getXoloGlobePins(): Promise<XoloGlobePin[]> {
  const response = await fetch(`${API_BASE_URL}/user/xologlobe-pins`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }

  const data = (await response.json()) as XoloGlobePinsResponse;
  return data.pins || [];
}