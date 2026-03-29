import { useState, useCallback, useEffect, useRef } from 'react';
import { standalone as joeyStandalone } from '@joey-wallet/wc-client/react';
import { isMobileDevice } from '../utils/device';
import { clearJoeyConnectIntent, setJoeyConnectIntent } from '../wallets/joey/joeyConnectIntent';
import { extractJoeyWalletAddress } from '../wallets/joey/extractJoeyWalletAddress';
import { walletAddressPreview, walletDebugLog } from '../utils/walletDebugLog';

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
	const session = joeyContext.session as unknown;
	const account = joeyContext.account as string | null | undefined;
	const [isJoeyConnectPending, setIsJoeyConnectPending] = useState(false);
	const [showJoeyQrModal, setShowJoeyQrModal] = useState(false);
	const [joeyConnectUri, setJoeyConnectUri] = useState<string | null>(null);
	const [joeyDeepLink, setJoeyDeepLink] = useState<string | null>(null);
	const lastJoeyDebugKeyRef = useRef<string>('');

	const disconnectFromProvider = useCallback(async () => {
		try {
			if (joeyActions?.disconnect) {
				await joeyActions.disconnect();
			}
		} catch (e) {
			console.warn('[JoeyWallet] Provider disconnect failed (continuing):', e);
		}
	}, [joeyActions]);

	const connect = useCallback(async () => {
		setIsJoeyConnectPending(true);
		setJoeyConnectIntent();
		onConnectStart?.();
		try {
			if (!joeyActions?.generate) throw new Error('Joey Wallet generate action not available');
			const generatedConnection = await joeyActions.generate({ chain: 'xrpl:0', openModal: false });
			if (generatedConnection.error) throw generatedConnection.error;
			const uri = generatedConnection.data?.uri?.trim() || null;
			const deeplink = generatedConnection.data?.deeplink || null;
			if (!uri) throw new Error('Joey QR code could not be generated.');
			setJoeyConnectUri(uri);
			setJoeyDeepLink(deeplink);

			const mobile = isMobileDevice();
			if (mobile && typeof deeplink === 'string' && deeplink.length > 0) {
				walletDebugLog('Joey connect: redirecting to app deeplink', { mobile: true });
				setShowJoeyQrModal(false);
				window.location.href = deeplink;
				return;
			}

			walletDebugLog('Joey connect: showing QR (desktop or no deeplink)', { mobile });
			setShowJoeyQrModal(true);
		} catch (error) {
			clearJoeyConnectIntent();
			onConnectError?.();
			const err = error instanceof Error ? error : new Error(String(error));
			showToast('error', `Failed to generate Joey QR: ${err.message}`);
			setShowJoeyQrModal(false);
			setJoeyConnectUri(null);
			setJoeyDeepLink(null);
		} finally {
			setIsJoeyConnectPending(false);
		}
	}, [joeyActions, showToast, onConnectStart, onConnectError]);

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
