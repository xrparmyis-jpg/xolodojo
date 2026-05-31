/**
 * Xumm PKCE (`xumm-oauth2-pkce`) only inspects `document.location.search`, NOT the hash.
 * Implicit OAuth often returns tokens in the **hash** (`#access_token=...`), so the SDK
 * never sets `mobileRedirectFlow` and mobile redirect silently fails.
 *
 * We merge hash OAuth params into the query **once** at startup (before React / XummPkce).
 */
import { isWalletDebugEnabled } from './walletDebugLog';

const XUMM_PKCE_JWT_KEY = 'XummPkceJwt';

function shouldLogXamanLanding(): boolean {
	if (isWalletDebugEnabled()) {
		return true;
	}
	if (typeof window === 'undefined') {
		return false;
	}
	return isXummOauthCallbackUrl(window.location.href);
}

function parseHashParams(hash: string): URLSearchParams {
	if (!hash || hash === '#') return new URLSearchParams();
	const raw = hash.startsWith('#') ? hash.slice(1) : hash;
	return new URLSearchParams(raw);
}

/** True if this looks like an OAuth redirect we should handle (search and/or hash). */
export function isXummOauthCallbackUrl(href: string): boolean {
	try {
		const u = new URL(href);
		const q = u.searchParams;
		const h = parseHashParams(u.hash);
		const inSearch = ['access_token', 'authorization_code', 'code', 'error_description', 'error'].some(
			(k) => q.has(k)
		);
		const inHash = ['access_token', 'authorization_code', 'code', 'error_description', 'error'].some(
			(k) => h.has(k)
		);
		return inSearch || inHash;
	} catch {
		return false;
	}
}

/**
 * If OAuth data arrived in the fragment, copy into `search` so xumm-oauth2-pkce sees it.
 * Idempotent: only runs when hash contains OAuth-like params.
 */
export function normalizeXummOauthHashToSearchParams(): boolean {
	if (typeof window === 'undefined') return false;
	try {
		const url = new URL(window.location.href);
		const hashParams = parseHashParams(url.hash);
		if (hashParams.size === 0) return false;

		const hashLooksOAuth = ['access_token', 'authorization_code', 'code', 'error', 'error_description'].some(
			(k) => hashParams.has(k)
		);
		if (!hashLooksOAuth) return false;

		let merged = 0;
		hashParams.forEach((value, key) => {
			if (!url.searchParams.has(key)) {
				url.searchParams.set(key, value);
				merged += 1;
			}
		});

		url.hash = '';
		window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
		if (shouldLogXamanLanding()) {
			// eslint-disable-next-line no-console
			console.log('[Xaman][landing] Moved OAuth params from #hash into ?query for xumm-oauth2-pkce', {
				mergedKeys: merged,
			});
		}
		return true;
	} catch {
		return false;
	}
}

export function purgeStaleXummPkceJwtIfOauthCallback(): void {
	if (typeof window === 'undefined') return;
	if (!isXummOauthCallbackUrl(window.location.href)) return;
	try {
		window.localStorage.removeItem(XUMM_PKCE_JWT_KEY);
		if (shouldLogXamanLanding()) {
			// eslint-disable-next-line no-console
			console.log(
				'[Xaman][landing] OAuth callback URL — cleared stale',
				XUMM_PKCE_JWT_KEY,
				'(rememberJwt race guard)'
			);
		}
	} catch {
		// private mode / blocked storage
	}
}

/** One-line diagnostics so mobile debugging always shows *something* useful. */
export function logXamanLandingDiagnostics(phase: 'before-normalize' | 'after-prepare'): void {
	if (!shouldLogXamanLanding()) return;
	try {
		const url = new URL(window.location.href);
		const hp = parseHashParams(url.hash);
		// eslint-disable-next-line no-console
		console.log(`[Xaman][landing] ${phase}`, {
			path: url.pathname,
			xaman_return: url.searchParams.get('xaman_return'),
			searchHasAccessToken: url.searchParams.has('access_token'),
			searchHasAuthCode: url.searchParams.has('authorization_code') || url.searchParams.has('code'),
			hashLength: url.hash.length,
			hashHasAccessToken: hp.has('access_token'),
			hashHasAuthCode: hp.has('authorization_code') || hp.has('code'),
		});
	} catch {
		// ignore
	}
}

/** Call once at app entry: hash → query, purge stale JWT, log. */
export function prepareXamanOAuthLanding(): void {
	logXamanLandingDiagnostics('before-normalize');
	const normalized = normalizeXummOauthHashToSearchParams();
	if (normalized) {
		logXamanLandingDiagnostics('after-prepare');
	}
	purgeStaleXummPkceJwtIfOauthCallback();
}

/**
 * Phone opened the desktop QR redirect (`/?xaman_flow=desktop&…`). Strip OAuth params
 * without priming PKCE so the desktop tab keeps the grant.
 */
export function stripXamanDesktopHandoffParams(): void {
	if (typeof window === 'undefined') return;
	try {
		const u = new URL(window.location.href);
		if (u.searchParams.get('xaman_flow') !== 'desktop') return;
		const keys = [
			'xaman_flow',
			'xaman_return',
			'code',
			'state',
			'scope',
			'access_token',
			'authorization_code',
			'error',
			'error_description',
		];
		for (const key of keys) {
			u.searchParams.delete(key);
		}
		const next = `${u.pathname}${u.search}${u.hash}`;
		window.history.replaceState({}, '', next);
		if (shouldLogXamanLanding()) {
			// eslint-disable-next-line no-console
			console.log('[Xaman][landing] Stripped desktop handoff OAuth params from URL');
		}
	} catch {
		// ignore
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
		if (shouldLogXamanLanding()) {
			// eslint-disable-next-line no-console
			console.log('[Xaman][landing] Stripped xaman_return from URL');
		}
	} catch {
		// ignore
	}
}
