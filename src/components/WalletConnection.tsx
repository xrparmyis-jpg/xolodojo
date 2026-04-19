import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAccount } from 'wagmi';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { useDisconnect as useWagmiDisconnect } from 'wagmi';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faArrowsRotate,
    faCopy,
    faLink,
    faLinkSlash,
    faThumbtack,
    faXmark,
} from '@fortawesome/free-solid-svg-icons';
import { walletConnectProjectId } from '../web3modal';
import Button from './Button';
import ModalConfirm from './ModalConfirm';
import NftGallery from './NftGallery';
import { useToast } from './ToastProvider';
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
import { WalletBusyOverlay } from './WalletBusyOverlay';
import {
    CONNECTING_JOEY_WALLET_MESSAGE,
    CONNECTING_WALLET_GENERIC_MESSAGE,
    CONNECTING_WITH_WALLETCONNECT_MESSAGE,
    DISCONNECTING_WALLET_MESSAGE,
    JOEY_WAITING_FOR_WALLET_MESSAGE,
    LOADING_WALLETS_MESSAGE,
    LOADING_WALLET_SUMMARY_MESSAGE,
    OPENING_WALLETCONNECT_MESSAGE,
    REMOVING_WALLET_MESSAGE,
    XAMAN_CONNECTING_MESSAGE,
} from '../constants/walletUiMessages';
import { clearJoeyConnectIntent } from '../wallets/joey/joeyConnectIntent';
import { extractJoeyWalletAddress } from '../wallets/joey/extractJoeyWalletAddress';
import { walletAddressPreview, walletDebugLog, walletTraceLog } from '../utils/walletDebugLog';
import { useAuth } from '../providers/AuthContext';
import { loginWithWallet } from '../lib/authApi';
import type { ProfileSocials } from '../services/profileService';

export type WalletConnectionVariant = 'profile' | 'wallet_auth' | 'wallet_session';

interface WalletConnectionProps {
    onWalletsUpdated?: (wallets: Wallet[]) => void;
    resumeXamanOnMount?: boolean;
    variant?: WalletConnectionVariant;
    onWalletAuthSuccess?: () => void;
    onWalletSessionDisconnect?: () => Promise<void>;
    sessionWalletAddress?: string;
    sessionWalletType?: string;
    profileSocialsForPins?: ProfileSocials;
    syncPinSocialsToProfile?: (socials: ProfileSocials) => void;
}

function WalletConnectionContent({
    onWalletsUpdated,
    resumeXamanOnMount,
    variant = 'profile',
    onWalletAuthSuccess,
    onWalletSessionDisconnect,
    sessionWalletAddress,
    sessionWalletType,
    profileSocialsForPins,
    syncPinSocialsToProfile,
}: WalletConnectionProps) {
    const { showToast, clearToasts } = useToast();
    const { refreshUser } = useAuth();

    const { open } = useWeb3Modal();
    const { address: wagmiAddress, isConnected: isWagmiConnected, connector: wagmiConnector } = useAccount();

    const [wallets, setWallets] = useState<Wallet[]>([]);
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

    const joeyPersistenceSuppressedRef = useRef(false);
    const walletBusyMessageRef = useRef(walletBusyMessage);
    walletBusyMessageRef.current = walletBusyMessage;

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
        onConnectStart: () => setWalletBusyMessage(JOEY_WAITING_FOR_WALLET_MESSAGE),
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
        if (!Number.isFinite(Number(wallet.id)) || Number(wallet.id) <= 0) {
            return { ...wallet, wallet_address: resolvedAddress };
        }
        const result = await updateWalletAddress(wallet.id, resolvedAddress);
        return result.wallet ?? { ...wallet, wallet_address: resolvedAddress };
    }, []);

    const tryDisconnectCurrentWallet = useCallback(
        async (currentWallet?: Wallet | null) => {
            if (!currentWallet) return;
            try {
                if (currentWallet.wallet_type === 'xaman') {
                    await xamanHandler.disconnect({ setShowToast: showToast });
                }
                if (currentWallet.wallet_type === 'joey') {
                    joeyPersistenceSuppressedRef.current = true;
                    clearJoeyConnectIntent();
                    await disconnectJoeyFromProvider();
                }
                await disconnectWallet();
            } catch (error) {
                console.warn('Best-effort disconnect failed, continuing with new connection:', error);
            }
        },
        [showToast, disconnectJoeyFromProvider]
    );

    const { mutateAsync: wagmiDisconnectAsync } = useWagmiDisconnect();

    const runWalletAuthLogin = useCallback(
        async (address: string, walletType: string, opts?: { xamanJwt?: string }) => {
            await loginWithWallet(address, walletType, opts);
            await refreshUser();
            showToast('success', 'Signed in with wallet');
            onWalletAuthSuccess?.();
        },
        [refreshUser, onWalletAuthSuccess, showToast]
    );

    const loadWallets = useCallback(async (opts?: { silent?: boolean }) => {
        if (variant === 'wallet_auth') {
            setWallets([]);
            return;
        }
        if (variant === 'wallet_session') {
            return;
        }
        const silent = opts?.silent === true;
        try {
            if (!silent) {
                setWalletBusyMessage(LOADING_WALLETS_MESSAGE);
            }
            const result = await getUserWallets();
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
        }
    }, [variant, onWalletsUpdated, showToast]);

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
        if (variant === 'wallet_session' && onWalletSessionDisconnect) {
            try {
                clearWalletToasts();
                setWalletBusyMessage(DISCONNECTING_WALLET_MESSAGE);
                await onWalletSessionDisconnect();
            } finally {
                setWalletBusyMessage(null);
            }
            return;
        }

        const wallet = wallets.find((currentWallet) => currentWallet.id === walletId);
        if (!wallet) {
            showToast('error', 'Wallet not found');
            return;
        }

        try {
            clearWalletToasts();
            setWalletBusyMessage(DISCONNECTING_WALLET_MESSAGE);

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
            if (wallet.wallet_type === 'joey') {
                joeyPersistenceSuppressedRef.current = false;
            }
            setWalletBusyMessage(null);
        }
    }, [
        variant,
        onWalletSessionDisconnect,
        wallets,
        showToast,
        clearWalletToasts,
        wagmiDisconnectAsync,
        tryDisconnectCurrentWallet,
        loadWallets,
    ]);

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
        loadWallets,
        applyConnectedWalletFromApi,
        setWalletBusyMessage,
        showToast,
        persistenceSuppressedRef: joeyPersistenceSuppressedRef,
        walletAuthLogin:
            variant === 'wallet_auth'
                ? (address) => runWalletAuthLogin(address, 'joey')
                : undefined,
    });

    /** Fix DB rows saved with lowercased XRPL address (invalid checksum) using SDK-reported casing. */
    const joeyRepairAttemptedForKey = useRef<string | null>(null);
    useEffect(() => {
        const resolved = extractJoeyWalletAddress(joeyAccount, joeySession);
        const joeyRow = wallets.find((w) => w.is_connected && w.wallet_type === 'joey');
        if (!resolved || !joeyRow) {
            return;
        }
        if (resolved === joeyRow.wallet_address) {
            return;
        }
        if (resolved.toLowerCase() !== joeyRow.wallet_address.toLowerCase()) {
            return;
        }
        const key = `${joeyRow.id}:${resolved}`;
        if (joeyRepairAttemptedForKey.current === key) {
            return;
        }
        joeyRepairAttemptedForKey.current = key;
        void (async () => {
            try {
                const repaired = await repairWalletAddressIfNeeded(joeyRow, resolved);
                if (repaired.wallet_address !== joeyRow.wallet_address) {
                    walletTraceLog('Joey: repaired wallet_address checksum casing in DB', {
                        walletId: joeyRow.id,
                        preview: walletAddressPreview(repaired.wallet_address),
                    });
                    await loadWallets({ silent: true });
                }
            } catch (e) {
                joeyRepairAttemptedForKey.current = null;
                console.warn('[Donovan:Wallet] Joey address casing repair failed:', e);
            }
        })();
    }, [joeyAccount, joeySession, wallets, repairWalletAddressIfNeeded, loadWallets]);

    useEffect(() => {
        if (variant === 'wallet_session' && sessionWalletAddress) {
            setWallets([
                {
                    id: 0,
                    user_id: 0,
                    wallet_address: sessionWalletAddress,
                    wallet_type: sessionWalletType || 'wallet',
                    is_connected: true,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                },
            ]);
            return;
        }
        void loadWallets();
    }, [variant, sessionWalletAddress, sessionWalletType, loadWallets]);

    // Memoize handler args after all dependencies are declared
    const xamanHandlerArgs = useMemo(() => ({
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
    }), [wallets, showToast, loadWallets, applyConnectedWalletFromApi, repairWalletAddressIfNeeded, tryDisconnectCurrentWallet, connectWallet, addWallet, setWallets, onWalletsUpdated, getUserWallets]);

    useEffect(() => {
        const repairConnectedXamanWallet = async () => {
            if (variant === 'wallet_session' || variant === 'wallet_auth') {
                return;
            }
            if (hasAttemptedXamanSessionRepair) return;
            await xamanHandler.repair?.({ ...xamanHandlerArgs, setShowToast: showToast });
            setHasAttemptedXamanSessionRepair(true);
        };
        void repairConnectedXamanWallet();
    }, [variant, hasAttemptedXamanSessionRepair, xamanHandlerArgs, showToast]);

    useEffect(() => {
        const syncWalletConnectSession = async () => {
            if (!isWalletConnectPending || !isWagmiConnected || !wagmiAddress) {
                return;
            }

            try {
                setWalletBusyMessage(CONNECTING_WITH_WALLETCONNECT_MESSAGE);

                const normalizedAddress = wagmiAddress.toLowerCase();
                const currentConnectedWallet = wallets.find((wallet) => wallet.is_connected);

                if (variant === 'wallet_auth' && pendingWalletConnectId == null) {
                    try {
                        await runWalletAuthLogin(normalizedAddress, 'walletconnect');
                    } catch (error) {
                        const err = error instanceof Error ? error : new Error(String(error));
                        console.error('Wallet auth (WalletConnect) failed:', err);
                        showToast('error', `Failed to sign in: ${err.message}`);
                    } finally {
                        setPendingWalletConnectId(null);
                        setIsWalletConnectPending(false);
                        setWalletBusyMessage(null);
                    }
                    return;
                }

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

                    const connectResPending = await connectWallet(existingWallet.id);
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
                    const connectResExisting = await connectWallet(existingWallet.id);
                    if (connectResExisting.wallet) {
                        applyConnectedWalletFromApi(connectResExisting.wallet);
                    }
                    await loadWallets({ silent: true });
                    showToast('success', 'Wallet connected');
                    return;
                }

                const walletConnectLabel = await getWalletConnectSessionLabel();
                const result = await addWallet(
                    normalizedAddress,
                    'walletconnect',
                    walletConnectLabel
                );
                if (result.success && result.wallet) {
                    if (currentConnectedWallet) {
                        await tryDisconnectCurrentWallet(currentConnectedWallet);
                    }
                    const connectResNew = await connectWallet(result.wallet.id);
                    if (connectResNew.wallet) {
                        applyConnectedWalletFromApi(connectResNew.wallet);
                    }
                }

                await loadWallets({ silent: true });
                showToast(
                    'success',
                    result.already_exists && result.message
                        ? result.message
                        : 'WalletConnect wallet added and connected!'
                );
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
        variant,
        runWalletAuthLogin,
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

    const handleConnectXaman = useCallback(
        async (walletIdToConnect?: number, opts?: { resumeFromRedirect?: boolean }) => {
            clearToasts();
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
                completeWalletAuth:
                    variant === 'wallet_auth'
                        ? async (addr: string, meta?: { jwt?: string }) => {
                              await runWalletAuthLogin(addr, 'xaman', { xamanJwt: meta?.jwt });
                          }
                        : undefined,
            });
        },
        [xamanHandlerArgs, clearToasts, variant, runWalletAuthLogin]
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
                    setWalletBusyMessage(XAMAN_CONNECTING_MESSAGE);
                    await handleConnectXaman(wallet.id);
                    return;
                }

                if (wallet.wallet_type === 'joey') {
                    // Overlay: onConnectStart → waiting copy, then persistence → saving-your-wallet copy
                    await handleConnectJoey();
                    return;
                }

                if (wallet.wallet_type === 'walletconnect') {
                    if (!walletConnectProjectId) {
                        showToast('error', 'WalletConnect is not configured. Set VITE_WALLETCONNECT_PROJECT_ID and restart the app.');
                        return;
                    }

                    setWalletBusyMessage(OPENING_WALLETCONNECT_MESSAGE);
                    await open({ view: 'Connect' });
                    setPendingWalletConnectId(wallet.id);
                    setIsWalletConnectPending(true);
                    return;
                }

                setWalletBusyMessage(CONNECTING_WALLET_GENERIC_MESSAGE);
                const res = await connectWallet(walletId);
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

    useEffect(() => {
        if (variant === 'wallet_auth') return;
        if (!resumeXamanOnMount || hasResumedXamanOnMount) return;
        setHasResumedXamanOnMount(true);

        void handleConnectXaman(undefined, { resumeFromRedirect: true });
    }, [variant, resumeXamanOnMount, hasResumedXamanOnMount, handleConnectXaman]);

    const handleDelete = async (walletId: number) => {
        const walletToDelete = wallets.find(w => w.id === walletId);
        if (!walletToDelete) {
            showToast('error', 'Wallet not found');
            return;
        }

        try {
            clearWalletToasts();
            setWalletBusyMessage(REMOVING_WALLET_MESSAGE);

            if (walletToDelete.is_connected) {
                if (walletToDelete.wallet_type === 'walletconnect') {
                    await wagmiDisconnectAsync();
                }
                await tryDisconnectCurrentWallet(walletToDelete);
            }

            try {
                const pinnedNfts = await import('../services/pinnedNftService').then((mod) =>
                    mod.getPinnedNfts(walletToDelete.wallet_address)
                );
                for (const nft of pinnedNfts) {
                    await import('../services/pinnedNftService').then((mod) =>
                        mod.unpinNft(nft.token_id, walletToDelete.wallet_address)
                    );
                }
            } catch (err) {
                // Log and continue if pin removal fails
                console.error('Failed to remove pinned NFTs for wallet:', err);
            }

            await deleteWallet(walletId);
            showToast('success', 'Wallet deleted successfully');
            await loadWallets({ silent: true });
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            console.error('Failed to delete wallet:', err);
            showToast('error', `Failed to delete wallet: ${err.message}`);
        } finally {
            if (walletToDelete.wallet_type === 'joey') {
                joeyPersistenceSuppressedRef.current = false;
            }
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
        clearToasts();
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
            walletTraceLog('refresh NFT summary skipped — no row marked is_connected', {
                walletRowsLoaded: wallets.length,
            });
            walletDebugLog('refresh assets skipped (no connected wallet)', {});
            setConnectedWalletAssets(null);
            setAssetsError(null);
            setIsAssetsLoading(false);
            setWalletBusyMessage((prev) =>
                prev === LOADING_WALLET_SUMMARY_MESSAGE ? null : prev
            );
            return;
        }

        const busy = walletBusyMessageRef.current;
        if (busy != null && busy !== LOADING_WALLET_SUMMARY_MESSAGE) {
            walletTraceLog('refresh NFT summary skipped — walletBusyMessage blocks fetch', {
                busyMessage: busy,
                walletType: connectedWallet.wallet_type,
                addressPreview: walletAddressPreview(connectedWallet.wallet_address),
                hint: 'Another operation is running; NFT list loads after it clears.',
            });
            walletDebugLog('refresh assets skipped (other wallet operation in progress)', {
                busyMessage: busy,
                walletType: connectedWallet.wallet_type,
                addressPreview: walletAddressPreview(connectedWallet.wallet_address),
            });
            return;
        }

        walletTraceLog('refresh NFT summary starting', {
            walletId: connectedWallet.id,
            walletType: connectedWallet.wallet_type,
            walletLabel: connectedWallet.wallet_label ?? null,
            addressPreview: walletAddressPreview(connectedWallet.wallet_address),
            addressLength: connectedWallet.wallet_address.length,
        });
        walletDebugLog('refresh assets start', {
            walletId: connectedWallet.id,
            walletType: connectedWallet.wallet_type,
            walletLabel: connectedWallet.wallet_label,
            addressPreview: walletAddressPreview(connectedWallet.wallet_address),
            addressLength: connectedWallet.wallet_address.length,
        });

        try {
            setIsAssetsLoading(true);
            setAssetsError(null);
            const summary = await getWalletAssetSummary(connectedWallet.wallet_address);
            setConnectedWalletAssets(summary);
            walletTraceLog('refresh NFT summary finished (UI will show count)', {
                walletType: connectedWallet.wallet_type,
                nft_count: summary.nft_count,
                is_xrpl: summary.is_xrpl,
                collection_filter_applied: summary.collection_filter_applied,
                xrpl_fetch_failed: summary.xrpl_fetch_failed,
            });
            walletDebugLog('refresh assets done (state updated)', {
                walletType: connectedWallet.wallet_type,
                nft_count: summary.nft_count,
                is_xrpl: summary.is_xrpl,
                collection_filter_applied: summary.collection_filter_applied,
                xrpl_fetch_failed: summary.xrpl_fetch_failed,
            });
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            setConnectedWalletAssets(null);
            setAssetsError(err.message);
            walletTraceLog('refresh NFT summary failed', {
                walletType: connectedWallet.wallet_type,
                addressPreview: walletAddressPreview(connectedWallet.wallet_address),
                message: err.message,
            });
            walletDebugLog('refresh assets error', {
                walletType: connectedWallet.wallet_type,
                addressPreview: walletAddressPreview(connectedWallet.wallet_address),
                message: err.message,
            });
        } finally {
            setIsAssetsLoading(false);
            setWalletBusyMessage((prev) =>
                prev === LOADING_WALLET_SUMMARY_MESSAGE ? null : prev
            );
        }
    }, [connectedWallet, wallets.length]);

    useEffect(() => {
        if (!connectedWallet) {
            return;
        }
        walletTraceLog('App wallet row marked connected', {
            walletId: connectedWallet.id,
            walletType: connectedWallet.wallet_type,
            is_connected: connectedWallet.is_connected,
            addressPreview: walletAddressPreview(connectedWallet.wallet_address),
        });
    }, [
        connectedWallet?.id,
        connectedWallet?.wallet_type,
        connectedWallet?.wallet_address,
        connectedWallet?.is_connected,
    ]);

    useEffect(() => {
        if (wallets.length === 0) {
            return;
        }
        const anyConnected = wallets.some((w) => w.is_connected);
        if (!anyConnected) {
            walletTraceLog('You have saved wallet(s) but none is_connected — NFT block will not load', {
                wallets: wallets.map((w) => ({
                    id: w.id,
                    type: w.wallet_type,
                    is_connected: w.is_connected,
                    preview: walletAddressPreview(w.wallet_address),
                })),
            });
        }
    }, [wallets]);

    useEffect(() => {
        void refreshConnectedWalletAssets();
    }, [refreshConnectedWalletAssets, walletBusyMessage]);

    const sortedWallets = useMemo(
        () => [...wallets].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
        [wallets]
    );

    const overlayMessage =
        walletBusyMessage
        ?? (isAssetsLoading ? LOADING_WALLET_SUMMARY_MESSAGE : null)
        ?? (isJoeyConnectPending ? CONNECTING_JOEY_WALLET_MESSAGE : null)
        ?? (isWalletConnectPending ? CONNECTING_WALLET_GENERIC_MESSAGE : null);
    const isInteractionBlocked = overlayMessage !== null;
    const shouldUseSummaryMinHeight = isAssetsLoading || ((connectedWalletAssets?.nft_count ?? 0) > 0);

    return (
        <div className="relative w-full p-6 bg-black/30 rounded-lg mt-4">
            {wallets.length > 0 && (
                <div className="flex justify-between items-center mb-4">
                    <h4 className="text-white text-lg">
                        {variant === 'wallet_session' ? 'My Wallet' : 'My Wallets'}
                    </h4>
                </div>
            )}
            {wallets.length > 0 && (
                <div className="space-y-3 mb-4">
                    {sortedWallets.map((wallet) => {
                        const rawAddress = typeof wallet.wallet_address === 'string' ? wallet.wallet_address : '';
                        const truncatedAddress = rawAddress.length > 12
                            ? `${rawAddress.slice(0, 6)}...${rawAddress.slice(-6)}`
                            : rawAddress || '—';

                        const wType = typeof wallet.wallet_type === 'string' ? wallet.wallet_type : '';
                        let walletLabel = wallet.wallet_label;
                        if (!walletLabel) {
                            if (wType === 'xaman') {
                                walletLabel = 'Xaman (XUMM)';
                            } else if (wType === 'joey') {
                                walletLabel = 'Joey Wallet';
                            } else if (wType.length > 0) {
                                walletLabel = wType.charAt(0).toUpperCase() + wType.slice(1);
                            } else {
                                walletLabel = 'Wallet';
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
                                            onClick={() => {
                                                if (rawAddress) {
                                                    void handleCopyWalletAddress(wallet.id, rawAddress);
                                                }
                                            }}
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
                                    {variant !== 'wallet_session' && (
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
                                    )}
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
                    `This will remove the wallet from your profile, you can always re-add it later by connecting again.\n\nAny NFTs in this wallet that are pinned on the Xglobe will also be removed.`
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
                    const offeredWallets = [
                        { type: 'walletconnect', label: 'WalletConnect', color: 'bg-[#0988F0] hover:bg-[#0666b3] active:bg-[#054a7a]', onClick: () => void handleSelectWalletType('walletconnect') },
                        { type: 'joey', label: 'Joey Wallet', color: 'bg-[#F76807] hover:bg-[#c94e06] active:bg-[#a13d04]', onClick: () => { clearToasts(); setShowAddWalletModal(false); void handleConnectJoey(); } },
                        { type: 'xaman', label: 'Xaman (XUMM)', color: 'bg-[#0030CF] hover:bg-[#002399] active:bg-[#001966]', onClick: () => void handleSelectWalletType('xaman') },
                    ];
                    return (
                        <div className="fixed inset-0 z-[1100] flex items-center justify-center overflow-y-auto bg-black/75 p-4 sm:p-6">
                            <div className="w-full max-w-sm rounded-xl bg-neutral-900 p-6 shadow-xl border border-white/10">
                                <h3 className="text-white text-lg font-semibold mb-2">Add New Wallet</h3>
                                <p className="text-sm text-white/70 mb-4">Select the wallet type you want to add. You can add multiple accounts per type (for example, several Xaman accounts).</p>
                                <div className="grid grid-cols-1 gap-3">
                                    {offeredWallets.map(w => (
                                        <Button
                                            key={w.type}
                                            onClick={w.onClick}
                                            disabled={walletBusyMessage !== null}
                                            className={`w-full ${w.color}`}
                                        >
                                            {w.label}
                                        </Button>
                                    ))}
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

            {variant === 'wallet_auth' && (
                <Button
                    onClick={() => {
                        clearToasts();
                        setShowAddWalletModal(true);
                    }}
                    disabled={walletBusyMessage !== null || isWalletConnectPending}
                    className="w-full text-center bg-blue-600 hover:bg-blue-700 active:bg-blue-800"
                >
                    {isWalletConnectPending ? OPENING_WALLETCONNECT_MESSAGE : 'Choose Wallet'}
                </Button>
            )}
            {variant !== 'wallet_session' && variant !== 'wallet_auth' && (
                <Button
                    onClick={() => {
                        clearToasts();
                        setShowAddWalletModal(true);
                    }}
                    disabled={walletBusyMessage !== null || isWalletConnectPending}
                    className="w-full text-center bg-blue-600 hover:bg-blue-700 active:bg-blue-800"
                >
                    {isWalletConnectPending ? (
                        OPENING_WALLETCONNECT_MESSAGE
                    ) : wallets.length > 0 ? (
                        'Add Another Wallet'
                    ) : (
                        'Connect Wallet'
                    )}
                </Button>
            )}

            {wallets.length > 0 && connectedWallet && (
                <div className={`mt-4 rounded-lg border border-white/10 bg-black/20 p-4 ${shouldUseSummaryMinHeight ? 'min-h-[300px]' : ''}`}>
                    {isAssetsLoading ? (
                        <p className="hidden text-white/60 text-sm">{LOADING_WALLET_SUMMARY_MESSAGE}</p>
                    ) : assetsError ? (
                        <p className="text-red-300 text-sm">Wallet summary unavailable: {assetsError}</p>
                    ) : connectedWalletAssets ? (
                        <div className="space-y-3 text-sm text-white/85">
                            <div className="flex items-start justify-between gap-3">
                                <p>
                                    NFTs Found: <span className="font-semibold text-white">{connectedWalletAssets.nft_count}</span>
                                    {' — Click the '}
                                    <span
                                        className="mx-1 inline-flex align-middle translate-y-[2px] xologlobe-pin-thumbtack-btn xologlobe-pin-thumbtack-btn--pinned"
                                        aria-hidden
                                    >
                                        <FontAwesomeIcon icon={faThumbtack} aria-hidden />
                                    </span>
                                    <span className="sr-only">thumbtack icon</span>
                                    {' '}to pin each Xolo to the Xglobe. Click on each Xolo for more details.
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
                                profileSocialsForPins={profileSocialsForPins}
                                syncPinSocialsToProfile={syncPinSocialsToProfile}
                            />
                        </div>
                    ) : (
                        <p className="text-white/50 text-sm">No wallet summary available.</p>
                    )}
                </div>
            )}

            <WalletBusyOverlay message={isInteractionBlocked ? overlayMessage : null} />
        </div>
    );
}

export function WalletConnection(props: WalletConnectionProps) {
    return <WalletConnectionContent {...props} />;
}

export default WalletConnection;
