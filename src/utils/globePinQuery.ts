import { normalizeNfTokenId } from './nfTokenId';

/**
 * Value for `?pin=` on /xglobe and /profile: prefer the NFT display title so URLs stay readable
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
 * Resolves `?pin=` to a canonical NFToken id using the current pin list.
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
