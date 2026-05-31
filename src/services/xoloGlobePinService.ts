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

function formatApiErrorDetails(details: unknown): string | null {
  if (typeof details === 'string' && details.trim()) {
    return details.trim();
  }
  if (details && typeof details === 'object') {
    const record = details as Record<string, unknown>;
    const parts = [record.message, record.code, record.details, record.hint].filter(
      (part): part is string => typeof part === 'string' && part.length > 0
    );
    if (parts.length > 0) {
      return parts.join(' — ');
    }
  }
  return null;
}

function parseApiErrorBody(
  text: string,
  status: number
): { error?: string; details?: unknown } {
  if (!text.trim()) {
    if (status === 502 || status === 503 || status === 504) {
      return {
        error:
          'API server is not running. Start it with npm run dev:api or npm run dev:full.',
      };
    }
    return { error: `Request failed (HTTP ${status})` };
  }

  try {
    return JSON.parse(text) as { error?: string; details?: unknown };
  } catch {
    if (status === 502 || status === 503 || status === 504) {
      return {
        error:
          'API server is not running. Start it with npm run dev:api or npm run dev:full.',
      };
    }
    return { error: `Request failed (HTTP ${status})` };
  }
}

export async function getXoloGlobePins(): Promise<XoloGlobePin[]> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/user/xologlobe-pins`, {
      method: 'GET',
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch {
    throw new Error(
      'Could not reach the API. If you are developing locally, run npm run dev:full (or npm run dev:api in a second terminal).'
    );
  }

  const text = await response.text();
  if (!response.ok) {
    const error = parseApiErrorBody(text, response.status);
    const message = error.error || `HTTP error! status: ${response.status}`;
    const details = formatApiErrorDetails(error.details);
    throw new Error(details ? `${message}: ${details}` : message);
  }

  let data: XoloGlobePinsResponse;
  try {
    data = (text ? JSON.parse(text) : { success: true, pins: [] }) as XoloGlobePinsResponse;
  } catch {
    throw new Error('API returned an invalid response while loading pins.');
  }

  return data.pins || [];
}