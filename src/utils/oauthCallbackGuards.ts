/**
 * Xumm / Xaman OAuth2 PKCE may use `code` + `state` (and related params). Helpers here
 * detect Xaman returns so we do not confuse them with other flows.
 */

export function isLikelyXummPkceOAuthReturn(search: string): boolean {
	const q = search.startsWith('?') ? search.slice(1) : search;
	const p = new URLSearchParams(q);
	const scope = p.get('scope') || '';
	return (
		p.get('xaman_return') === '1' ||
		scope.includes('XummPkce') ||
		p.has('access_token') ||
		p.has('authorization_code')
	);
}

/**
 * After Xaman mobile redirect back to our app (usually /profile). We must resume
 * `xamanHandler.connect` so new wallets are created in the DB when the user had none.
 *
 * PKCE returns standard `code` + `state` — we never append `xaman_return` from the SDK,
 * so detecting only `xaman_return=1` misses most real returns.
 */
export function shouldResumeXamanPkceConnect(pathname: string, search: string): boolean {
	const path = pathname.toLowerCase();
	if (!path.includes('profile')) return false;

	const q = search.startsWith('?') ? search.slice(1) : search;
	const p = new URLSearchParams(q);

	// OAuth error without a grant (user cancelled in wallet, etc.)
	if (p.get('error') && !p.has('code') && !p.has('access_token')) {
		return false;
	}

	if (p.get('xaman_return') === '1') return true;
	if (p.has('access_token')) return true;
	if (p.has('authorization_code')) return true;

	const scope = p.get('scope') || '';
	if (scope.includes('XummPkce')) return true;

	// Standard OAuth2 authorization code (Xumm PKCE uses `code` + `state`)
	if (p.has('code') && p.has('state')) return true;

	return false;
}
