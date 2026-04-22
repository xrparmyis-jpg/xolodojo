/** Canonical client URL to open a pin on the Xglobe page (public share link). */
export function buildGlobePinShareUrl(tokenId: string): string {
  if (typeof window === 'undefined' || !window.location?.origin) {
    return `/xglobe?pin=${encodeURIComponent(tokenId)}`;
  }
  return `${window.location.origin}/xglobe?pin=${encodeURIComponent(tokenId)}`;
}
