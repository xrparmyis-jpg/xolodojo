/**
 * Browser-only diagnostics for wallet / NFT listing issues.
 *
 * Debug logging is **opt-in** (keeps the console clean for normal testing):
 * - `localStorage.setItem('donovanDebugWallet', '1')` then reload
 * - `VITE_DEBUG_WALLET=true` in .env.local
 */
export function isWalletDebugEnabled(): boolean {
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
 * High-signal wallet diagnostics — only when debug is enabled (see isWalletDebugEnabled).
 */
export function walletTraceLog(event: string, payload?: Record<string, unknown>): void {
	if (!isWalletDebugEnabled()) {
		return;
	}
	// eslint-disable-next-line no-console
	console.log(`[Donovan:Wallet] ${event}`, payload ?? {});
}

export function walletAddressPreview(address: string | null | undefined): string {
	if (address == null || typeof address !== 'string') {
		return '(no address)';
	}
	const t = address.trim();
	if (t.length === 0) {
		return '(empty)';
	}
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
