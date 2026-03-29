import { pickBestClassicAddressCandidate, stripInvisible } from '../../utils/xrplClassicAddress';

function pushCandidates(out: string[], raw: string): void {
	const t = stripInvisible(raw);
	if (!t) {
		return;
	}
	out.push(t);
	for (const seg of t.split(':')) {
		const s = stripInvisible(seg);
		if (s.length > 0) {
			out.push(s);
		}
	}
}

function collectJoeyAccountCandidates(
	joeyAccount: string | null | undefined,
	joeySession: unknown
): string[] {
	const out: string[] = [];
	if (typeof joeyAccount === 'string' && joeyAccount.trim().length > 0) {
		pushCandidates(out, joeyAccount);
	}
	if (joeySession && typeof joeySession === 'object') {
		const sessionAny = joeySession as { namespaces?: Record<string, { accounts?: string[] }> };
		const namespaces = sessionAny.namespaces;
		if (namespaces) {
			for (const nsKey of Object.keys(namespaces)) {
				const ns = namespaces[nsKey];
				if (!Array.isArray(ns.accounts)) {
					continue;
				}
				for (const accountString of ns.accounts) {
					if (typeof accountString === 'string' && accountString.length > 0) {
						pushCandidates(out, accountString);
					}
				}
			}
		}
	}
	return out;
}

/**
 * Resolve XRPL classic address from Joey Wallet hook state (account string or WC-style session).
 * Tries every WC account string and segment — the primary `account` field is sometimes lowercased
 * (invalid checksum) while another namespace entry has the correct casing.
 */
export function extractJoeyWalletAddress(
	joeyAccount: string | null | undefined,
	joeySession: unknown
): string | null {
	const candidates = collectJoeyAccountCandidates(joeyAccount, joeySession);
	const deduped = [...new Set(candidates)];
	return pickBestClassicAddressCandidate(deduped);
}
