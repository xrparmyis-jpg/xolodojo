/**
 * Browser-only diagnostics for wallet / NFT listing issues.
 *
 * **`walletTraceLog`** always prints to the console (connection + NFT API path) — use DevTools → Console, filter `[Donovan:Wallet]`.
 *
 * Extra detail via **`walletDebugLog`** when any of:
 * - `import.meta.env.DEV` (local `npm run dev`)
 * - `localStorage.setItem('donovanDebugWallet', '1')` then reload
 * - `VITE_DEBUG_WALLET=true` in .env
 */
export function isWalletDebugEnabled(): boolean {
	if (import.meta.env.DEV) {
		return true;
	}
	if (import.meta.env.VITE_DEBUG_WALLET === 'true') {
		return true;
	}
	try {
		return typeof localStorage !== 'undefined' && localStorage.getItem('donovanDebugWallet') === '1';
	} catch {
		return false;
	}
}

/**
 * Always logged — high-signal lines for “connected as what?” and “NFT summary fetch result”.
 * Does not depend on localStorage (so production screenshares still see it).
 */
export function walletTraceLog(event: string, payload?: Record<string, unknown>): void {
	// console.log so it shows even when the console is filtered to hide "Info" level
	// eslint-disable-next-line no-console
	console.log(`[Donovan:Wallet] ${event}`, payload ?? {});
}

export function walletAddressPreview(address: string): string {
	const t = address.trim();
	if (t.length <= 14) {
		return t;
	}
	return `${t.slice(0, 8)}…${t.slice(-8)} (${t.length} chars)`;
}

export function walletDebugLog(event: string, payload?: Record<string, unknown>): void {
	if (!isWalletDebugEnabled()) {
		return;
	}
	// eslint-disable-next-line no-console
	console.info(`[Donovan:Wallet] ${event}`, payload ?? {});
}
