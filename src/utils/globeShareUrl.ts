import { normalizeNfTokenId } from './nfTokenId';

/** Canonical client URL to open a pin on the Xglobe page (public share link). */
export function buildGlobePinShareUrl(tokenId: string): string {
  const pin = encodeURIComponent(normalizeNfTokenId(tokenId));
  if (typeof window === 'undefined' || !window.location?.origin) {
    return `/xglobe?pin=${pin}`;
  }
  return `${window.location.origin}/xglobe?pin=${pin}`;
}
