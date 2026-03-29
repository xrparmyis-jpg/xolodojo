/**
 * Browser-only diagnostics for wallet / NFT listing issues.
 *
 * Enable without rebuilding:
 *   localStorage.setItem('donovanDebugWallet', '1'); location.reload()
 * Disable:
 *   localStorage.removeItem('donovanDebugWallet'); location.reload()
 *
 * Or set VITE_DEBUG_WALLET=true in .env (requires rebuild).
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
