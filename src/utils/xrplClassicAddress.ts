/**
 * Browser-safe XRPL address helpers — no ripple-address-codec (avoids Node `stream`/`create-hash` in Vite).
 * Checksum validation and canonical form are enforced on the API via `server/xrplClassicAddress.ts`.
 */

const XRPL_CLASSIC_RE = /^r[1-9A-HJ-NP-Za-km-z]{24,34}$/;

export function stripInvisible(s: string | null | undefined): string {
	if (s == null || typeof s !== 'string') {
		return '';
	}
	return s.replace(/[\u200B-\u200D\uFEFF]/g, '').trim();
}

/** Matches classic address shape only (does not verify checksum). */
export function isClassicAddressShape(t: string): boolean {
	return XRPL_CLASSIC_RE.test(stripInvisible(t));
}

/**
 * Heuristic score: prefer mixed-case base58 (valid XRPL checksum style); avoid all-lowercase blobs.
 */
function classicShapeScore(t: string): number {
	if (!XRPL_CLASSIC_RE.test(t)) {
		return -1;
	}
	const rest = t.slice(1);
	const upper = (rest.match(/[A-HJ-NP-Z]/g) || []).length;
	const lower = (rest.match(/[a-km-z]/g) || []).length;
	if (upper > 0 && lower > 0) {
		return 100 + upper + lower;
	}
	if (upper > 0) {
		return 50 + upper;
	}
	return lower;
}

export function pickBestClassicAddressCandidate(candidates: string[]): string | null {
	let best: string | null = null;
	let bestScore = -1;
	for (const c of candidates) {
		const t = stripInvisible(c);
		const sc = classicShapeScore(t);
		if (sc > bestScore) {
			bestScore = sc;
			best = t;
		}
	}
	return bestScore >= 0 ? best : null;
}
