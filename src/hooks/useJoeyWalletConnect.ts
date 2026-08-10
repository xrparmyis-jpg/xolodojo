import { useState, useCallback, useEffect, useRef } from 'react';
import { standalone as joeyStandalone } from '@joey-wallet/wc-client/react';
import { isMobileDevice } from '../utils/device';
import { clearJoeyConnectIntent, setJoeyConnectIntent } from '../wallets/joey/joeyConnectIntent';
import { extractJoeyWalletAddress } from '../wallets/joey/extractJoeyWalletAddress';
import { walletAddressPreview, walletDebugLog, walletTraceLog } from '../utils/walletDebugLog';

const JOEY_PROVIDER_READY_TIMEOUT_MS = 20_000;
const JOEY_PROVIDER_POLL_MS = 100;

function isProviderNotReadyError(error: unknown): boolean {
	const message = error instanceof Error ? error.message : String(error);
	return /provider (is )?not initialized/i.test(message);
}

export function useJoeyWalletConnect({
	showToast,
	onConnectStart,
	onConnectError,
}: {
	showToast: (type: 'success' | 'error', message: string, durationMs?: number) => void;
	/** Fires at the very start of connect (set “waiting” overlay before generate/deeplink). */
	onConnectStart?: () => void;
	/** Fires if generate/deeplink setup fails (clear overlay). */
	onConnectError?: () => void;
}) {
	const joeyContext = joeyStandalone.provider.useProvider() as any;
	const joeyActions = joeyContext.actions;
	const joeyProvider = joeyContext.provider as unknown;
	const session = joeyContext.session as unknown;
	const account = joeyContext.account as string | null | undefined;
	const [isJoeyConnectPending, setIsJoeyConnectPending] = useState(false);
	const [showJoeyQrModal, setShowJoeyQrModal] = useState(false);
	const [joeyConnectUri, setJoeyConnectUri] = useState<string | null>(null);
	const [joeyDeepLink, setJoeyDeepLink] = useState<string | null>(null);
	const lastJoeyDebugKeyRef = useRef<string>('');
	const joeyActionsRef = useRef(joeyActions);
	const joeyProviderRef = useRef(joeyProvider);

	useEffect(() => {
		joeyActionsRef.current = joeyActions;
		joeyProviderRef.current = joeyProvider;
	}, [joeyActions, joeyProvider]);

	const waitForJoeyProvider = useCallback(async () => {
		const startedAt = Date.now();
		while (!joeyProviderRef.current || typeof joeyActionsRef.current?.generate !== 'function') {
			if (Date.now() - startedAt >= JOEY_PROVIDER_READY_TIMEOUT_MS) {
				throw new Error(
					'Joey Wallet provider failed to initialize. Confirm VITE_JOEY_PROJECT_ID / VITE_WALLETCONNECT_PROJECT_ID are set for Production and that xolodojo.io is allowed in the Reown/WalletConnect project.'
				);
			}
			await new Promise((resolve) => window.setTimeout(resolve, JOEY_PROVIDER_POLL_MS));
		}
	}, []);

	const disconnectFromProvider = useCallback(async () => {
		try {
			if (joeyActionsRef.current?.disconnect) {
				await joeyActionsRef.current.disconnect();
			}
		} catch (e) {
			console.warn('[JoeyWallet] Provider disconnect failed (continuing):', e);
		}
	}, []);

	const connect = useCallback(async () => {
		setIsJoeyConnectPending(true);
		setJoeyConnectIntent();
		onConnectStart?.();
		try {
			walletTraceLog('Joey WC: waiting for provider init');
			await waitForJoeyProvider();
			const actions = joeyActionsRef.current;
			if (!actions?.generate) throw new Error('Joey Wallet generate action not available');

			let generatedConnection = await actions.generate({ chain: 'xrpl:0', openModal: false });
			// One retry covers a narrow race where DefaultContext stubs still answer once.
			if (generatedConnection.error && isProviderNotReadyError(generatedConnection.error)) {
				walletTraceLog('Joey WC: generate hit not-ready; retrying once');
				await waitForJoeyProvider();
				generatedConnection = await joeyActionsRef.current.generate({ chain: 'xrpl:0', openModal: false });
			}
			if (generatedConnection.error) throw generatedConnection.error;
			const uri = generatedConnection.data?.uri?.trim() || null;
			const deeplink = generatedConnection.data?.deeplink || null;
			if (!uri) throw new Error('Joey QR code could not be generated.');
			setJoeyConnectUri(uri);
			setJoeyDeepLink(deeplink);

			const mobile = isMobileDevice();
			if (mobile && typeof deeplink === 'string' && deeplink.length > 0) {
				walletTraceLog('Joey WC: opening app via deeplink', { mobile: true });
				walletDebugLog('Joey connect: redirecting to app deeplink', { mobile: true });
				setShowJoeyQrModal(false);
				window.location.href = deeplink;
				return;
			}

			walletTraceLog('Joey WC: show QR modal', { mobile });
			walletDebugLog('Joey connect: showing QR (desktop or no deeplink)', { mobile });
			setShowJoeyQrModal(true);
		} catch (error) {
			clearJoeyConnectIntent();
			onConnectError?.();
			const err = error instanceof Error ? error : new Error(String(error));
			const message = isProviderNotReadyError(err)
				? 'Joey Wallet is still initializing. Wait a moment and try again. If it keeps failing, check Production WalletConnect/Joey project IDs and allowed domains.'
				: err.message;
			showToast('error', `Failed to generate Joey QR: ${message}`);
			setShowJoeyQrModal(false);
			setJoeyConnectUri(null);
			setJoeyDeepLink(null);
		} finally {
			setIsJoeyConnectPending(false);
		}
	}, [waitForJoeyProvider, showToast, onConnectStart, onConnectError]);

	const cancel = useCallback(() => {
		clearJoeyConnectIntent();
		setShowJoeyQrModal(false);
		setJoeyConnectUri(null);
		setJoeyDeepLink(null);
		setIsJoeyConnectPending(false);
	}, []);

	useEffect(() => {
		if (showJoeyQrModal && (session || account)) {
			setShowJoeyQrModal(false);
			setJoeyConnectUri(null);
			setJoeyDeepLink(null);
			setIsJoeyConnectPending(false);
		}
	}, [showJoeyQrModal, session, account]);

	useEffect(() => {
		const resolved = extractJoeyWalletAddress(account, session);
		const key = `${resolved ?? ''}|${typeof account === 'string' ? account.trim() : ''}|${Boolean(session)}`;
		if (key === lastJoeyDebugKeyRef.current) {
			return;
		}
		lastJoeyDebugKeyRef.current = key;
		walletTraceLog('Joey SDK: session/account updated', {
			hasAccountString: typeof account === 'string' && account.trim().length > 0,
			hasSession: Boolean(session),
			resolvedClassicAddress: resolved ? walletAddressPreview(resolved) : null,
		});
		walletDebugLog('Joey provider snapshot (changed)', {
			hasAccountString: typeof account === 'string' && account.trim().length > 0,
			accountPreview:
				typeof account === 'string' && account.trim().length > 0
					? walletAddressPreview(account.trim())
					: null,
			hasSession: Boolean(session),
			resolvedClassicAddress: resolved ? walletAddressPreview(resolved) : null,
		});
	}, [account, session]);

	return {
		isJoeyConnectPending,
		showJoeyQrModal,
		joeyConnectUri,
		joeyDeepLink,
		connect: connect,
		cancel,
		account,
		session,
		disconnectFromProvider,
	};
}
