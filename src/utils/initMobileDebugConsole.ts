/**
 * On-device console for phones when USB remote debugging won't connect.
 *
 * Enable:
 *   - Open: https://yoursite.com/profile?debugConsole=1
 *   - Stays on for the origin until cleared (localStorage).
 * Disable:
 *   - https://yoursite.com/?debugConsole=0
 *   - Or DevTools → Application → Local Storage → delete `vite_debug_console_enabled`
 */
const STORAGE_KEY = 'vite_debug_console_enabled';

export async function initMobileDebugConsole(): Promise<void> {
	if (typeof window === 'undefined') return;

	const params = new URLSearchParams(window.location.search);
	const flag = params.get('debugConsole');

	if (flag === '0') {
		localStorage.removeItem(STORAGE_KEY);
		return;
	}
	if (flag === '1') {
		localStorage.setItem(STORAGE_KEY, '1');
	}

	const enabled = flag === '1' || localStorage.getItem(STORAGE_KEY) === '1';
	if (!enabled) return;

	const mod = await import('vconsole');
	const VConsole = mod.default;
	// eslint-disable-next-line no-new
	new VConsole({
		theme: 'dark',
		defaultPlugins: ['system', 'network', 'element', 'storage'],
	});
	// eslint-disable-next-line no-console
	console.info(
		'[MobileDebug] VConsole active. Filter logs: [Xaman] | Disable: ?debugConsole=0'
	);
}
