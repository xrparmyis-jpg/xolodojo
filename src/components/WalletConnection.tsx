import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAccount, useDisconnect as useWagmiDisconnect } from 'wagmi';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { standalone as joeyStandalone } from '@joey-wallet/wc-client/react';
// import { walletConnectHandler } from '../walletHandlers/walletConnect';
// import { joeyHandler } from '../walletHandlers/joey';
// import { xamanHandler } from '../walletHandlers/xaman';
// import type { IWalletHandler } from '../walletHandlers/IWalletHandler';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faArrowsRotate,
    faCopy,
    faLink,
    faSpinner,
    faThumbtack,
    faXmark,
} from '@fortawesome/free-solid-svg-icons';
import Button from './Button';
import ModalConfirm from './ModalConfirm';
import NftGallery from './NftGallery';
import { useToast } from './ToastProvider';
import { walletConnectProjectId } from '../web3modal';
import {
    authorizeXamanAccount,
    clearXamanSession,
    getActiveXamanAccount,
    getXamanRedirectUrl,
    hasXamanRedirectParams,
    isXamanConfigured,
    restoreXamanAccountFromRedirect,
} from '../services/xamanService';
import type { Wallet } from '../services/walletService';
import {
    addWallet,
    connectWallet,
    disconnectWallet,
    deleteWallet,
    getUserWallets,
    updateWalletAddress,
} from '../services/walletService';
import {
    getWalletAssetSummary,
    type WalletAssetSummary,
} from '../services/walletAssetService';

interface WalletConnectionProps {
    auth0Id: string;
    accessToken?: string;
    onWalletsUpdated?: (wallets: Wallet[]) => void;
}

const defaultJoeyChain = 'xrpl:0';

const isXrplWalletType = (walletType: Wallet['wallet_type']) => walletType === 'xaman' || walletType === 'joey';

const addressesMatchForWalletType = (
    leftAddress: string,
    rightAddress: string,
    walletType: Wallet['wallet_type']
) => {
    if (isXrplWalletType(walletType)) {
        // Keep XRPL casing when storing new wallets, but match legacy lowercase records too.
        return leftAddress === rightAddress || leftAddress.toLowerCase() === rightAddress.toLowerCase();
    }

    return leftAddress.toLowerCase() === rightAddress.toLowerCase();
};

function WalletConnectionContent({ auth0Id, accessToken, onWalletsUpdated }: WalletConnectionProps) {
    const myWalletsRef = useRef<HTMLDivElement | null>(null);
    const { open } = useWeb3Modal();
    const { address: wagmiAddress, isConnected: isWagmiConnected, connector: wagmiConnector } = useAccount();
    const { accounts: joeyAccounts, actions: joeyActions } = joeyStandalone.provider.useProvider();
    const { mutateAsync: wagmiDisconnectAsync } = useWagmiDisconnect();
    const [wallets, setWallets] = useState<Wallet[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showAddWalletModal, setShowAddWalletModal] = useState(false);
    const [isWalletConnectPending, setIsWalletConnectPending] = useState(false);
    const [isJoeyConnectPending, setIsJoeyConnectPending] = useState(false);
    const [pendingWalletConnectId, setPendingWalletConnectId] = useState<number | null>(null);
    const [pendingJoeyConnectId, setPendingJoeyConnectId] = useState<number | null>(null);
    const [showJoeyQrModal, setShowJoeyQrModal] = useState(false);
    const [joeyConnectUri, setJoeyConnectUri] = useState<string | null>(null);
    const [joeyDeepLink, setJoeyDeepLink] = useState<string | null>(null);
    const [isXamanRedirectRecoveryDone, setIsXamanRedirectRecoveryDone] = useState(false);
    const [connectedWalletAssets, setConnectedWalletAssets] = useState<WalletAssetSummary | null>(null);
    const [isAssetsLoading, setIsAssetsLoading] = useState(false);
    const [assetsError, setAssetsError] = useState<string | null>(null);
    const [copiedWalletId, setCopiedWalletId] = useState<number | null>(null);
    const [hasAttemptedXamanSessionRepair, setHasAttemptedXamanSessionRepair] = useState(false);
    const { showToast, clearToasts } = useToast();

    // Map wallet types to handlers

    // Example usage: walletHandlers[walletType].connect({...})

    const clearWalletToasts = useCallback(() => {
        clearToasts();
    }, [clearToasts]);

    const repairWalletAddressIfNeeded = useCallback(async (
        wallet: Wallet,
        resolvedAddress: string
    ): Promise<Wallet> => {
        if (!isXrplWalletType(wallet.wallet_type) || wallet.wallet_address === resolvedAddress) {
            return wallet;
        }

        const result = await updateWalletAddress(wallet.id, auth0Id, resolvedAddress, accessToken);
        return result.wallet ?? { ...wallet, wallet_address: resolvedAddress };
    }, [accessToken, auth0Id]);

    const tryDisconnectCurrentWallet = useCallback(
        async (currentWallet?: Wallet | null) => {
            if (!currentWallet) return;

            try {
                if (currentWallet.wallet_type === 'xaman') {
                    await clearXamanSession();
                }
                await disconnectWallet(auth0Id, accessToken);
            } catch (error) {
                console.warn('Best-effort disconnect failed, continuing with new connection:', error);
            }
        },
        [accessToken, auth0Id]
    );

    const loadWallets = useCallback(async () => {
        try {
            setIsLoading(true);
            // Scroll to My Wallets section when loading starts
            setTimeout(() => {
                if (myWalletsRef.current) {
                    myWalletsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 100);
            const result = await getUserWallets(auth0Id, accessToken);
            if (result.success) {
                // Filter out wallets with empty address or invalid type
                const validWallets = (result.wallets || []).filter(
                    w => w.wallet_address && typeof w.wallet_address === 'string' && w.wallet_address.trim().length > 0 && w.wallet_type && typeof w.wallet_type === 'string' && w.wallet_type.trim().length > 0
                );
                setWallets(validWallets);
                onWalletsUpdated?.(validWallets);
            }
        } catch (error) {
            console.error('Failed to load wallets:', error);
            showToast('error', 'Failed to load wallets');
        } finally {
            setIsLoading(false);
            //setHasAttemptedInitialWalletLoad(true);
        }
    }, [accessToken, auth0Id, onWalletsUpdated, showToast]);

    const getWalletConnectSessionLabel = useCallback(async (): Promise<string | undefined> => {
        if (!wagmiConnector || wagmiConnector.id !== 'walletConnect') {
            return undefined;
        }

        try {
            const provider = await wagmiConnector.getProvider();
            const providerWithSession = provider as {
                session?: {
                    peer?: {
                        metadata?: {
                            name?: string;
                        };
                    };
                };
                signer?: {
                    session?: {
                        peer?: {
                            metadata?: {
                                name?: string;
                            };
                        };
                    };
                    client?: {
                        session?: {
                            peer?: {
                                metadata?: {
                                    name?: string;
                                };
                            };
                        };
                    };
                };
            };

            const sessionLabelCandidates = [
                providerWithSession.session?.peer?.metadata?.name,
                providerWithSession.signer?.session?.peer?.metadata?.name,
                providerWithSession.signer?.client?.session?.peer?.metadata?.name,
                wagmiConnector.name,
            ];

            const sessionLabel = sessionLabelCandidates.find(
                (candidate): candidate is string => typeof candidate === 'string' && candidate.trim().length > 0
            );

            if (!sessionLabel) {
                if (import.meta.env.DEV) {
                    console.debug('[WalletConnection] WalletConnect label not found from provider/session metadata');
                }
                return undefined;
            }

            const normalizedLabel = sessionLabel.trim();
            if (import.meta.env.DEV) {
                console.debug('[WalletConnection] Resolved WalletConnect label:', normalizedLabel);
            }
            return normalizedLabel || undefined;
        } catch (error) {
            console.warn('Failed to read WalletConnect peer metadata:', error);
            return undefined;
        }
    }, [wagmiConnector]);

    // Load wallets on mount
    useEffect(() => {
        void loadWallets();
    }, [loadWallets]);

    useEffect(() => {
        const repairConnectedXamanWallet = async () => {
            if (hasAttemptedXamanSessionRepair) {
                return;
            }

            const currentConnectedWallet = wallets.find((wallet) => wallet.is_connected);
            if (!currentConnectedWallet || currentConnectedWallet.wallet_type !== 'xaman') {
                setHasAttemptedXamanSessionRepair(true);
                return;
            }

            if (currentConnectedWallet.wallet_address !== currentConnectedWallet.wallet_address.toLowerCase()) {
                setHasAttemptedXamanSessionRepair(true);
                return;
            }

            const activeXamanAccount = await getActiveXamanAccount();
            if (!activeXamanAccount) {
                setHasAttemptedXamanSessionRepair(true);
                return;
            }

            if (!addressesMatchForWalletType(currentConnectedWallet.wallet_address, activeXamanAccount, 'xaman')) {
                setHasAttemptedXamanSessionRepair(true);
                return;
            }

            if (currentConnectedWallet.wallet_address === activeXamanAccount) {
                setHasAttemptedXamanSessionRepair(true);
                return;
            }

            try {
                await repairWalletAddressIfNeeded(currentConnectedWallet, activeXamanAccount);
                await loadWallets();
            } catch (error) {
                console.error('Failed to repair Xaman wallet address casing:', error);
            } finally {
                setHasAttemptedXamanSessionRepair(true);
            }
        };

        void repairConnectedXamanWallet();
    }, [hasAttemptedXamanSessionRepair, loadWallets, repairWalletAddressIfNeeded, wallets]);

    useEffect(() => {
        const syncWalletConnectSession = async () => {
            if (!isWalletConnectPending || !isWagmiConnected || !wagmiAddress) {
                return;
            }

            try {
                setIsLoading(true);

                const normalizedAddress = wagmiAddress.toLowerCase();
                const currentConnectedWallet = wallets.find((wallet) => wallet.is_connected);

                if (pendingWalletConnectId != null) {
                    const existingWallet = wallets.find((wallet) => wallet.id === pendingWalletConnectId);
                    if (!existingWallet) {
                        showToast('error', 'Wallet not found');
                        return;
                    }

                    if (existingWallet.wallet_address.toLowerCase() !== normalizedAddress) {
                        showToast('error', 'Connected wallet does not match the selected wallet. Please connect the matching address.');
                        return;
                    }

                    if (currentConnectedWallet && currentConnectedWallet.id !== existingWallet.id) {
                        await tryDisconnectCurrentWallet(currentConnectedWallet);
                    }

                    await connectWallet(auth0Id, existingWallet.id, accessToken);
                    await loadWallets();
                    showToast('success', 'Wallet connected');
                    return;
                }

                const existingWallet = wallets.find(
                    (wallet) => wallet.wallet_address.toLowerCase() === normalizedAddress
                );

                if (existingWallet) {
                    if (currentConnectedWallet && currentConnectedWallet.id !== existingWallet.id) {
                        await tryDisconnectCurrentWallet(currentConnectedWallet);
                    }
                    await connectWallet(auth0Id, existingWallet.id, accessToken);
                    await loadWallets();
                    showToast('success', 'Wallet connected');
                    return;
                }

                const walletConnectLabel = await getWalletConnectSessionLabel();
                const result = await addWallet(
                    auth0Id,
                    normalizedAddress,
                    'walletconnect',
                    walletConnectLabel,
                    accessToken
                );
                if (result.success && result.wallet) {
                    if (currentConnectedWallet) {
                        await tryDisconnectCurrentWallet(currentConnectedWallet);
                    }
                    await connectWallet(auth0Id, result.wallet.id, accessToken);
                }

                await loadWallets();
                showToast('success', 'WalletConnect wallet added and connected!');
            } catch (error) {
                const err = error instanceof Error ? error : new Error(String(error));
                console.error('Failed to sync WalletConnect session:', err);
                showToast('error', `Failed to connect wallet: ${err.message}`);
            } finally {
                setPendingWalletConnectId(null);
                setIsWalletConnectPending(false);
                setIsLoading(false);
            }
        };

        void syncWalletConnectSession();
    }, [
        accessToken,
        auth0Id,
        isWalletConnectPending,
        isWagmiConnected,
        pendingWalletConnectId,
        getWalletConnectSessionLabel,
        tryDisconnectCurrentWallet,
        wagmiAddress,
        wallets,
        loadWallets,
        showToast,
    ]);

    useEffect(() => {
        const syncJoeySession = async () => {
            if (!isJoeyConnectPending || !joeyAccounts || joeyAccounts.length === 0) {
                return;
            }

            const resolvedAddress = joeyAccounts
                .map((account: string) => account.split(':').pop()?.trim())
                .find((account: string | undefined) => Boolean(account));

            if (!resolvedAddress) {
                return;
            }

            try {
                setIsLoading(true);

                const resolvedJoeyAddress = resolvedAddress;
                const currentConnectedWallet = wallets.find((wallet) => wallet.is_connected);

                if (pendingJoeyConnectId != null) {
                    const existingWallet = wallets.find((wallet) => wallet.id === pendingJoeyConnectId);
                    if (!existingWallet) {
                        showToast('error', 'Wallet not found');
                        return;
                    }

                    if (!addressesMatchForWalletType(existingWallet.wallet_address, resolvedJoeyAddress, 'joey')) {
                        showToast('error', 'Connected Joey account does not match the selected wallet address.');
                        return;
                    }

                    const repairedWallet = await repairWalletAddressIfNeeded(existingWallet, resolvedJoeyAddress);

                    if (currentConnectedWallet && currentConnectedWallet.id !== repairedWallet.id) {
                        await tryDisconnectCurrentWallet(currentConnectedWallet);
                    }

                    await connectWallet(auth0Id, repairedWallet.id, accessToken);
                    await loadWallets();
                    showToast('success', 'Joey wallet connected');
                    return;
                }

                const existingWallet = wallets.find(
                    (wallet) => addressesMatchForWalletType(wallet.wallet_address, resolvedJoeyAddress, 'joey')
                );

                if (existingWallet) {
                    const repairedWallet = await repairWalletAddressIfNeeded(existingWallet, resolvedJoeyAddress);
                    if (currentConnectedWallet && currentConnectedWallet.id !== repairedWallet.id) {
                        await tryDisconnectCurrentWallet(currentConnectedWallet);
                    }
                    await connectWallet(auth0Id, repairedWallet.id, accessToken);
                    await loadWallets();
                    showToast('success', 'Joey wallet connected');
                    return;
                }

                const result = await addWallet(
                    auth0Id,
                    resolvedJoeyAddress,
                    'joey',
                    'Joey Wallet',
                    accessToken
                );
                if (result.success && result.wallet) {
                    if (currentConnectedWallet) {
                        await tryDisconnectCurrentWallet(currentConnectedWallet);
                    }
                    await connectWallet(auth0Id, result.wallet.id, accessToken);
                }

                await loadWallets();
                showToast('success', 'Joey wallet added and connected!');
            } catch (error) {
                const err = error instanceof Error ? error : new Error(String(error));
                console.error('Failed to sync Joey session:', err);
                showToast('error', `Failed to connect Joey wallet: ${err.message}`);
            } finally {
                setShowJoeyQrModal(false);
                setJoeyConnectUri(null);
                setJoeyDeepLink(null);
                setPendingJoeyConnectId(null);
                setIsJoeyConnectPending(false);
                setIsLoading(false);
            }
        };

        void syncJoeySession();
    }, [
        accessToken,
        auth0Id,
        isJoeyConnectPending,
        joeyAccounts,
        joeyActions,
        loadWallets,
        pendingJoeyConnectId,
        showToast,
        tryDisconnectCurrentWallet,
        wallets,
    ]);

    useEffect(() => {
        if (isXamanRedirectRecoveryDone || !isXamanConfigured() || !hasXamanRedirectParams()) {
            return;
        }

        let isCancelled = false;

        const recoverXamanRedirectSession = async () => {
            try {
                const xrplAddress = await restoreXamanAccountFromRedirect();
                if (!xrplAddress || isCancelled) {
                    return;
                }

                const resolvedXrplAddress = xrplAddress;
                const latestWalletsResult = await getUserWallets(auth0Id, accessToken);
                const latestWallets = latestWalletsResult.success ? latestWalletsResult.wallets || [] : [];

                const currentConnectedWallet = latestWallets.find((wallet) => wallet.is_connected);
                const existingWallet = latestWallets.find(
                    (wallet) => addressesMatchForWalletType(wallet.wallet_address, resolvedXrplAddress, 'xaman')
                );

                if (existingWallet) {
                    const repairedWallet = await repairWalletAddressIfNeeded(existingWallet, resolvedXrplAddress);
                    if (currentConnectedWallet && currentConnectedWallet.id !== repairedWallet.id) {
                        await tryDisconnectCurrentWallet(currentConnectedWallet);
                    }
                    await connectWallet(auth0Id, repairedWallet.id, accessToken);
                    await loadWallets();
                    showToast('success', 'Xaman wallet connected');
                    return;
                }

                const result = await addWallet(auth0Id, xrplAddress, 'xaman', undefined, accessToken);
                if (result.success && result.wallet) {
                    if (currentConnectedWallet) {
                        await tryDisconnectCurrentWallet(currentConnectedWallet);
                    }
                    await connectWallet(auth0Id, result.wallet.id, accessToken);
                    await loadWallets();
                    showToast('success', 'Xaman wallet added and connected!');
                }
            } catch (error) {
                const err = error instanceof Error ? error : new Error(String(error));
                console.error('Failed to recover Xaman redirect session:', err);
                showToast('error', `Failed to finalize Xaman sign-in: ${err.message}`);
            } finally {
                if (!isCancelled) {
                    setIsXamanRedirectRecoveryDone(true);
                }
            }
        };

        void recoverXamanRedirectSession();

        return () => {
            isCancelled = true;
        };
    }, [
        accessToken,
        auth0Id,
        isXamanRedirectRecoveryDone,
        loadWallets,
        showToast,
        tryDisconnectCurrentWallet,
    ]);

    const handleConnectXaman = async (walletIdToConnect?: number) => {
        try {
            clearWalletToasts();
            setIsLoading(true);

            if (!isXamanConfigured()) {
                showToast('error', 'Xaman is not configured. Set VITE_XAMAN_API_KEY and restart the app.');
                return;
            }

            const xrplAddress = await authorizeXamanAccount();
            const resolvedXrplAddress = xrplAddress;

            if (walletIdToConnect != null) {
                const targetWallet = wallets.find((wallet) => wallet.id === walletIdToConnect);
                if (!targetWallet) {
                    showToast('error', 'Wallet not found');
                    return;
                }

                if (!addressesMatchForWalletType(targetWallet.wallet_address, resolvedXrplAddress, 'xaman')) {
                    showToast('error', 'Scanned Xaman account does not match the selected wallet address.');
                    return;
                }

                const repairedWallet = await repairWalletAddressIfNeeded(targetWallet, resolvedXrplAddress);

                if (connectedWallet && connectedWallet.id !== repairedWallet.id) {
                    await tryDisconnectCurrentWallet(connectedWallet);
                }
                await connectWallet(auth0Id, repairedWallet.id, accessToken);
                await loadWallets();
                showToast('success', 'Xaman wallet connected');
                return;
            }

            const existingWallet = wallets.find(
                (wallet) => addressesMatchForWalletType(wallet.wallet_address, resolvedXrplAddress, 'xaman')
            );

            if (existingWallet) {
                const repairedWallet = await repairWalletAddressIfNeeded(existingWallet, resolvedXrplAddress);
                if (connectedWallet && connectedWallet.id !== repairedWallet.id) {
                    await tryDisconnectCurrentWallet(connectedWallet);
                }
                await connectWallet(auth0Id, repairedWallet.id, accessToken);
                await loadWallets();
                showToast('success', 'Xaman wallet connected');
                return;
            }

            const result = await addWallet(auth0Id, xrplAddress, 'xaman', undefined, accessToken);
            if (result.success && result.wallet) {
                if (connectedWallet) {
                    await tryDisconnectCurrentWallet(connectedWallet);
                }
                await connectWallet(auth0Id, result.wallet.id, accessToken);
            }

            await loadWallets();
            showToast('success', 'Xaman wallet added and connected!');
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            console.error('Failed to connect Xaman wallet:', err);
            const normalizedMessage = err.message.toLowerCase();
            if (
                normalizedMessage.includes('access_denied') ||
                normalizedMessage.includes('invalid client') ||
                normalizedMessage.includes('redirect')
            ) {
                showToast('error', `Xaman rejected the redirect URL. In apps.xumm.dev, add this exact Redirect URL: ${getXamanRedirectUrl()}`);
            } else {
                showToast('error', `Failed to connect Xaman: ${err.message}`);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleConnectJoey = async (walletIdToConnect?: number) => {
        try {
            clearWalletToasts();
            setIsLoading(true);
            setPendingJoeyConnectId(walletIdToConnect ?? null);
            setIsJoeyConnectPending(true);

            const generatedConnection = await joeyActions.generate({
                chain: defaultJoeyChain,
                openModal: false,
            });

            if (generatedConnection.error) {
                throw generatedConnection.error;
            }

            const generatedUri = generatedConnection.data?.uri?.trim();
            if (!generatedUri) {
                throw new Error('Joey QR code could not be generated.');
            }

            if (import.meta.env.DEV) {
                console.debug('[WalletConnection] Joey QR generated', {
                    uri: generatedUri,
                    deeplink: generatedConnection.data?.deeplink ?? null,
                    walletIdToConnect: walletIdToConnect ?? null,
                });
            }

            setJoeyConnectUri(generatedUri);
            setJoeyDeepLink(generatedConnection.data?.deeplink ?? null);
            setShowJoeyQrModal(true);
            setIsLoading(false);
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            console.error('Failed to connect Joey wallet:', err);
            showToast('error', `Failed to connect Joey wallet: ${err.message}`);
            setShowJoeyQrModal(false);
            setJoeyConnectUri(null);
            setJoeyDeepLink(null);
            setPendingJoeyConnectId(null);
            setIsJoeyConnectPending(false);
            setIsLoading(false);
        }
    };

    const handleCancelJoeyQr = async () => {
        setShowJoeyQrModal(false);
        setJoeyConnectUri(null);
        setJoeyDeepLink(null);
        setPendingJoeyConnectId(null);
        setIsJoeyConnectPending(false);
        setIsLoading(false);

        try {
            await joeyActions.disconnect();
        } catch (error) {
            console.warn('Best-effort Joey disconnect after QR cancel failed:', error);
        }
    };

    // const handleDisconnect = async () => {
    //     try {
    //         clearWalletToasts();
    //         setIsLoading(true);
    //         if (connectedWallet?.wallet_type === 'walletconnect') {
    //             await wagmiDisconnectAsync();
    //         } else if (connectedWallet?.wallet_type === 'joey') {
    //             await joeyActions.disconnect();
    //         } else if (connectedWallet?.wallet_type === 'xaman') {
    //             await clearXamanSession();
    //         }
    //         // Then disconnect at the database level
    //         await disconnectWallet(auth0Id, accessToken);
    //         showToast('success', 'Wallet disconnected');
    //         await loadWallets();
    //     } catch (error) {
    //         const err = error instanceof Error ? error : new Error(String(error));
    //         console.error('Failed to disconnect wallet:', err);
    //         showToast('error', `Failed to disconnect: ${err.message}`);
    //     } finally {
    //         setIsLoading(false);
    //     }
    // };

    const handleConnectExisting = async (walletId: number) => {
        try {
            clearWalletToasts();
            setIsLoading(true);

            const wallet = wallets.find((currentWallet) => currentWallet.id === walletId);
            if (!wallet) {
                showToast('error', 'Wallet not found');
                return;
            }

            if (wallet.wallet_type === 'xaman') {
                await handleConnectXaman(wallet.id);
                return;
            }

            if (wallet.wallet_type === 'joey') {
                await handleConnectJoey(wallet.id);
                return;
            }

            if (wallet.wallet_type === 'walletconnect') {
                if (!walletConnectProjectId) {
                    showToast('error', 'WalletConnect is not configured. Set VITE_WALLETCONNECT_PROJECT_ID and restart the app.');
                    return;
                }

                await open({ view: 'Connect' });
                setPendingWalletConnectId(wallet.id);
                setIsWalletConnectPending(true);
                return;
            }

            await connectWallet(auth0Id, walletId, accessToken);
            await loadWallets();
            showToast('success', 'Wallet connected');
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            console.error('Failed to connect existing wallet:', err);
            showToast('error', `Failed to connect wallet: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (walletId: number) => {
        try {
            clearWalletToasts();
            setIsLoading(true);

            // Check if this is the connected wallet
            const walletToDelete = wallets.find(w => w.id === walletId);
            if (!walletToDelete) {
                showToast('error', 'Wallet not found');
                setIsLoading(false);
                return;
            }
            if (walletToDelete.is_connected) {
                if (walletToDelete.wallet_type === 'walletconnect') {
                    await wagmiDisconnectAsync();
                } else if (walletToDelete?.wallet_type === 'joey') {
                    await joeyActions.disconnect();
                } else if (walletToDelete.wallet_type === 'xaman') {
                    await clearXamanSession();
                }
                // Then disconnect at the database level
                await disconnectWallet(auth0Id, accessToken);
            }

            // Delete all pinned NFTs for this wallet
            try {
                const pinnedNfts = await import('../services/pinnedNftService').then(mod => mod.getPinnedNfts(auth0Id, walletToDelete.wallet_address, accessToken));
                for (const nft of pinnedNfts) {
                    await import('../services/pinnedNftService').then(mod => mod.unpinNft(auth0Id, nft.token_id, walletToDelete.wallet_address, accessToken));
                }
            } catch (err) {
                // Log and continue if pin removal fails
                console.error('Failed to remove pinned NFTs for wallet:', err);
            }

            // Now delete the wallet
            await deleteWallet(walletId, auth0Id, accessToken);
            showToast('success', 'Wallet deleted successfully');
            await loadWallets();
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            console.error('Failed to delete wallet:', err);
            showToast('error', `Failed to delete wallet: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfirmDelete = () => {
        if (pendingDeleteId == null) return;

        const walletIdToDelete = pendingDeleteId;
        setShowDeleteModal(false);
        setPendingDeleteId(null);
        void handleDelete(walletIdToDelete);
    };

    const handleCopyWalletAddress = async (walletId: number, walletAddress: string) => {
        try {
            clearWalletToasts();
            await navigator.clipboard.writeText(walletAddress);
            setCopiedWalletId(walletId);
            setTimeout(() => {
                setCopiedWalletId((currentCopiedId) =>
                    currentCopiedId === walletId ? null : currentCopiedId
                );
            }, 1500);
        } catch (error) {
            console.error('Failed to copy wallet address:', error);
            showToast('error', 'Failed to copy wallet address');
        }
    };

    const handleSelectWalletType = async (walletType: 'walletconnect' | 'xaman') => {
        clearWalletToasts();
        setShowAddWalletModal(false);

        if (walletType === 'xaman') {
            void handleConnectXaman();
            return;
        }

        if (!walletConnectProjectId) {
            showToast('error', 'WalletConnect is not configured. Set VITE_WALLETCONNECT_PROJECT_ID and restart the app.');
            return;
        }

        try {
            await open({ view: 'Connect' });
            setPendingWalletConnectId(null);
            setIsWalletConnectPending(true);
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            console.error('Failed to open WalletConnect modal:', err);
            showToast('error', `Failed to open WalletConnect: ${err.message}`);
            setIsWalletConnectPending(false);
        }
    };

    const connectedWallet = wallets.length > 0 ? wallets.find(w => w.is_connected) : null;

    const refreshConnectedWalletAssets = useCallback(async () => {
        if (!connectedWallet) {
            setConnectedWalletAssets(null);
            setAssetsError(null);
            setIsAssetsLoading(false);
            return;
        }

        try {
            setIsAssetsLoading(true);
            setAssetsError(null);
            const summary = await getWalletAssetSummary(
                auth0Id,
                connectedWallet.wallet_address,
                accessToken
            );
            setConnectedWalletAssets(summary);
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            setConnectedWalletAssets(null);
            setAssetsError(err.message);
        } finally {
            setIsAssetsLoading(false);
        }
    }, [accessToken, auth0Id, connectedWallet]);

    useEffect(() => {
        void refreshConnectedWalletAssets();
    }, [refreshConnectedWalletAssets]);

    const sortedWallets = useMemo(
        () => [...wallets].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
        [wallets]
    );

    useEffect(() => {
        if (!import.meta.env.DEV) {
            return;
        }

        console.groupCollapsed(`[WalletConnection] Rendering ${sortedWallets.length} wallet(s)`);
        console.table(
            sortedWallets.map((wallet) => ({
                id: wallet.id,
                address: wallet.wallet_address,
                type: wallet.wallet_type,
                label: wallet.wallet_label ?? null,
                is_connected: wallet.is_connected,
                created_at: wallet.created_at,
                updated_at: wallet.updated_at,
            }))
        );
        console.log('Full wallet objects:', sortedWallets);
        console.groupEnd();
    }, [sortedWallets]);

    const isInteractionBlocked = isLoading || isAssetsLoading || isWalletConnectPending || isJoeyConnectPending;
    const loadingLabel = isAssetsLoading
        ? 'Loading wallet summary...'
        : isWalletConnectPending || isJoeyConnectPending
            ? 'Connecting to wallet...'
            : 'Loading...';
    const shouldUseSummaryMinHeight = isAssetsLoading || ((connectedWalletAssets?.nft_count ?? 0) > 0);

    return (
        <div className="relative w-full p-6 bg-black/30 rounded-lg mt-4" ref={myWalletsRef}>
            {wallets.length > 0 && (
                <div className="flex justify-between items-center mb-4">
                    <h4 className="text-white text-lg">
                        My Wallets
                    </h4>
                </div>
            )}
            {wallets.length > 0 && (
                <div className="space-y-3 mb-4">
                    {sortedWallets.map((wallet) => {
                        const truncatedAddress = wallet.wallet_address.length > 12
                            ? `${wallet.wallet_address.slice(0, 6)}...${wallet.wallet_address.slice(-6)}`
                            : wallet.wallet_address;
                        // Custom wallet label logic
                        let walletLabel = wallet.wallet_label;
                        if (!walletLabel) {
                            if (wallet.wallet_type === 'xaman') {
                                walletLabel = 'Xaman (XUMM)';
                            } else if (wallet.wallet_type === 'joey') {
                                walletLabel = 'Joey Wallet';
                            } else {
                                walletLabel = wallet.wallet_type.charAt(0).toUpperCase() + wallet.wallet_type.slice(1);
                            }
                        }
                        return (
                            <div
                                key={wallet.id}
                                className={`p-4 rounded-lg border flex items-center justify-between ${wallet.is_connected
                                    ? 'bg-green-900/30 border-green-500/60'
                                    : 'bg-white/5 border-white/10'
                                    }`}
                            >
                                <div className="flex flex-col">
                                    <div className="text-white text-sm font-semibold">
                                        {walletLabel}
                                    </div>
                                    <div className="flex items-center mt-1">
                                        <span className="text-white/80 text-xs mr-2">
                                            {truncatedAddress}
                                        </span>
                                        <button
                                            type="button"
                                            title="Copy address"
                                            className="cursor-pointer text-white/60 hover:text-white ml-1"
                                            onClick={() => handleCopyWalletAddress(wallet.id, wallet.wallet_address)}
                                        >
                                            <FontAwesomeIcon icon={faCopy} />
                                        </button>
                                        {copiedWalletId === wallet.id && (
                                            <span className="ml-1 text-green-400 text-xs">Copied!</span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {!wallet.is_connected && (
                                        <button
                                            type="button"
                                            title="Connect wallet"
                                            className="cursor-pointer flex items-center justify-center w-8 h-8 rounded-full bg-green-700 hover:bg-green-800 text-white text-lg"
                                            onClick={() => handleConnectExisting(wallet.id)}
                                        >
                                            <FontAwesomeIcon icon={faLink} />
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        title="Remove wallet"
                                        className="cursor-pointer flex items-center justify-center w-8 h-8 rounded-full bg-red-600 hover:bg-red-700 text-white text-lg"
                                        onClick={() => {
                                            setPendingDeleteId(wallet.id);
                                            setShowDeleteModal(true);
                                        }}
                                    >
                                        <FontAwesomeIcon icon={faXmark} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <ModalConfirm
                isOpen={showDeleteModal}
                title="Remove wallet?"
                message={
                    `This will remove the wallet from your profile, you can always re-add it later by connecting again.\n\nAny NFTs in this wallet that are pinned on the XoloGlobe will also be removed.`
                }
                confirmLabel="Remove"
                loading={isLoading}
                onCancel={() => {
                    setShowDeleteModal(false);
                    setPendingDeleteId(null);
                }}
                onConfirm={handleConfirmDelete}
            />

            {showAddWalletModal && typeof document !== 'undefined' && createPortal(
                <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/75 p-4 sm:p-6">
                    <div className="w-full max-w-sm rounded-xl bg-neutral-900 p-6 shadow-xl border border-white/10">
                        <h3 className="text-white text-lg font-semibold mb-2">Add New Wallet</h3>
                        <p className="text-sm text-white/70 mb-4">Select the wallet type you want to add.</p>
                        <div className="grid grid-cols-1 gap-3">
                            <Button
                                onClick={() => void handleSelectWalletType('walletconnect')}
                                disabled={isLoading}
                                className="w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800"
                            >
                                WalletConnect
                            </Button>
                            <Button
                                onClick={() => {
                                    setShowAddWalletModal(false);
                                    void handleConnectJoey();
                                }}
                                disabled={isLoading}
                                className="w-full bg-teal-600 hover:bg-teal-700 active:bg-teal-800"
                            >
                                Joey Wallet
                            </Button>
                            <Button
                                onClick={() => void handleSelectWalletType('xaman')}
                                disabled={isLoading}
                                className="w-full bg-purple-600 hover:bg-purple-700 active:bg-purple-800"
                            >
                                Xaman (XUMM)
                            </Button>
                        </div>
                        <div className="flex justify-end mt-4">
                            <Button
                                onClick={() => setShowAddWalletModal(false)}
                                disabled={isLoading}
                                className="bg-gray-600 hover:bg-gray-700 active:bg-gray-800 text-sm"
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {showJoeyQrModal && joeyConnectUri && typeof document !== 'undefined' && createPortal(
                <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-black/80 p-4 sm:p-6">
                    <div className="w-full max-w-sm rounded-xl bg-neutral-900 p-6 shadow-xl border border-white/10">
                        <h3 className="text-white text-lg font-semibold mb-2">Scan With Joey Wallet</h3>
                        <p className="text-sm text-white/70 mb-4">
                            Open Joey Wallet on your phone and scan this QR code to continue.
                        </p>

                        <div className="mx-auto mb-4 w-fit rounded-lg bg-white p-3">
                            <img
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(joeyConnectUri)}`}
                                alt="Joey Wallet connection QR code"
                                className="h-56 w-56"
                            />
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            {joeyDeepLink ? (
                                <a
                                    href={joeyDeepLink}
                                    className="inline-flex items-center justify-center rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
                                >
                                    Open Joey App
                                </a>
                            ) : (
                                <div />
                            )}
                            <Button
                                onClick={() => void handleCancelJoeyQr()}
                                className="bg-gray-600 hover:bg-gray-700 active:bg-gray-800 text-sm"
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            <Button
                onClick={() => {
                    clearWalletToasts();
                    setShowAddWalletModal(true);
                }}
                disabled={isLoading || isWalletConnectPending}
                className="w-full text-center bg-blue-600 hover:bg-blue-700 active:bg-blue-800"
            >
                {isWalletConnectPending ? (
                    'Connecting...'
                ) : wallets.length > 0 ? (
                    'Add Another Wallet'
                ) : (
                    'Connect Wallet'
                )}
            </Button>

            {wallets.length > 0 && connectedWallet && (
                <div className={`mt-4 rounded-lg border border-white/10 bg-black/20 p-4 ${shouldUseSummaryMinHeight ? 'min-h-[300px]' : ''}`}>
                    {isAssetsLoading ? (
                        <p className="hidden text-white/60 text-sm">Loading wallet summary...</p>
                    ) : assetsError ? (
                        <p className="text-red-300 text-sm">Wallet summary unavailable: {assetsError}</p>
                    ) : connectedWalletAssets ? (
                        <div className="space-y-3 text-sm text-white/85">
                            <div className="flex items-start justify-between gap-3">
                                <p>
                                    NFTs Found: <span className="font-semibold text-white">{connectedWalletAssets.nft_count}</span>
                                    {' - Click the '}
                                    <span className="mx-1 inline-flex h-5 w-5 items-center justify-center rounded-full border border-black/55 bg-black text-white/85 align-middle">
                                        <FontAwesomeIcon icon={faThumbtack} className="text-[10px]" />
                                    </span>
                                    {' to pin an NFT to the XoloGlobe'}
                                </p>
                                <button
                                    type="button"
                                    onClick={() => void refreshConnectedWalletAssets()}
                                    disabled={!connectedWallet || isAssetsLoading || isLoading}
                                    title="Refresh connected wallet summary"
                                    className="inline-flex h-7 w-7 items-center justify-center cursor-pointer rounded-md border border-white/20 bg-white/15 text-white/70 hover:bg-white/10 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <FontAwesomeIcon
                                        icon={faArrowsRotate}
                                        className={`cursor-pointer ${isAssetsLoading ? 'animate-spin' : ''}`.trim()}
                                    />
                                    <span className="sr-only">Refresh connected wallet summary</span>
                                </button>
                            </div>

                            <NftGallery
                                nftCount={connectedWalletAssets.nft_count}
                                nfts={connectedWalletAssets.nfts}
                                walletAddress={connectedWalletAssets.wallet_address}
                                isLoading={isLoading}
                                auth0Id={auth0Id}
                                accessToken={accessToken}
                            />
                        </div>
                    ) : (
                        <p className="text-white/50 text-sm">No wallet summary available.</p>
                    )}
                </div>
            )}

            {isInteractionBlocked && (
                <div className="absolute inset-0 z-40 flex items-center justify-center rounded-lg bg-black/55 backdrop-blur-[1px]">
                    <div className="inline-flex items-center gap-2 rounded-md border border-white/20 bg-black/75 px-3 py-2 text-sm text-white">
                        <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                        <span>{loadingLabel}</span>
                    </div>
                </div>
            )}
        </div>
    );
}

export function WalletConnection({ auth0Id, accessToken, onWalletsUpdated }: WalletConnectionProps) {
    const joeyProjectId = (import.meta.env.VITE_JOEY_PROJECT_ID || walletConnectProjectId || '717dec7dead15d3a101d504ed3933709').trim();
    const appUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
    const [isJoeyProviderReady, setIsJoeyProviderReady] = useState(!import.meta.env.DEV);

    useEffect(() => {
        if (!import.meta.env.DEV) {
            return;
        }

        // In React StrictMode (dev only), mount/unmount cycles happen twice.
        // Delay provider mount by one macrotask so Joey Core initializes only on the stable mount.
        const timer = window.setTimeout(() => {
            setIsJoeyProviderReady(true);
        }, 0);

        return () => {
            window.clearTimeout(timer);
        };
    }, []);

    const joeyProviderConfig = useMemo(() => ({
        projectId: joeyProjectId,
        defaultChain: defaultJoeyChain,
        metadata: {
            name: 'Donovan',
            description: 'Donovan Joey wallet connection',
            url: appUrl,
            icons: [`${appUrl}/favicon.ico`],
            redirect: {
                universal: appUrl,
            },
        },
    }), [appUrl, joeyProjectId]);

    if (!isJoeyProviderReady) {
        return null;
    }

    return (
        <joeyStandalone.provider.Provider config={joeyProviderConfig}>
            <WalletConnectionContent auth0Id={auth0Id} accessToken={accessToken} onWalletsUpdated={onWalletsUpdated} />
        </joeyStandalone.provider.Provider>
    );
}

export default WalletConnection;
