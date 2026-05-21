/**
 * Xumm / Xaman OAuth2 PKCE may use `code` + `state` (and related params). Helpers here
 * detect Xaman returns so we do not confuse them with other flows.
 */

import { isXamanDesktopHandoffSearch } from './xamanConnectIntent';

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
 * After Xaman redirect back to our app (`/profile` for logged-in wallet rows, `/` for
 * wallet-only sign-in). Resume `xamanHandler.connect` so grants finish in the browser.
 *
 * Desktop QR handoffs use `xaman_flow=desktop` on `/` — do not resume there (PC tab polls).
 */
export function shouldResumeXamanPkceConnect(pathname: string, search: string): boolean {
	if (isXamanDesktopHandoffSearch(search)) return false;

	const path = pathname.toLowerCase();
	const onProfile = path.includes('profile');
	const onHome = path === '/' || path === '';
	if (!onProfile && !onHome) return false;

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
