import {
	decodeAccountID,
	encodeAccountID,
	isValidXAddress,
	xAddressToClassicAddress,
} from 'ripple-address-codec';

const XRPL_CLASSIC_RE = /^r[1-9A-HJ-NP-Za-km-z]{24,34}$/;

export function stripInvisible(s: string): string {
	return s.replace(/[\u200B-\u200D\uFEFF]/g, '').trim();
}

/**
 * Returns a checksummed classic address suitable for rippled `account` fields,
 * or null if the string cannot be decoded (wrong checksum / garbage).
 */
export function resolveCanonicalClassicAddress(input: string): string | null {
	const s = stripInvisible(input);
	if (!s) {
		return null;
	}
	if (isValidXAddress(s)) {
		return xAddressToClassicAddress(s).classicAddress;
	}
	if (!XRPL_CLASSIC_RE.test(s)) {
		return null;
	}
	try {
		return encodeAccountID(decodeAccountID(s));
	} catch {
		return null;
	}
}

/**
 * True if the value decodes to a valid ledger account (classic or X-address).
 */
export function isResolvableLedgerAccount(input: string): boolean {
	return resolveCanonicalClassicAddress(input) !== null;
}
