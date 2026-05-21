/**
 * Tracks why a Xaman PKCE authorize() was started so OAuth return handling can
 * resume wallet-auth on `/`, profile wallet adds on `/profile`, and ignore
 * desktop QR handoffs opened on the user's phone (`xaman_flow=desktop`).
 */

export type XamanConnectIntent = 'desktop' | 'wallet_auth' | 'profile_wallets';

const STORAGE_KEY = 'xolo_xaman_connect_intent';

export function setXamanConnectIntent(intent: XamanConnectIntent): void {
	if (typeof window === 'undefined') return;
	try {
		sessionStorage.setItem(STORAGE_KEY, intent);
	} catch {
		/* private mode */
	}
}

export function getXamanConnectIntent(): XamanConnectIntent | null {
	if (typeof window === 'undefined') return null;
	try {
		const value = sessionStorage.getItem(STORAGE_KEY);
		if (value === 'desktop' || value === 'wallet_auth' || value === 'profile_wallets') {
			return value;
		}
	} catch {
		/* ignore */
	}
	return null;
}

export function clearXamanConnectIntent(): void {
	if (typeof window === 'undefined') return;
	try {
		sessionStorage.removeItem(STORAGE_KEY);
	} catch {
		/* ignore */
	}
}

/** True when the user is on a phone / tablet browser (not desktop QR initiator). */
export function isMobileConnectDevice(): boolean {
	if (typeof window === 'undefined') return false;
	const ua = navigator.userAgent;
	if (/Android|iPhone|iPad|iPod|Mobile|webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua)) {
		return true;
	}
	return window.matchMedia('(pointer: coarse)').matches && window.innerWidth < 1024;
}

export function resolveXamanConnectIntent(opts: {
	completeWalletAuth?: boolean;
}): XamanConnectIntent {
	if (opts.completeWalletAuth) return 'wallet_auth';
	if (isMobileConnectDevice()) return 'profile_wallets';
	return 'desktop';
}

export function isXamanDesktopHandoffSearch(search: string): boolean {
	const q = search.startsWith('?') ? search.slice(1) : search;
	return new URLSearchParams(q).get('xaman_flow') === 'desktop';
}
