/**
 * XRPL NFTokenIDs are 256-bit hex; rippled may return mixed case. Use one canonical form for keys and comparisons.
 */
export function normalizeNfTokenId(tokenId: string): string {
	return tokenId.trim().replace(/\s+/g, '').toUpperCase();
}
