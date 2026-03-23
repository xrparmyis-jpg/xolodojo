/**
 * Resolve XRPL classic address from Joey Wallet hook state (account string or WC-style session).
 */
export function extractJoeyWalletAddress(
	joeyAccount: string | null | undefined,
	joeySession: unknown
): string | null {
	if (typeof joeyAccount === 'string' && joeyAccount.trim().length > 0) {
		return joeyAccount.trim();
	}
	if (joeySession && typeof joeySession === 'object') {
		const sessionAny = joeySession as { namespaces?: Record<string, { accounts?: string[] }> };
		const namespaces = sessionAny.namespaces;
		if (!namespaces) return null;
		for (const nsKey of Object.keys(namespaces)) {
			const ns = namespaces[nsKey];
			if (Array.isArray(ns.accounts) && ns.accounts.length > 0) {
				const accountString = ns.accounts[0];
				const parts = accountString.split(':');
				return parts[parts.length - 1] ?? null;
			}
		}
	}
	return null;
}
