import { encodeGlobePinQueryValue } from './globePinQuery';

/** Canonical client URL to open a pin on the Xglobe page (public share link). */
export function buildGlobePinShareUrl(
  tokenId: string,
  pinTitle?: string | null
): string {
  const pin = encodeGlobePinQueryValue(tokenId, pinTitle);
  if (typeof window === 'undefined' || !window.location?.origin) {
    return `/xglobe?pin=${pin}`;
  }
  return `${window.location.origin}/xglobe?pin=${pin}`;
}

export { encodeGlobePinQueryValue } from './globePinQuery';
