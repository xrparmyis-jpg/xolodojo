/**
 * Auth0 (this app) uses `redirect_uri: window.location.origin` → callback on `/` only.
 * Xumm / Xaman OAuth2 PKCE uses the same `code` + `state` query keys as Auth0.
 * We must NOT strip the URL when the user is returning from Xaman, or the Xumm PKCE
 * library never sees the grant and the wallet never connects.
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

/** True only for Auth0 SPA callback at site root (matches Auth0 redirect_uri). */
export function isAuth0SpaCallbackUrl(pathname: string, search: string): boolean {
	const p = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
	const onRoot = pathname === '/' || pathname === '';
	const hasOAuthCodeOrState = p.has('code') || p.has('state');
	return onRoot && hasOAuthCodeOrState && !isLikelyXummPkceOAuthReturn(search);
}
