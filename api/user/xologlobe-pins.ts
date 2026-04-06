import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAppMysqlPool } from '../../server/lib/mysqlPool.js';
import { listGlobePins, type PinnedNftItem } from '../../server/lib/userPinsRepo.js';

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
  socials?: XoloGlobePinSocials | null;
  pin_note?: string | null;
  website_url?: string | null;
  pinned_at: string;
}

interface XoloGlobePinSocials {
  twitter?: string;
  discord?: string;
  tiktok?: string;
  instagram?: string;
  telegram?: string;
  linkedin?: string;
}

function toGlobePin(item: PinnedNftItem): XoloGlobePin {
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
    website_url: item.website_url ?? null,
    pinned_at: item.pinned_at,
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const pool = getAppMysqlPool();
    const items = await listGlobePins(pool);
    const pins = items.map(toGlobePin);

    res.status(200).json({
      success: true,
      pins,
    });
    return;
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('Error loading Xglobe pins:', err);
    res
      .status(500)
      .json({ error: 'Internal server error', details: err.message });
    return;
  }
}
