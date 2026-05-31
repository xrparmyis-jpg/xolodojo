import { getServiceRoleClient } from './supabaseAdmin.js';
import { throwIfSupabaseError } from './supabaseErrors.js';
import { normalizeNfTokenId } from '../../src/utils/nfTokenId.js';

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

export function normalizeWalletAddress(value: string): string {
  return value.trim().toLowerCase();
}

function toFiniteNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function parseSocialsFromDb(value: unknown): PinnedNftSocials | null {
  if (value == null) return null;
  let obj: unknown = value;
  if (typeof value === 'string') {
    try {
      obj = JSON.parse(value) as unknown;
    } catch {
      return null;
    }
  }
  if (!obj || typeof obj !== 'object') return null;
  const source = obj as Record<string, unknown>;
  const allowed = [
    'twitter',
    'discord',
    'tiktok',
    'instagram',
    'telegram',
    'linkedin',
  ] as const;
  const socials = allowed.reduce<PinnedNftSocials>((acc, key) => {
    const v = source[key];
    if (typeof v !== 'string') return acc;
    const t = v.trim().replace(/^@+/, '');
    if (!t) return acc;
    acc[key] = t;
    return acc;
  }, {});
  return Object.keys(socials).length > 0 ? socials : null;
}

function pinnedAtToIso(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string' && value.length > 0) {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
    return value;
  }
  return new Date().toISOString();
}

function mapRow(row: Record<string, unknown>): PinnedNftItem {
  const lat = toFiniteNumber(row.latitude);
  const lng = toFiniteNumber(row.longitude);
  const rawTokenId = typeof row.token_id === 'string' ? row.token_id : '';
  return {
    token_id: rawTokenId ? normalizeNfTokenId(rawTokenId) : '',
    wallet_address:
      typeof row.wallet_address === 'string'
        ? normalizeWalletAddress(row.wallet_address)
        : '',
    issuer: typeof row.issuer === 'string' ? row.issuer : null,
    uri: typeof row.uri === 'string' ? row.uri : null,
    latitude: lat,
    longitude: lng,
    image_url: typeof row.image_url === 'string' ? row.image_url : null,
    title: typeof row.title === 'string' ? row.title : null,
    collection_name: typeof row.collection_name === 'string' ? row.collection_name : null,
    socials: parseSocialsFromDb(row.socials),
    pin_note: typeof row.pin_note === 'string' ? row.pin_note : null,
    pinned_at: pinnedAtToIso(row.pinned_at),
  };
}

const PIN_SELECT =
  'token_id, wallet_address, issuer, uri, latitude, longitude, image_url, title, collection_name, socials, pin_note, pinned_at';

export async function listPinsForUser(
  userId: string,
  walletAddress?: string
): Promise<PinnedNftItem[]> {
  const supabase = getServiceRoleClient();
  let query = supabase
    .from('user_pins')
    .select(PIN_SELECT)
    .eq('user_id', userId)
    .order('pinned_at', { ascending: false });
  if (walletAddress) {
    query = query.eq('wallet_address', normalizeWalletAddress(walletAddress));
  }
  const { data, error } = await query;
  if (error) throwIfSupabaseError(error);
  return (data ?? []).map((row) => mapRow(row as Record<string, unknown>));
}

export async function listPinsForWalletOwner(walletAddress: string): Promise<PinnedNftItem[]> {
  const supabase = getServiceRoleClient();
  const wa = normalizeWalletAddress(walletAddress);
  const { data, error } = await supabase
    .from('user_pins')
    .select(PIN_SELECT)
    .is('user_id', null)
    .eq('wallet_address', wa)
    .order('pinned_at', { ascending: false });
  if (error) throwIfSupabaseError(error);
  return (data ?? []).map((row) => mapRow(row as Record<string, unknown>));
}

export async function listPinsForWalletAddress(walletAddress: string): Promise<PinnedNftItem[]> {
  const supabase = getServiceRoleClient();
  const wa = normalizeWalletAddress(walletAddress);
  const { data, error } = await supabase
    .from('user_pins')
    .select(PIN_SELECT)
    .eq('wallet_address', wa)
    .order('pinned_at', { ascending: false });
  if (error) throwIfSupabaseError(error);
  return (data ?? []).map((row) => mapRow(row as Record<string, unknown>));
}

export async function upsertUserPin(params: {
  userId: string | null;
  tokenId: string;
  walletAddress: string;
  issuer: string | null;
  uri: string | null;
  latitude: number;
  longitude: number;
  imageUrl: string | null;
  title: string | null;
  collectionName: string | null;
  socials: PinnedNftSocials | null;
  pinNote: string | null;
  pinnedAtIsoForInsert: string;
}): Promise<void> {
  const supabase = getServiceRoleClient();
  const wa = normalizeWalletAddress(params.walletAddress);
  const tokenId = normalizeNfTokenId(params.tokenId);
  const pinnedAt = params.pinnedAtIsoForInsert || new Date().toISOString();

  const { data: existing } = await supabase
    .from('user_pins')
    .select('id, user_id, pinned_at')
    .eq('wallet_address', wa)
    .eq('token_id', tokenId)
    .maybeSingle();

  const row = {
    user_id:
      existing?.user_id == null
        ? params.userId
        : params.userId ?? existing.user_id,
    token_id: tokenId,
    wallet_address: wa,
    issuer: params.issuer,
    uri: params.uri,
    latitude: params.latitude,
    longitude: params.longitude,
    image_url: params.imageUrl,
    title: params.title,
    collection_name: params.collectionName,
    socials: params.socials,
    pin_note: params.pinNote,
    pinned_at: existing?.pinned_at ?? pinnedAt,
  };

  const { error } = await supabase.from('user_pins').upsert(row, {
    onConflict: 'wallet_address,token_id',
  });
  if (error) throwIfSupabaseError(error);
}

export async function deleteUserPin(
  userId: string | null,
  tokenId: string,
  walletAddress: string
): Promise<void> {
  const supabase = getServiceRoleClient();
  const wa = normalizeWalletAddress(walletAddress);
  const tid = normalizeNfTokenId(tokenId);
  if (userId == null) {
    const { error } = await supabase
      .from('user_pins')
      .delete()
      .eq('token_id', tid)
      .eq('wallet_address', wa);
    if (error) throwIfSupabaseError(error);
    return;
  }
  const { error } = await supabase
    .from('user_pins')
    .delete()
    .eq('user_id', userId)
    .eq('token_id', tid)
    .eq('wallet_address', wa);
  if (error) throwIfSupabaseError(error);
}

export async function deletePinByWalletAndToken(
  tokenId: string,
  walletAddress: string
): Promise<number> {
  const supabase = getServiceRoleClient();
  const wa = normalizeWalletAddress(walletAddress);
  const tid = normalizeNfTokenId(tokenId);
  const { data, error } = await supabase
    .from('user_pins')
    .delete()
    .eq('token_id', tid)
    .eq('wallet_address', wa)
    .select('id');
  if (error) throwIfSupabaseError(error);
  return data?.length ?? 0;
}

export async function deletePinsForUserWallet(
  userId: string,
  walletAddress: string
): Promise<void> {
  const supabase = getServiceRoleClient();
  const { error } = await supabase
    .from('user_pins')
    .delete()
    .eq('user_id', userId)
    .eq('wallet_address', normalizeWalletAddress(walletAddress));
  if (error) throwIfSupabaseError(error);
}

export async function deletePinsForWalletNotHeld(
  walletAddress: string,
  heldNfTokenIds: Set<string>,
  ledgerNftCount: number
): Promise<number> {
  const supabase = getServiceRoleClient();
  const wa = normalizeWalletAddress(walletAddress);

  if (heldNfTokenIds.size === 0) {
    if (ledgerNftCount !== 0) return 0;
    const { data, error } = await supabase
      .from('user_pins')
      .delete()
      .eq('wallet_address', wa)
      .select('id');
    if (error) throwIfSupabaseError(error);
    return data?.length ?? 0;
  }

  const { data: rows, error: fetchError } = await supabase
    .from('user_pins')
    .select('id, token_id')
    .eq('wallet_address', wa);
  if (fetchError) throwIfSupabaseError(fetchError);

  const held = new Set([...heldNfTokenIds].map((id) => normalizeNfTokenId(id)));
  const toDelete = (rows ?? [])
    .filter((row) => {
      const tid =
        typeof row.token_id === 'string' ? normalizeNfTokenId(row.token_id) : '';
      return tid && !held.has(tid);
    })
    .map((row) => row.id);

  if (toDelete.length === 0) return 0;

  const { data, error } = await supabase
    .from('user_pins')
    .delete()
    .in('id', toDelete)
    .select('id');
  if (error) throwIfSupabaseError(error);
  return data?.length ?? 0;
}

function toUniquePins(items: PinnedNftItem[]): PinnedNftItem[] {
  const seen = new Set<string>();
  const unique: PinnedNftItem[] = [];
  for (const item of items) {
    const key = `${item.wallet_address}:${item.token_id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(item);
  }
  return unique;
}

export async function listGlobePins(): Promise<PinnedNftItem[]> {
  const supabase = getServiceRoleClient();
  const { data, error } = await supabase
    .from('user_pins')
    .select(PIN_SELECT)
    .order('pinned_at', { ascending: false });
  if (error) throwIfSupabaseError(error);

  const mapped = (data ?? [])
    .map((row) => mapRow(row as Record<string, unknown>))
    .filter(
      (item) =>
        item.token_id.length > 0 &&
        item.wallet_address.length > 0 &&
        toFiniteNumber(item.latitude) != null &&
        toFiniteNumber(item.longitude) != null
    );

  return toUniquePins(mapped).sort(
    (a, b) => new Date(b.pinned_at).getTime() - new Date(a.pinned_at).getTime()
  );
}

export async function getGlobePinByTokenId(tokenId: string): Promise<PinnedNftItem | null> {
  const supabase = getServiceRoleClient();
  const tid = normalizeNfTokenId(tokenId);
  if (!tid) return null;

  const { data, error } = await supabase
    .from('user_pins')
    .select(PIN_SELECT)
    .eq('token_id', tid)
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return mapRow(data as Record<string, unknown>);
}

export async function getGlobePinByQueryParam(rawPin: string): Promise<PinnedNftItem | null> {
  const trimmed = typeof rawPin === 'string' ? rawPin.trim() : '';
  if (!trimmed) return null;

  let decoded = trimmed;
  try {
    decoded = decodeURIComponent(trimmed.replace(/\+/g, ' '));
  } catch {
    decoded = trimmed;
  }

  const asToken = normalizeNfTokenId(decoded);
  if (/^[0-9A-F]{64}$/.test(asToken)) {
    return getGlobePinByTokenId(asToken);
  }

  const supabase = getServiceRoleClient();
  const { data, error } = await supabase
    .from('user_pins')
    .select(PIN_SELECT)
    .not('title', 'is', null)
    .ilike('title', decoded.trim())
    .order('pinned_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return mapRow(data as Record<string, unknown>);
}
