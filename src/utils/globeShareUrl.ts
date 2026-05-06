import {
  encodeGlobePinQueryValue,
  GLOBE_PIN_QUERY_PARAM,
} from './globePinQuery';

/** Canonical client URL to open a pin on the Xglobe page (public share link). */
export function buildGlobePinShareUrl(
  tokenId: string,
  pinTitle?: string | null
): string {
  const pin = encodeGlobePinQueryValue(tokenId, pinTitle);
  if (typeof window === 'undefined' || !window.location?.origin) {
    return `/xglobe?${GLOBE_PIN_QUERY_PARAM}=${pin}`;
  }
  return `${window.location.origin}/xglobe?${GLOBE_PIN_QUERY_PARAM}=${pin}`;
}

export {
  encodeGlobePinQueryValue,
  GLOBE_PIN_QUERY_PARAM,
} from './globePinQuery';
