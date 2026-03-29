/**
 * Server-only XRPL address canonicalization (uses ripple-address-codec → Node polyfills).
 * Do not import this file from `src/` — Vite would bundle readable-stream/create-hash into the browser.
 */
import {
	decodeAccountID,
	encodeAccountID,
	isValidXAddress,
	xAddressToClassicAddress,
} from 'ripple-address-codec';

const XRPL_CLASSIC_RE = /^r[1-9A-HJ-NP-Za-km-z]{24,34}$/;

export function stripInvisible(s: string | null | undefined): string {
	if (s == null || typeof s !== 'string') {
		return '';
	}
	return s.replace(/[\u200B-\u200D\uFEFF]/g, '').trim();
}

export function resolveCanonicalClassicAddress(input: string | null | undefined): string | null {
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

export function isResolvableLedgerAccount(input: string | null | undefined): boolean {
	return resolveCanonicalClassicAddress(input) !== null;
}
