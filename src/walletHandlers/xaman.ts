
import { XummPkce } from 'xumm-oauth2-pkce';
import type { IWalletHandler } from './IWalletHandler';
import { stripXamanReturnQueryParam } from '../utils/xamanOAuthLanding';
import { isLikelyXummPkceOAuthReturn } from '../utils/oauthCallbackGuards';
import { getUserWallets, type Wallet } from '../services/walletService';

const xamanApiKey =
	import.meta.env.VITE_XAMAN_API_KEY || import.meta.env.VITE_XUMM_API_KEY || '';
const configuredRedirectUrl = import.meta.env.VITE_XAMAN_REDIRECT_URL || '';
const rememberXamanJwt = import.meta.env.VITE_XAMAN_REMEMBER_JWT !== 'false';
let xamanPkce: XummPkce | null = null;

function isXamanConfigured() {
	return Boolean(xamanApiKey);
}

function getXamanRedirectUrl() {
	if (typeof window === 'undefined') {
		return configuredRedirectUrl;
	}
	if (configuredRedirectUrl) {
		return configuredRedirectUrl;
	}
	return `${window.location.origin}/`;
}

export function getXamanClient() {
	if (!xamanApiKey) {
		throw new Error(
			'Xaman is not configured. Set VITE_XAMAN_API_KEY and restart the app.'
		);
	}
	if (typeof window === 'undefined') {
		throw new Error('Xaman can only be used in a browser environment.');
	}
	if (!xamanPkce) {
		xamanPkce = new XummPkce(xamanApiKey, {
			redirectUrl: getXamanRedirectUrl(),
			implicit: true,
			rememberJwt: rememberXamanJwt,
		});
	}
	return xamanPkce;
}

/**
 * Call once after prepareXamanOAuthLanding() if the URL still has OAuth params.
 * Starts the Xumm singleton immediately so the PKCE thread reads `location.search`
 * before React runs (defensive; App.tsx no longer strips Xaman params on /profile).
 */
export function primeXamanPkceIfOAuthLanding(): void {
	if (typeof window === 'undefined' || !xamanApiKey) return;
	try {
		if (!isLikelyXummPkceOAuthReturn(window.location.search)) return;
		getXamanClient();
		// eslint-disable-next-line no-console
		console.log('[Xaman][prime] XummPkce constructed at startup (OAuth params present)');
	} catch {
		// ignore
	}
}

function shouldUseRedirectResumePolling() {
	if (typeof window === 'undefined') return false;
	try {
		const url = new URL(window.location.href);
		const flag = url.searchParams.get('xaman_return');
		return flag === '1';
	} catch {
		return false;
	}
}

/** Safe console logging: redacts jwt/token-like fields (full flow may contain secrets). */
function redactForLog(value: unknown, depth = 0): unknown {
	if (depth > 6) return '[max depth]';
	if (value === null || value === undefined) return value;
	if (typeof value !== 'object') return value;
	if (Array.isArray(value)) {
		return value.slice(0, 20).map((item) => redactForLog(item, depth + 1));
	}
	const out: Record<string, unknown> = {};
	for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
		const lower = k.toLowerCase();
		if (
			lower.includes('jwt') ||
			lower.includes('token') ||
			lower === 'authorization' ||
			lower === 'access_token' ||
			lower === 'refresh_token'
		) {
			out[k] =
				typeof v === 'string' ? `[redacted string len=${v.length}]` : '[redacted]';
		} else {
			out[k] = redactForLog(v, depth + 1);
		}
	}
	return out;
}

/** XRPL classic addresses are case-sensitive for checksums but APIs often compare normalized. */
function normalizeXrplAddress(addr: string): string {
	return addr.trim().toLowerCase();
}

/** Same filter as WalletConnection.loadWallets — keep list consistent for matching. */
function filterValidWallets(list: Wallet[]): Wallet[] {
	return list.filter(
		(w) =>
			w.wallet_address &&
			typeof w.wallet_address === 'string' &&
			w.wallet_address.trim().length > 0 &&
			w.wallet_type &&
			typeof w.wallet_type === 'string' &&
			w.wallet_type.trim().length > 0
	);
}

function summarizeXamanState(flow: unknown): Record<string, unknown> {
	const base: Record<string, unknown> = {
		type: typeof flow,
		isNull: flow == null,
	};
	if (!flow || typeof flow !== 'object') {
		return base;
	}
	const f = flow as Record<string, unknown>;
	const me = f.me as Record<string, unknown> | undefined;
	base.topLevelKeys = Object.keys(f);
	base.hasMe = Boolean(me);
	if (me && typeof me === 'object') {
		base.meKeys = Object.keys(me);
		base.meAccount = me.account;
		base.meSub = me.sub;
	}
	return base;
}

function toReadableErrorMessage(error: unknown): string {
	if (error instanceof Error && error.message) {
		return error.message;
	}

	if (typeof error === 'string' && error.trim()) {
		return error;
	}

	if (error && typeof error === 'object') {
		const anyError = error as Record<string, unknown>;
		const candidates = [
			anyError.message,
			anyError.error,
			anyError.reason,
			anyError.description,
		];
		for (const candidate of candidates) {
			if (typeof candidate === 'string' && candidate.trim()) {
				return candidate;
			}
		}
		try {
			return JSON.stringify(anyError);
		} catch {
			// ignore JSON stringify errors
		}
	}

	return 'Unknown error';
}



export const xamanHandler: IWalletHandler = {
	async connect({
		auth0Id,
		accessToken,
		wallets,
		setIsLoading,
		setShowToast,
		loadWallets,
		applyConnectedWalletFromApi,
		walletIdToConnect,
		repairWalletAddressIfNeeded,
		tryDisconnectCurrentWallet,
		connectWallet,
		addWallet,
		/** Set true when Profile resumed connect after stripping ?xaman_return=1 from URL */
		resumeFromRedirect,
		// showToast,
		// setWallets,
		// onWalletsUpdated,
		// getUserWallets,
		// connectedWallet,
	}) {
		try {
			setIsLoading?.(true);
			if (!isXamanConfigured()) {
				setShowToast?.('error', 'Xaman is not configured. Set VITE_XAMAN_API_KEY and restart the app.');
				return;
			}
			const client = getXamanClient();
			client.on('retrieved', () => {
				// eslint-disable-next-line no-console
				console.log('[Xaman][SDK] event: retrieved (mobile redirect / session restore)');
			});
			client.on('error', (err: unknown) => {
				// eslint-disable-next-line no-console
				console.error('[Xaman][SDK] event: error', err);
			});
			client.on('success', () => {
				// eslint-disable-next-line no-console
				console.log('[Xaman][SDK] event: success');
			});

			const urlStillHasReturnFlag = shouldUseRedirectResumePolling();
			// URL flag is often stripped in Profile before connect runs — use resumeFromRedirect from WalletConnection too
			const usePolling = urlStillHasReturnFlag || resumeFromRedirect === true;

			// eslint-disable-next-line no-console
			console.log('[Xaman][connect] start', {
				href: typeof window !== 'undefined' ? window.location.href : 'n/a',
				redirectUrl: getXamanRedirectUrl(),
				rememberJwt: rememberXamanJwt,
				urlStillHasReturnFlag,
				resumeFromRedirect: resumeFromRedirect === true,
				usePolling,
				walletIdToConnect: walletIdToConnect ?? null,
			});

			// After OAuth redirect, React state can still list a wallet row we just deleted — match against API instead.
			let walletsForMatch: Wallet[] = Array.isArray(wallets) ? filterValidWallets(wallets as Wallet[]) : [];
			// SDK runs authorize() internally on mobile OAuth return; calling authorize() again races and can clear the grant.
			const oauthReturnRecover = resumeFromRedirect === true || urlStillHasReturnFlag;

			if (oauthReturnRecover && auth0Id && accessToken) {
				try {
					const fresh = await getUserWallets(auth0Id, accessToken);
					if (fresh.success && Array.isArray(fresh.wallets)) {
						walletsForMatch = filterValidWallets(fresh.wallets);
					}
				} catch (e) {
					// eslint-disable-next-line no-console
					console.warn('[Xaman][connect] Could not refresh wallets before match; using props', e);
				}
			}
			const pollAttempts = usePolling ? (oauthReturnRecover ? 50 : 10) : 0;

			// Try to read existing PKCE state (important for mobile redirects)
			let flow = await client.state();
			let resolvedXrplAddress = flow?.me?.account as string | undefined;

			// eslint-disable-next-line no-console
			console.log('[Xaman][connect] initial state()', summarizeXamanState(flow), 'redacted:', redactForLog(flow));

			// On mobile redirect we need a longer window for the ctor's async grant exchange + state() promise.
			if (pollAttempts > 0 && !resolvedXrplAddress) {
				for (let attempt = 0; attempt < pollAttempts && !resolvedXrplAddress; attempt += 1) {
					// eslint-disable-next-line no-console
					console.log(
						'[Xaman][connect] Polling state after redirect, attempt',
						attempt + 1,
						'/',
						pollAttempts
					);
					await new Promise((resolve) => setTimeout(resolve, 300));
					flow = await client.state();
					resolvedXrplAddress = flow?.me?.account as string | undefined;
					// eslint-disable-next-line no-console
					console.log('[Xaman][connect] polled state()', summarizeXamanState(flow));
				}
			}

			// If still no active account: desktop / cold start needs our authorize(). OAuth return must NOT call authorize()
			// again — xumm-oauth2-pkce already handles the redirect grant in the thread ctor.
			if (!resolvedXrplAddress && oauthReturnRecover) {
				// eslint-disable-next-line no-console
				console.error('[Xaman][connect] No XRPL account after OAuth return polling (SDK grant still pending or failed)', {
					pollAttempts,
				});
				setShowToast?.(
					'error',
					'Could not finish Xaman sign-in. Please tap "Add wallet" again — if it keeps failing, refresh the page.'
				);
				return;
			}

			if (!resolvedXrplAddress) {
				// eslint-disable-next-line no-console
				console.warn('[Xaman][connect] No account from state(); calling authorize()', {
					usePolling,
					resumeFromRedirect,
				});
				try {
					flow = await client.authorize();
				} catch (authErr) {
					// eslint-disable-next-line no-console
					console.error('[Xaman][connect] authorize() threw', authErr);
					throw authErr;
				}
				resolvedXrplAddress = flow?.me?.account as string | undefined;
				// eslint-disable-next-line no-console
				console.log('[Xaman][connect] after authorize()', summarizeXamanState(flow));
			}
			if (!resolvedXrplAddress) {
				// eslint-disable-next-line no-console
				console.error('[Xaman][connect] Still no XRPL account after state/authorize', {
					summary: summarizeXamanState(flow),
				});
				setShowToast?.('error', 'No XRPL account returned from Xaman sign-in.');
				return;
			}

			// eslint-disable-next-line no-console
			console.log('[Xaman][connect] resolved XRPL address', resolvedXrplAddress);
			let currentConnectedWallet = walletsForMatch.find((wallet: Wallet) => wallet.is_connected);
			if (walletIdToConnect != null) {
				// eslint-disable-next-line no-console
				console.log('[Xaman][connect] branch: walletIdToConnect', walletIdToConnect);
				const targetWallet = walletsForMatch.find((wallet: Wallet) => wallet.id === walletIdToConnect);
				if (!targetWallet) {
					setShowToast?.('error', 'Wallet not found');
					return;
				}
				if (normalizeXrplAddress(targetWallet.wallet_address) !== normalizeXrplAddress(resolvedXrplAddress)) {
					setShowToast?.('error', 'Scanned Xaman account does not match the selected wallet address.');
					return;
				}
				const repairedWallet = await repairWalletAddressIfNeeded(targetWallet, resolvedXrplAddress);
				if (currentConnectedWallet && currentConnectedWallet.id !== repairedWallet.id) {
					await tryDisconnectCurrentWallet(currentConnectedWallet);
				}
				const connectResPick = await connectWallet(auth0Id, repairedWallet.id, accessToken);
				if (connectResPick.wallet) {
					applyConnectedWalletFromApi?.(connectResPick.wallet);
				}
				await loadWallets({ silent: true });
				setShowToast?.('success', 'Xaman wallet connected');
				return;
			}
			const existingWallet = walletsForMatch.find(
				(wallet: Wallet) =>
					normalizeXrplAddress(wallet.wallet_address) === normalizeXrplAddress(resolvedXrplAddress)
			);
			if (existingWallet) {
				// eslint-disable-next-line no-console
				console.log('[Xaman][connect] branch: existing wallet', existingWallet.id, existingWallet.wallet_address);
				const repairedWallet = await repairWalletAddressIfNeeded(existingWallet, resolvedXrplAddress);
				if (currentConnectedWallet && currentConnectedWallet.id !== repairedWallet.id) {
					await tryDisconnectCurrentWallet(currentConnectedWallet);
				}
				const connectResExisting = await connectWallet(auth0Id, repairedWallet.id, accessToken);
				if (connectResExisting.wallet) {
					applyConnectedWalletFromApi?.(connectResExisting.wallet);
				}
				await loadWallets({ silent: true });
				setShowToast?.('success', 'Xaman wallet connected');
				return;
			}
			// eslint-disable-next-line no-console
			console.log('[Xaman][connect] branch: addWallet new xaman', resolvedXrplAddress);
			const result = await addWallet(auth0Id, resolvedXrplAddress, 'xaman', undefined, accessToken);
			if (!result.success || !result.wallet) {
				const msg = result.message || 'Could not save Xaman wallet to your profile.';
				// eslint-disable-next-line no-console
				console.warn('[Xaman][connect] addWallet failed', result);
				setShowToast?.('error', msg);
				return;
			}
			if (currentConnectedWallet) {
				await tryDisconnectCurrentWallet(currentConnectedWallet);
			}
			const connectResNew = await connectWallet(auth0Id, result.wallet.id, accessToken);
			if (connectResNew.wallet) {
				applyConnectedWalletFromApi?.(connectResNew.wallet);
			}
			await loadWallets({ silent: true });
			setShowToast?.('success', 'Xaman wallet added and connected!');
		} catch (error) {
			const readableMessage = toReadableErrorMessage(error);
			console.error('[Xaman][connect] Failed:', error);
			setShowToast?.('error', `Failed to connect Xaman: ${readableMessage}`);
		} finally {
			stripXamanReturnQueryParam();
			setIsLoading?.(false);
		}
	},
	async disconnect({ setShowToast }) {
		if (!xamanPkce) return;
		try {
			xamanPkce.logout();
			setShowToast?.('success', 'Xaman wallet disconnected');
		} catch (error) {
			setShowToast?.('error', 'Failed to clear Xaman session');
		} finally {
			xamanPkce = null;
			// Library singleton lives on window; clear so next connect gets a fresh PKCE thread
			if (typeof window !== 'undefined') {
				delete (window as unknown as { _XummPkce?: unknown })._XummPkce;
			}
		}
	},
	async repair({ wallets, repairWalletAddressIfNeeded, loadWallets, setShowToast }) {
		// Example repair logic for Xaman wallet address casing
		const currentConnectedWallet = wallets.find((wallet: any) => wallet.is_connected && wallet.wallet_type === 'xaman');
		if (!currentConnectedWallet) return;
		if (currentConnectedWallet.wallet_address !== currentConnectedWallet.wallet_address.toLowerCase()) return;
		try {
			const client = getXamanClient();
			const flow = await client.state();
			const activeXamanAccount = flow?.me?.account;
			if (!activeXamanAccount) return;
			if (currentConnectedWallet.wallet_address !== activeXamanAccount) {
				await repairWalletAddressIfNeeded(currentConnectedWallet, activeXamanAccount);
				await loadWallets({ silent: true });
				setShowToast?.('success', 'Xaman wallet address repaired');
			}
		} catch (error) {
			setShowToast?.('error', 'Failed to repair Xaman wallet address');
		}
	},
	getLabel: async () => 'Xaman',
};
