/**
 * Session flag: user started a Joey connect from our UI (survives mobile reload / deeplink return).
 * Cleared after persist succeeds, on error, or when explicitly disconnecting.
 */
export const JOEY_CONNECT_INTENT_KEY = 'joey_wallet_connect_intent_v1';

export function setJoeyConnectIntent(): void {
	try {
		sessionStorage.setItem(JOEY_CONNECT_INTENT_KEY, '1');
	} catch {
		// private mode / SSR
	}
}

export function clearJoeyConnectIntent(): void {
	try {
		sessionStorage.removeItem(JOEY_CONNECT_INTENT_KEY);
	} catch {
		// ignore
	}
}

export function hasJoeyConnectIntent(): boolean {
	try {
		return sessionStorage.getItem(JOEY_CONNECT_INTENT_KEY) === '1';
	} catch {
		return false;
	}
}
