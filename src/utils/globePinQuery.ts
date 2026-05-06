import { normalizeNfTokenId } from './nfTokenId';

/** Query key for deep-linking a globe pin (share, bookmarks, gallery). */
export const GLOBE_PIN_QUERY_PARAM = 'Xpin';

/** Legacy key; still read so old `?pin=` links work. */
export const GLOBE_PIN_QUERY_PARAM_LEGACY = 'pin';

export function readGlobePinQueryParam(
  searchParams: URLSearchParams
): string | null {
  const v =
    searchParams.get(GLOBE_PIN_QUERY_PARAM)?.trim() ||
    searchParams.get(GLOBE_PIN_QUERY_PARAM_LEGACY)?.trim();
  return v && v.length > 0 ? v : null;
}

export function stripGlobePinQueryParams(searchParams: URLSearchParams): void {
  searchParams.delete(GLOBE_PIN_QUERY_PARAM);
  searchParams.delete(GLOBE_PIN_QUERY_PARAM_LEGACY);
}

/** Path + query for opening a pin on Xglobe (`Xpin` is encoded). */
export function buildXglobePinPath(
  tokenId: string,
  title?: string | null
): string {
  return `/xglobe?${GLOBE_PIN_QUERY_PARAM}=${encodeGlobePinQueryValue(tokenId, title)}`;
}

/** Path + query for profile deep-link to an NFT card (same param as globe). */
export function buildProfilePinPath(
  tokenId: string,
  title?: string | null
): string {
  return `/profile?${GLOBE_PIN_QUERY_PARAM}=${encodeGlobePinQueryValue(tokenId, title)}`;
}

/**
 * Value for `?Xpin=` on /xglobe and /profile: prefer the NFT display title so URLs stay readable
 * (e.g. `NFTenders%232249`). Falls back to the canonical NFToken id when there is no title.
 */
export function encodeGlobePinQueryValue(
  tokenId: string,
  title?: string | null
): string {
  const t = typeof title === 'string' ? title.trim() : '';
  if (t.length > 0) {
    return encodeURIComponent(t);
  }
  return encodeURIComponent(normalizeNfTokenId(tokenId));
}

/**
 * Resolves `?Xpin=` (or legacy `?pin=`) to a canonical NFToken id using the current pin list.
 * Supports legacy links that used the raw 256-bit hex id, and title-based links.
 */
export function resolveGlobePinQueryToTokenId(
  rawParam: string | null | undefined,
  pins: ReadonlyArray<{ token_id: string; title?: string | null }>
): string | null {
  if (rawParam == null || !String(rawParam).trim()) {
    return null;
  }

  let decoded = String(rawParam).trim();
  try {
    decoded = decodeURIComponent(decoded.replace(/\+/g, ' '));
  } catch {
    decoded = String(rawParam).trim();
  }

  const asHex = normalizeNfTokenId(decoded);
  if (/^[0-9A-F]{64}$/.test(asHex)) {
    const hit = pins.find(
      (p) => normalizeNfTokenId(p.token_id) === asHex
    );
    return hit ? asHex : null;
  }

  const target = decoded.trim();
  if (!target) {
    return null;
  }

  const exact = pins.find((p) => (p.title?.trim() ?? '') === target);
  if (exact) {
    return normalizeNfTokenId(exact.token_id);
  }

  const lower = target.toLowerCase();
  const ci = pins.find(
    (p) => (p.title?.trim().toLowerCase() ?? '') === lower
  );
  return ci ? normalizeNfTokenId(ci.token_id) : null;
}
