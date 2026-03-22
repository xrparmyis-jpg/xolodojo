/**
 * Xumm PKCE (xumm-oauth2-pkce) reads OAuth callback params from `location.search`
 * in its constructor and exchanges them asynchronously. A **stale** `XummPkceJwt`
 * in localStorage can make the "remember JWT" branch race the mobile redirect flow.
 *
 * Call `purgeStaleXummPkceJwtIfOauthCallback()` once at app startup (before any
 * `new XummPkce`) when the URL looks like an OAuth redirect.
 */
const XUMM_PKCE_JWT_KEY = 'XummPkceJwt';

export function isXummOauthCallbackUrl(href: string): boolean {
	try {
		const u = new URL(href);
		const q = u.searchParams;
		return Boolean(
			q.get('access_token') ||
				q.get('authorization_code') ||
				q.get('code') ||
				q.get('error_description')
		);
	} catch {
		return false;
	}
}

export function purgeStaleXummPkceJwtIfOauthCallback(): void {
	if (typeof window === 'undefined') return;
	if (!isXummOauthCallbackUrl(window.location.href)) return;
	try {
		window.localStorage.removeItem(XUMM_PKCE_JWT_KEY);
		// eslint-disable-next-line no-console
		console.log(
			'[Xaman][landing] OAuth callback URL detected — cleared stale',
			XUMM_PKCE_JWT_KEY,
			'so mobile redirect is not raced by rememberJwt'
		);
	} catch {
		// private mode / blocked storage
	}
}

/** Remove only our `xaman_return` flag (SDK clears OAuth params separately). */
export function stripXamanReturnQueryParam(): void {
	if (typeof window === 'undefined') return;
	try {
		const u = new URL(window.location.href);
		if (!u.searchParams.has('xaman_return')) return;
		u.searchParams.delete('xaman_return');
		const next = `${u.pathname}${u.search}${u.hash}`;
		window.history.replaceState({}, '', next);
		// eslint-disable-next-line no-console
		console.log('[Xaman][landing] Stripped xaman_return from URL');
	} catch {
		// ignore
	}
}
