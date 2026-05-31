import type { VercelRequest, VercelResponse } from '@vercel/node';
import { formatUnknownError } from '../../lib/supabaseErrors.js';
import { listGlobePins } from '../../lib/userPinsRepo.js';

interface XoloGlobePin {
  token_id: string;
  wallet_address: string;
  issuer: string | null;
  uri: string | null;
  latitude: number;
  longitude: number;
  image_url: string | null;
  title: string | null;
  collection_name: string | null;
  socials?: Record<string, string> | null;
  pin_note?: string | null;
  pinned_at: string;
}

function toGlobePin(item: Awaited<ReturnType<typeof listGlobePins>>[number]): XoloGlobePin {
  const lat = item.latitude;
  const lng = item.longitude;
  return {
    token_id: item.token_id,
    wallet_address: item.wallet_address,
    issuer: item.issuer,
    uri: item.uri,
    latitude: typeof lat === 'number' && Number.isFinite(lat) ? lat : 0,
    longitude: typeof lng === 'number' && Number.isFinite(lng) ? lng : 0,
    image_url: item.image_url ?? null,
    title: item.title ?? null,
    collection_name: item.collection_name ?? null,
    socials: item.socials ?? null,
    pin_note: item.pin_note ?? null,
    pinned_at: item.pinned_at,
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const items = await listGlobePins();
    res.status(200).json({ success: true, pins: items.map(toGlobePin) });
  } catch (error) {
    const message = formatUnknownError(error);
    console.error('Error loading Xglobe Xpins:', message, error);
    res.status(500).json({ error: 'Internal server error', details: message });
  }
}
