import { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useAccount } from 'wagmi';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { useDisconnect as useWagmiDisconnect } from 'wagmi';
import { standalone as joeyStandalone } from '@joey-wallet/wc-client/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faArrowsRotate,
    faCopy,
    faLink,
    faLinkSlash,
    faSpinner,
    faThumbtack,
    faXmark,
} from '@fortawesome/free-solid-svg-icons';
import Button from './Button';
import ModalConfirm from './ModalConfirm';
import NftGallery from './NftGallery';
import { useToast } from './ToastProvider';
import { walletConnectProjectId } from '../web3modal';
import { xamanHandler } from '../walletHandlers/xaman';
import type { Wallet } from '../services/walletService';
import {
    addWallet,
    connectWallet,
    disconnectWallet,
    deleteWallet,
    getUserWallets,
    mergeWalletIntoList,
    updateWalletAddress,
} from '../services/walletService';
import {
    getWalletAssetSummary,
    type WalletAssetSummary,
} from '../services/walletAssetService';
import { useJoeyWalletConnect } from '../hooks/useJoeyWalletConnect';
import { useJoeyWalletPersistence } from '../hooks/useJoeyWalletPersistence';
import { JoeyWalletQrModal } from './joey/JoeyWalletQrModal';
import { LOADING_WALLET_SUMMARY_MESSAGE } from '../constants/walletUiMessages';
import { clearJoeyConnectIntent } from '../wallets/joey/joeyConnectIntent';

interface WalletConnectionProps {
    auth0Id: string;
    accessToken?: string;
    onWalletsUpdated?: (wallets: Wallet[]) => void;
    // When true (e.g. after Xaman redirect on mobile), auto-attempt a Xaman connect once on mount
    resumeXamanOnMount?: boolean;
}



function WalletConnectionContent({ auth0Id, accessToken, onWalletsUpdated, resumeXamanOnMount }: WalletConnectionProps) {
    const { showToast, clearToasts } = useToast();

    const { open } = useWeb3Modal();
    const { address: wagmiAddress, isConnected: isWagmiConnected, connector: wagmiConnector } = useAccount();

    const [wallets, setWallets] = useState<Wallet[]>([]);
    /** Specific overlay text for wallet operations (load, connect, disconnect, remove, etc.) */
    const [walletBusyMessage, setWalletBusyMessage] = useState<string | null>(null);
    const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showAddWalletModal, setShowAddWalletModal] = useState(false);
    const [isWalletConnectPending, setIsWalletConnectPending] = useState(false);
    const [pendingWalletConnectId, setPendingWalletConnectId] = useState<number | null>(null);

    const [connectedWalletAssets, setConnectedWalletAssets] = useState<WalletAssetSummary | null>(null);
    const [isAssetsLoading, setIsAssetsLoading] = useState(false);
    const [assetsError, setAssetsError] = useState<string | null>(null);
    const [copiedWalletId, setCopiedWalletId] = useState<number | null>(null);
    const [hasAttemptedXamanSessionRepair, setHasAttemptedXamanSessionRepair] = useState(false);
    const [hasResumedXamanOnMount, setHasResumedXamanOnMount] = useState(false);

    const {
        isJoeyConnectPending,
        showJoeyQrModal,
        joeyConnectUri,
        joeyDeepLink,
        connect: handleConnectJoey,
        cancel: handleCancelJoeyQr,
        account: joeyAccount,
        session: joeySession,
        disconnectFromProvider: disconnectJoeyFromProvider,
    } = useJoeyWalletConnect({
        showToast,
        onConnectStart: () => setWalletBusyMessage('Waiting for Joey Wallet…'),
        onConnectError: () => setWalletBusyMessage(null),
    });

    const clearWalletToasts = useCallback(() => {
        clearToasts();
    }, [clearToasts]);

    const repairWalletAddressIfNeeded = useCallback(async (
        wallet: Wallet,
        resolvedAddress: string
    ): Promise<Wallet> => {
        if ((wallet.wallet_type !== 'xaman' && wallet.wallet_type !== 'joey') || wallet.wallet_address === resolvedAddress) {
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
                    await xamanHandler.disconnect({ setShowToast: showToast });
                }
                if (currentWallet.wallet_type === 'joey') {
                    clearJoeyConnectIntent();
                    await disconnectJoeyFromProvider();
                }
                await disconnectWallet(auth0Id, accessToken);
            } catch (error) {
                console.warn('Best-effort disconnect failed, continuing with new connection:', error);
            }
        },
        [accessToken, auth0Id, showToast, disconnectJoeyFromProvider]
    );

    const { mutateAsync: wagmiDisconnectAsync } = useWagmiDisconnect();

    const loadWallets = useCallback(async (opts?: { silent?: boolean }) => {
        const silent = opts?.silent === true;
        try {
            if (!silent) {
                setWalletBusyMessage('Loading wallets...');
            }
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
            const err = error instanceof Error ? error : new Error(String(error));
            showToast('error', `Failed to load wallets: ${err.message}`);
        } finally {
            if (!silent) {
                setWalletBusyMessage(null);
            }
            //setHasAttemptedInitialWalletLoad(true);
        }
    }, [accessToken, auth0Id, onWalletsUpdated, showToast]);

    /** Apply connect API row immediately so the list updates before the silent refetch finishes. */
    const applyConnectedWalletFromApi = useCallback(
        (connectedRow: Wallet) => {
            setWallets((prev) => {
                const next = mergeWalletIntoList(prev, connectedRow);
                onWalletsUpdated?.(next);
                return next;
            });
        },
        [onWalletsUpdated]
    );

    const handleDisconnectExisting = useCallback(async (walletId: number) => {
        const wallet = wallets.find((currentWallet) => currentWallet.id === walletId);
        if (!wallet) {
            showToast('error', 'Wallet not found');
            return;
        }

        try {
            clearWalletToasts();
            setWalletBusyMessage('Disconnecting wallet...');

            // Disconnect provider/session where applicable
            if (wallet.wallet_type === 'walletconnect') {
                await wagmiDisconnectAsync();
            }

            await tryDisconnectCurrentWallet(wallet);
            await loadWallets({ silent: true });
            showToast('success', 'Wallet disconnected');
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            console.error('Failed to disconnect wallet:', err);
            showToast('error', `Failed to disconnect wallet: ${err.message}`);
        } finally {
            setWalletBusyMessage(null);
        }
    }, [wallets, showToast, clearWalletToasts, wagmiDisconnectAsync, tryDisconnectCurrentWallet, loadWallets]);

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

    useJoeyWalletPersistence({
        showJoeyQrModal,
        joeyAccount,
        joeySession: joeySession,
        wallets,
        auth0Id,
        accessToken,
        loadWallets,
        applyConnectedWalletFromApi,
        setWalletBusyMessage,
        showToast,
    });

    // Load wallets on mount
    useEffect(() => {
        void loadWallets();
    }, [loadWallets]);

    // Memoize handler args after all dependencies are declared
    const xamanHandlerArgs = useMemo(() => ({
        auth0Id,
        accessToken,
        wallets,
        setWalletBusyMessage,
        setShowToast: showToast,
        loadWallets,
        applyConnectedWalletFromApi,
        repairWalletAddressIfNeeded,
        tryDisconnectCurrentWallet,
        connectWallet,
        addWallet,
        showToast,
        setWallets,
        onWalletsUpdated,
        getUserWallets,
        connectedWallet: wallets.find((w) => w.is_connected && w.wallet_type === 'xaman'),
    }), [auth0Id, accessToken, wallets, showToast, loadWallets, applyConnectedWalletFromApi, repairWalletAddressIfNeeded, tryDisconnectCurrentWallet, connectWallet, addWallet, setWallets, onWalletsUpdated, getUserWallets]);

    useEffect(() => {
        const repairConnectedXamanWallet = async () => {
            if (hasAttemptedXamanSessionRepair) return;
            await xamanHandler.repair?.({ ...xamanHandlerArgs, setShowToast: showToast });
            setHasAttemptedXamanSessionRepair(true);
        };
        void repairConnectedXamanWallet();
    }, [hasAttemptedXamanSessionRepair, xamanHandlerArgs, showToast]);

    useEffect(() => {
        const syncWalletConnectSession = async () => {
            if (!isWalletConnectPending || !isWagmiConnected || !wagmiAddress) {
                return;
            }

            try {
                setWalletBusyMessage('Connecting with WalletConnect...');

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

                    const connectResPending = await connectWallet(auth0Id, existingWallet.id, accessToken);
                    if (connectResPending.wallet) {
                        applyConnectedWalletFromApi(connectResPending.wallet);
                    }
                    await loadWallets({ silent: true });
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
                    const connectResExisting = await connectWallet(auth0Id, existingWallet.id, accessToken);
                    if (connectResExisting.wallet) {
                        applyConnectedWalletFromApi(connectResExisting.wallet);
                    }
                    await loadWallets({ silent: true });
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
                    const connectResNew = await connectWallet(auth0Id, result.wallet.id, accessToken);
                    if (connectResNew.wallet) {
                        applyConnectedWalletFromApi(connectResNew.wallet);
                    }
                }

                await loadWallets({ silent: true });
                showToast('success', 'WalletConnect wallet added and connected!');
            } catch (error) {
                const err = error instanceof Error ? error : new Error(String(error));
                console.error('Failed to sync WalletConnect session:', err);
                showToast('error', `Failed to connect wallet: ${err.message}`);
            } finally {
                setPendingWalletConnectId(null);
                setIsWalletConnectPending(false);
                setWalletBusyMessage(null);
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
        applyConnectedWalletFromApi,
    ]);


    // Xaman redirect recovery: pass resumeFromRedirect so PKCE state polling runs even after
    // Profile strips ?xaman_return=1 from the URL (otherwise polling never activated).

    const handleConnectXaman = useCallback(
        async (walletIdToConnect?: number, opts?: { resumeFromRedirect?: boolean }) => {
            clearWalletToasts();
            const resumeFromRedirect = opts?.resumeFromRedirect === true;
            // eslint-disable-next-line no-console
            console.log('[WalletConnection][Xaman] handleConnectXaman', {
                walletIdToConnect: walletIdToConnect ?? null,
                resumeFromRedirect,
            });
            await xamanHandler.connect({
                ...xamanHandlerArgs,
                walletIdToConnect,
                resumeFromRedirect,
            });
        },
        [xamanHandlerArgs]
    );

    const handleConnectExisting = useCallback(
        async (walletId: number) => {
            let walletKind: string | undefined;
            try {
                clearWalletToasts();

                const wallet = wallets.find((currentWallet) => currentWallet.id === walletId);
                if (!wallet) {
                    showToast('error', 'Wallet not found');
                    return;
                }
                walletKind = wallet.wallet_type;

                if (wallet.wallet_type === 'xaman') {
                    setWalletBusyMessage('Connecting to Xaman...');
                    await handleConnectXaman(wallet.id);
                    return;
                }

                if (wallet.wallet_type === 'joey') {
                    // Overlay: onConnectStart → "Waiting…", then persistence → "Saving Joey wallet…"
                    await handleConnectJoey();
                    return;
                }

                if (wallet.wallet_type === 'walletconnect') {
                    if (!walletConnectProjectId) {
                        showToast('error', 'WalletConnect is not configured. Set VITE_WALLETCONNECT_PROJECT_ID and restart the app.');
                        return;
                    }

                    setWalletBusyMessage('Opening WalletConnect...');
                    await open({ view: 'Connect' });
                    setPendingWalletConnectId(wallet.id);
                    setIsWalletConnectPending(true);
                    return;
                }

                setWalletBusyMessage('Connecting wallet...');
                const res = await connectWallet(auth0Id, walletId, accessToken);
                if (res.wallet) {
                    applyConnectedWalletFromApi(res.wallet);
                }
                await loadWallets({ silent: true });
                showToast('success', 'Wallet connected');
            } catch (error) {
                const err = error instanceof Error ? error : new Error(String(error));
                console.error('Failed to connect existing wallet:', err);
                showToast('error', `Failed to connect wallet: ${err.message}`);
                setWalletBusyMessage(null);
            } finally {
                if (walletKind !== 'joey') {
                    setWalletBusyMessage(null);
                }
            }
        },
        [
            auth0Id,
            accessToken,
            applyConnectedWalletFromApi,
            clearWalletToasts,
            connectWallet,
            handleConnectJoey,
            handleConnectXaman,
            loadWallets,
            open,
            showToast,
            wallets,
        ]
    );

    // After Xaman mobile redirect: wait for Auth0 access token before hitting the API (add/connect wallet).
    useEffect(() => {
        if (!resumeXamanOnMount || hasResumedXamanOnMount) return;
        if (!accessToken) {
            // eslint-disable-next-line no-console
            console.log('[WalletConnection][Xaman] resume waiting for access token');
            return;
        }
        setHasResumedXamanOnMount(true);
        // eslint-disable-next-line no-console
        console.log('[WalletConnection][Xaman] resume: calling connect with resumeFromRedirect');
        void handleConnectXaman(undefined, { resumeFromRedirect: true });
    }, [resumeXamanOnMount, hasResumedXamanOnMount, accessToken, handleConnectXaman]);

    const handleDelete = async (walletId: number) => {
        try {
            clearWalletToasts();
            setWalletBusyMessage('Removing wallet...');

            // Check if this is the connected wallet
            const walletToDelete = wallets.find(w => w.id === walletId);
            if (!walletToDelete) {
                showToast('error', 'Wallet not found');
                setWalletBusyMessage(null);
                return;
            }
            if (walletToDelete.is_connected) {
                if (walletToDelete.wallet_type === 'walletconnect') {
                    await wagmiDisconnectAsync();
                }
                await tryDisconnectCurrentWallet(walletToDelete);
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
            await loadWallets({ silent: true });
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            console.error('Failed to delete wallet:', err);
            showToast('error', `Failed to delete wallet: ${err.message}`);
        } finally {
            setWalletBusyMessage(null);
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
            // End Xaman "summary" bridge if we never ran a fetch (e.g. brief null wallet).
            setWalletBusyMessage((prev) =>
                prev === LOADING_WALLET_SUMMARY_MESSAGE ? null : prev
            );
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
            // Clear overlay copy set by xamanHandler when the summary request completes.
            setWalletBusyMessage((prev) =>
                prev === LOADING_WALLET_SUMMARY_MESSAGE ? null : prev
            );
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

    const overlayMessage =
        walletBusyMessage
        ?? (isAssetsLoading ? LOADING_WALLET_SUMMARY_MESSAGE : null)
        ?? (isJoeyConnectPending ? 'Connecting to Joey Wallet…' : null)
        ?? (isWalletConnectPending ? 'Connecting to wallet...' : null);
    const isInteractionBlocked = overlayMessage !== null;
    const shouldUseSummaryMinHeight = isAssetsLoading || ((connectedWalletAssets?.nft_count ?? 0) > 0);

    return (
        <div className="relative w-full p-6 bg-black/30 rounded-lg mt-4">
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
                                    {!wallet.is_connected ? (
                                        <button
                                            type="button"
                                            title="Connect wallet"
                                            className="cursor-pointer flex items-center justify-center w-8 h-8 rounded-full bg-green-700 hover:bg-green-800 text-white text-lg"
                                            onClick={() => handleConnectExisting(wallet.id)}
                                        >
                                            <FontAwesomeIcon icon={faLink} />
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            title="Disconnect wallet"
                                            className="cursor-pointer flex items-center justify-center w-8 h-8 rounded-full bg-yellow-600 hover:bg-yellow-700 text-white text-lg"
                                            onClick={() => void handleDisconnectExisting(wallet.id)}
                                        >
                                            <FontAwesomeIcon icon={faLinkSlash} />
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
                loading={walletBusyMessage !== null}
                onCancel={() => {
                    setShowDeleteModal(false);
                    setPendingDeleteId(null);
                }}
                onConfirm={handleConfirmDelete}
            />

            {showAddWalletModal && typeof document !== 'undefined' && createPortal(
                (() => {
                    // Determine which wallet types the user already has
                    const walletTypes = wallets.map(w => w.wallet_type);
                    const offeredWallets = [
                        { type: 'walletconnect', label: 'WalletConnect', color: 'bg-[#0988F0] hover:bg-[#0666b3] active:bg-[#054a7a]', onClick: () => void handleSelectWalletType('walletconnect') },
                        { type: 'joey', label: 'Joey Wallet', color: 'bg-[#F76807] hover:bg-[#c94e06] active:bg-[#a13d04]', onClick: () => { setShowAddWalletModal(false); void handleConnectJoey(); } },
                        { type: 'xaman', label: 'Xaman (XUMM)', color: 'bg-[#0030CF] hover:bg-[#002399] active:bg-[#001966]', onClick: () => void handleSelectWalletType('xaman') },
                    ];
                    // Only show wallet types not already added
                    const availableWallets = offeredWallets.filter(w => !walletTypes.includes(w.type));
                    return (
                        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/75 p-4 sm:p-6">
                            <div className="w-full max-w-sm rounded-xl bg-neutral-900 p-6 shadow-xl border border-white/10">
                                <h3 className="text-white text-lg font-semibold mb-2">Add New Wallet</h3>
                                <p className="text-sm text-white/70 mb-4">Select the wallet type you want to add.</p>
                                <div className="grid grid-cols-1 gap-3">
                                    {availableWallets.length === 0 ? (
                                        <div className="text-white/70 text-center py-4">All wallet types have been added.</div>
                                    ) : (
                                        availableWallets.map(w => (
                                            <Button
                                                key={w.type}
                                                onClick={w.onClick}
                                                disabled={walletBusyMessage !== null}
                                                className={`w-full ${w.color}`}
                                            >
                                                {w.label}
                                            </Button>
                                        ))
                                    )}
                                </div>
                                <div className="flex justify-end mt-4">
                                    <Button
                                        onClick={() => setShowAddWalletModal(false)}
                                        disabled={walletBusyMessage !== null}
                                        className="bg-gray-600 hover:bg-gray-700 active:bg-gray-800 text-sm"
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        </div>
                    );
                })(),
                document.body
            )}

            <JoeyWalletQrModal
                open={showJoeyQrModal}
                connectionUri={joeyConnectUri}
                deepLink={joeyDeepLink}
                onCancel={handleCancelJoeyQr}
            />

            <Button
                onClick={() => {
                    clearWalletToasts();
                    setShowAddWalletModal(true);
                }}
                disabled={walletBusyMessage !== null || isWalletConnectPending}
                className="w-full text-center bg-blue-600 hover:bg-blue-700 active:bg-blue-800"
            >
                {isWalletConnectPending ? (
                    'Opening WalletConnect...'
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
                                    disabled={!connectedWallet || isAssetsLoading || walletBusyMessage !== null}
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
                                isLoading={isInteractionBlocked}
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
                        <span>{overlayMessage}</span>
                    </div>
                </div>
            )}
        </div>
    );
}

export function WalletConnection({ auth0Id, accessToken, onWalletsUpdated, resumeXamanOnMount }: WalletConnectionProps) {

    // Joey Wallet provider config
    const joeyProjectId = (import.meta.env.VITE_JOEY_PROJECT_ID || walletConnectProjectId || '717dec7dead15d3a101d504ed3933709').trim();
    const appUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
    const joeyProviderConfig = useMemo(() => ({
        projectId: joeyProjectId,
        defaultChain: 'xrpl:0',
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

    return (
        <joeyStandalone.provider.Provider config={joeyProviderConfig}>
            <WalletConnectionContent
                auth0Id={auth0Id}
                accessToken={accessToken}
                onWalletsUpdated={onWalletsUpdated}
                resumeXamanOnMount={resumeXamanOnMount}
            />
        </joeyStandalone.provider.Provider>
    );
}

export default WalletConnection;
