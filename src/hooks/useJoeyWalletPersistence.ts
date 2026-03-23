import { useEffect, useRef } from 'react';
import type { Wallet } from '../services/walletService';
import { addWallet, connectWallet, disconnectWallet } from '../services/walletService';
import { extractJoeyWalletAddress } from '../wallets/joey/extractJoeyWalletAddress';
import { clearJoeyConnectIntent, hasJoeyConnectIntent } from '../wallets/joey/joeyConnectIntent';

type ShowToast = (type: 'success' | 'error', message: string, durationMs?: number) => void;

export interface UseJoeyWalletPersistenceParams {
	showJoeyQrModal: boolean;
	joeyAccount: string | null | undefined;
	joeySession: unknown;
	wallets: Wallet[];
	auth0Id: string;
	accessToken: string | undefined;
	loadWallets: (opts?: { silent?: boolean }) => Promise<void>;
	applyConnectedWalletFromApi: (row: Wallet) => void;
	setWalletBusyMessage: (msg: string | null) => void;
	showToast: ShowToast;
}

/**
 * When Joey WC session resolves (modal closed + account/session present), persist to our API.
 * Keeps WalletConnection free of Joey-specific effect logic.
 */
export function useJoeyWalletPersistence({
	showJoeyQrModal,
	joeyAccount,
	joeySession,
	wallets,
	auth0Id,
	accessToken,
	loadWallets,
	applyConnectedWalletFromApi,
	setWalletBusyMessage,
	showToast,
}: UseJoeyWalletPersistenceParams): void {
	const runningRef = useRef(false);

	useEffect(() => {
		if (showJoeyQrModal) return;
		if (!joeyAccount && !joeySession) return;

		const joeyAddress = extractJoeyWalletAddress(joeyAccount, joeySession);
		if (!joeyAddress) {
			if (import.meta.env.DEV) {
				// eslint-disable-next-line no-console
				console.warn('[JoeyWallet] No address extracted from session; skip persist.');
			}
			return;
		}

		const normalizedAddress = joeyAddress.toLowerCase();
		const existingWallet = wallets.find(
			(w) => w.wallet_address.toLowerCase() === normalizedAddress && w.wallet_type === 'joey'
		);
		if (existingWallet?.is_connected) {
			return;
		}

		// SDK session can outlive our DB disconnect — do not auto-reconnect unless user started a connect flow.
		if (existingWallet && !existingWallet.is_connected && !hasJoeyConnectIntent()) {
			return;
		}

		const currentConnectedWallet = wallets.find((w) => w.is_connected);

		if (runningRef.current) return;
		runningRef.current = true;

		void (async () => {
			setWalletBusyMessage('Saving Joey wallet...');
			try {
				let walletId: number | undefined;
				if (!existingWallet) {
					const result = await addWallet(auth0Id, normalizedAddress, 'joey', 'Joey Wallet', accessToken);
					if (!result.success || !result.wallet) throw new Error('Failed to add Joey Wallet');
					walletId = result.wallet.id;
				} else {
					walletId = existingWallet.id;
				}
				if (walletId) {
					if (currentConnectedWallet && currentConnectedWallet.id !== walletId) {
						await disconnectWallet(auth0Id, accessToken);
					}
					const connectRes = await connectWallet(auth0Id, walletId, accessToken);
					if (connectRes.wallet) {
						applyConnectedWalletFromApi(connectRes.wallet);
					}
					await loadWallets({ silent: true });
					clearJoeyConnectIntent();
					showToast('success', 'Joey Wallet added and connected!');
				}
			} catch (err) {
				clearJoeyConnectIntent();
				console.error('[JoeyWallet] Failed to add/connect:', err);
				showToast(
					'error',
					`Failed to add/connect Joey Wallet: ${err instanceof Error ? err.message : String(err)}`
				);
			} finally {
				setWalletBusyMessage(null);
				runningRef.current = false;
			}
		})();
	}, [
		showJoeyQrModal,
		joeyAccount,
		joeySession,
		wallets,
		auth0Id,
		accessToken,
		loadWallets,
		showToast,
		applyConnectedWalletFromApi,
		setWalletBusyMessage,
	]);
}
