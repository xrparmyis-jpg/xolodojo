
import { XummPkce } from 'xumm-oauth2-pkce';
import type { IWalletHandler } from './IWalletHandler';
import { stripXamanReturnQueryParam } from '../utils/xamanOAuthLanding';
import { isLikelyXummPkceOAuthReturn } from '../utils/oauthCallbackGuards';
import {
	ADDING_WALLET_AND_CONNECTING_MESSAGE,
	CONNECTING_YOUR_WALLET_MESSAGE,
	LOADING_WALLET_SUMMARY_MESSAGE,
	RECONNECTING_WALLET_MESSAGE,
	XAMAN_CONNECTING_MESSAGE,
} from '../constants/walletUiMessages';
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
 * Drop the in-memory Xumm PKCE client so the next connect gets a fresh authorize() flow.
 * Without this, a rejected / timed-out sign-in can leave the SDK stuck repeating the same error
 * without opening the QR / sign-in UI again.
 * Do NOT call when finishing an OAuth redirect (grant is still being exchanged).
 */
function resetXamanPkceSilently(): void {
	if (typeof window === 'undefined') {
		return;
	}
	try {
		xamanPkce?.logout();
	} catch {
		/* session may already be torn down */
	} finally {
		xamanPkce = null;
		delete (window as unknown as { _XummPkce?: unknown })._XummPkce;
	}
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
		wallets,
		setWalletBusyMessage,
		setShowToast,
		loadWallets,
		applyConnectedWalletFromApi,
		walletIdToConnect,
		repairWalletAddressIfNeeded,
		tryDisconnectCurrentWallet,
		connectWallet,
		addWallet,
		/** Wallet-only app sign-in: skip DB wallet rows */
		completeWalletAuth,
		/** Set true when Profile resumed connect after stripping ?xaman_return=1 from URL */
		resumeFromRedirect,
		// showToast,
		// setWallets,
		// onWalletsUpdated,
		// getUserWallets,
		// connectedWallet,
	}) {
		let connectSucceeded = false;
		try {
			setWalletBusyMessage?.(XAMAN_CONNECTING_MESSAGE);
			if (!isXamanConfigured()) {
				setShowToast?.('error', 'Xaman is not configured. Set VITE_XAMAN_API_KEY and restart the app.');
				return;
			}

			const urlStillHasReturnFlag = shouldUseRedirectResumePolling();
			const usePolling = urlStillHasReturnFlag || resumeFromRedirect === true;
			// After OAuth redirect, React state can still list a wallet row we just deleted — match against API instead.
			const oauthReturnRecover = resumeFromRedirect === true || urlStillHasReturnFlag;

			// Fresh PKCE client for normal "Add wallet" / connect — avoids stale "request rejected" from a prior attempt.
			if (!oauthReturnRecover) {
				resetXamanPkceSilently();
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

			// eslint-disable-next-line no-console
			console.log('[Xaman][connect] start', {
				href: typeof window !== 'undefined' ? window.location.href : 'n/a',
				redirectUrl: getXamanRedirectUrl(),
				rememberJwt: rememberXamanJwt,
				urlStillHasReturnFlag,
				resumeFromRedirect: resumeFromRedirect === true,
				usePolling,
				walletIdToConnect: walletIdToConnect ?? null,
				oauthReturnRecover,
				didResetPkceForFreshAuthorize: !oauthReturnRecover,
			});

			let walletsForMatch: Wallet[] = Array.isArray(wallets) ? filterValidWallets(wallets as Wallet[]) : [];

			if (oauthReturnRecover) {
				try {
					const fresh = await getUserWallets();
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

			if (typeof completeWalletAuth === 'function' && walletIdToConnect == null) {
				setWalletBusyMessage?.(LOADING_WALLET_SUMMARY_MESSAGE);
				try {
					const jwt = typeof flow?.jwt === 'string' ? flow.jwt.trim() : '';
					if (!jwt) {
						setShowToast?.('error', 'Could not verify Xaman session. Please try connecting again.');
						return;
					}
					await completeWalletAuth(resolvedXrplAddress, { jwt });
					connectSucceeded = true;
				} catch (e) {
					setShowToast?.(
						'error',
						e instanceof Error ? e.message : 'Wallet sign-in failed'
					);
				} finally {
					stripXamanReturnQueryParam();
					if (connectSucceeded) {
						setWalletBusyMessage?.(LOADING_WALLET_SUMMARY_MESSAGE);
					} else {
						setWalletBusyMessage?.(null);
					}
				}
				return;
			}

			let currentConnectedWallet = walletsForMatch.find((wallet: Wallet) => wallet.is_connected);

			// Phased copy: signing is done; now we persist / connect on the server (can take several seconds).
			const existingWallet = walletsForMatch.find(
				(wallet: Wallet) =>
					normalizeXrplAddress(wallet.wallet_address) === normalizeXrplAddress(resolvedXrplAddress)
			);
			if (walletIdToConnect != null) {
				setWalletBusyMessage?.(CONNECTING_YOUR_WALLET_MESSAGE);
			} else if (existingWallet) {
				setWalletBusyMessage?.(RECONNECTING_WALLET_MESSAGE);
			} else {
				setWalletBusyMessage?.(ADDING_WALLET_AND_CONNECTING_MESSAGE);
			}

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
				const connectResPick = await connectWallet(repairedWallet.id);
				if (connectResPick.wallet) {
					applyConnectedWalletFromApi?.(connectResPick.wallet);
				}
				await loadWallets({ silent: true });
				setShowToast?.('success', 'Xaman wallet connected');
				connectSucceeded = true;
				return;
			}
			if (existingWallet) {
				// eslint-disable-next-line no-console
				console.log('[Xaman][connect] branch: existing wallet', existingWallet.id, existingWallet.wallet_address);
				const repairedWallet = await repairWalletAddressIfNeeded(existingWallet, resolvedXrplAddress);
				if (currentConnectedWallet && currentConnectedWallet.id !== repairedWallet.id) {
					await tryDisconnectCurrentWallet(currentConnectedWallet);
				}
				const connectResExisting = await connectWallet(repairedWallet.id);
				if (connectResExisting.wallet) {
					applyConnectedWalletFromApi?.(connectResExisting.wallet);
				}
				await loadWallets({ silent: true });
				setShowToast?.('success', 'Xaman wallet connected');
				connectSucceeded = true;
				return;
			}
			// eslint-disable-next-line no-console
			console.log('[Xaman][connect] branch: addWallet new xaman', resolvedXrplAddress);
			const result = await addWallet(resolvedXrplAddress, 'xaman', undefined);
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
			const connectResNew = await connectWallet(result.wallet.id);
			if (connectResNew.wallet) {
				applyConnectedWalletFromApi?.(connectResNew.wallet);
			}
			await loadWallets({ silent: true });
			setShowToast?.(
				'success',
				result.already_exists && result.message ? result.message : 'Xaman wallet added and connected!'
			);
			connectSucceeded = true;
		} catch (error) {
			const readableMessage = toReadableErrorMessage(error);
			console.error('[Xaman][connect] Failed:', error);
			setShowToast?.('error', `Failed to connect Xaman: ${readableMessage}`);
		} finally {
			stripXamanReturnQueryParam();
			if (connectSucceeded) {
				// Stay covered until NFT summary fetch finishes (see WalletConnection.refreshConnectedWalletAssets).
				setWalletBusyMessage?.(LOADING_WALLET_SUMMARY_MESSAGE);
			} else {
				setWalletBusyMessage?.(null);
			}
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
