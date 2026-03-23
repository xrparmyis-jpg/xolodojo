import { useState, useCallback, useEffect } from 'react';
import { standalone as joeyStandalone } from '@joey-wallet/wc-client/react';
import { isMobileDevice } from '../utils/device';

export function useJoeyWalletConnect({
	showToast,
}: {
	showToast: (type: 'success' | 'error', message: string, durationMs?: number) => void;
}) {
	// The Joey provider context type doesn't currently expose `account` in its TS definition,
	// but it is present at runtime. Cast to `any` here so we can safely read it.
	const joeyContext = joeyStandalone.provider.useProvider() as any;
	const joeyActions = joeyContext.actions;
	const session = joeyContext.session as unknown;
	const account = joeyContext.account as string | null | undefined;
	const [isJoeyConnectPending, setIsJoeyConnectPending] = useState(false);
	const [showJoeyQrModal, setShowJoeyQrModal] = useState(false);
	const [joeyConnectUri, setJoeyConnectUri] = useState<string | null>(null);
	const [joeyDeepLink, setJoeyDeepLink] = useState<string | null>(null);

	const connect = useCallback(async () => {
		setIsJoeyConnectPending(true);
		try {
			if (!joeyActions?.generate) throw new Error('Joey Wallet generate action not available');
			const generatedConnection = await joeyActions.generate({ chain: 'xrpl:0', openModal: false });
			if (generatedConnection.error) throw generatedConnection.error;
			const uri = generatedConnection.data?.uri?.trim() || null;
			const deeplink = generatedConnection.data?.deeplink || null;
			if (!uri) throw new Error('Joey QR code could not be generated.');
			setJoeyConnectUri(uri);
			setJoeyDeepLink(deeplink);

			// Mobile: open Joey directly (same idea as skipping an extra modal step for Xaman on phone).
			// Session completes when the user returns to the browser; persistence runs in useJoeyWalletPersistence.
			const mobile = isMobileDevice();
			if (mobile && typeof deeplink === 'string' && deeplink.length > 0) {
				setShowJoeyQrModal(false);
				window.location.href = deeplink;
				return;
			}

			setShowJoeyQrModal(true);
		} catch (error) {
			const err = error instanceof Error ? error : new Error(String(error));
			showToast('error', `Failed to generate Joey QR: ${err.message}`);
			setShowJoeyQrModal(false);
			setJoeyConnectUri(null);
			setJoeyDeepLink(null);
		} finally {
			setIsJoeyConnectPending(false);
		}
	}, [joeyActions, showToast]);

	const cancel = useCallback(() => {
		setShowJoeyQrModal(false);
		setJoeyConnectUri(null);
		setJoeyDeepLink(null);
		setIsJoeyConnectPending(false);
	}, []);

	// Close modal UI when WC session/account appears (success path). Final toast comes from persistence.
	useEffect(() => {
		if (showJoeyQrModal && (session || account)) {
			setShowJoeyQrModal(false);
			setJoeyConnectUri(null);
			setJoeyDeepLink(null);
			setIsJoeyConnectPending(false);
		}
	}, [showJoeyQrModal, session, account]);

	return {
		isJoeyConnectPending,
		showJoeyQrModal,
		joeyConnectUri,
		joeyDeepLink,
		connect,
		cancel,
		account,
		session,
	};
}
