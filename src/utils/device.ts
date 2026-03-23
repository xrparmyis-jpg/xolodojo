/**
 * Rough mobile / touch-device detection for UX (deeplink vs QR, etc.).
 * Not for security — only for presentation.
 */
export function isMobileDevice(): boolean {
	if (typeof navigator === 'undefined') return false;
	const ua = navigator.userAgent || '';
	if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)) {
		return true;
	}
	if (typeof window !== 'undefined' && 'matchMedia' in window) {
		try {
			return window.matchMedia('(max-width: 768px)').matches && 'ontouchstart' in window;
		} catch {
			// ignore
		}
	}
	return false;
}
