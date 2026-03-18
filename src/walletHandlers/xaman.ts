
import { XummPkce } from 'xumm-oauth2-pkce';
import type { IWalletHandler } from './IWalletHandler';

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

function hasXamanRedirectParams() {
	if (typeof window === 'undefined') {
		return false;
	}
	const params = new URLSearchParams(window.location.search);
	return Boolean(
		params.get('authorization_code') ||
			params.get('access_token') ||
			params.get('error') ||
			params.get('error_description')
	);
}

export const xamanHandler: IWalletHandler = {
	async connect({
		auth0Id,
		accessToken,
		wallets,
		setIsLoading,
		setShowToast,
		loadWallets,
		walletIdToConnect,
		repairWalletAddressIfNeeded,
		tryDisconnectCurrentWallet,
		connectWallet,
		addWallet,
		showToast,
		setWallets,
		onWalletsUpdated,
		getUserWallets,
		connectedWallet,
	}) {
		try {
			setIsLoading?.(true);
			if (!isXamanConfigured()) {
				setShowToast?.('error', 'Xaman is not configured. Set VITE_XAMAN_API_KEY and restart the app.');
				return;
			}
			const client = getXamanClient();
			const flow = await client.authorize();
			const resolvedXrplAddress = flow?.me?.account;
			if (!resolvedXrplAddress) {
				setShowToast?.('error', 'No XRPL account returned from Xaman sign-in.');
				return;
			}
			let currentConnectedWallet = wallets.find((wallet: any) => wallet.is_connected);
			if (walletIdToConnect != null) {
				const targetWallet = wallets.find((wallet: any) => wallet.id === walletIdToConnect);
				if (!targetWallet) {
					setShowToast?.('error', 'Wallet not found');
					return;
				}
				if (targetWallet.wallet_address !== resolvedXrplAddress) {
					setShowToast?.('error', 'Scanned Xaman account does not match the selected wallet address.');
					return;
				}
				const repairedWallet = await repairWalletAddressIfNeeded(targetWallet, resolvedXrplAddress);
				if (currentConnectedWallet && currentConnectedWallet.id !== repairedWallet.id) {
					await tryDisconnectCurrentWallet(currentConnectedWallet);
				}
				await connectWallet(auth0Id, repairedWallet.id, accessToken);
				await loadWallets();
				setShowToast?.('success', 'Xaman wallet connected');
				return;
			}
			const existingWallet = wallets.find((wallet: any) => wallet.wallet_address === resolvedXrplAddress);
			if (existingWallet) {
				const repairedWallet = await repairWalletAddressIfNeeded(existingWallet, resolvedXrplAddress);
				if (currentConnectedWallet && currentConnectedWallet.id !== repairedWallet.id) {
					await tryDisconnectCurrentWallet(currentConnectedWallet);
				}
				await connectWallet(auth0Id, repairedWallet.id, accessToken);
				await loadWallets();
				setShowToast?.('success', 'Xaman wallet connected');
				return;
			}
			const result = await addWallet(auth0Id, resolvedXrplAddress, 'xaman', undefined, accessToken);
			if (result.success && result.wallet) {
				if (currentConnectedWallet) {
					await tryDisconnectCurrentWallet(currentConnectedWallet);
				}
				await connectWallet(auth0Id, result.wallet.id, accessToken);
			}
			await loadWallets();
			setShowToast?.('success', 'Xaman wallet added and connected!');
		} catch (error) {
			const err = error instanceof Error ? error : new Error(String(error));
			setShowToast?.('error', `Failed to connect Xaman: ${err.message}`);
		} finally {
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
		}
	},
	async repair({ wallets, auth0Id, accessToken, repairWalletAddressIfNeeded, loadWallets, setShowToast }) {
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
				await loadWallets();
				setShowToast?.('success', 'Xaman wallet address repaired');
			}
		} catch (error) {
			setShowToast?.('error', 'Failed to repair Xaman wallet address');
		}
	},
	getLabel: async () => 'Xaman',
};
