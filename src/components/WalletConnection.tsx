import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAccount } from 'wagmi';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { useDisconnect as useWagmiDisconnect } from 'wagmi';
// import { joeyHandler } from '../walletHandlers/joey';
import { standalone as joeyStandalone } from '@joey-wallet/wc-client/react';
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
import { xamanHandler } from '../walletHandlers/xaman';
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
import { useJoeyWalletConnect } from '../hooks/useJoeyWalletConnect';
import { useXaman2WalletConnect } from '../hooks/useXaman2WalletConnect';

interface WalletConnectionProps {
    auth0Id: string;
    accessToken?: string;
    onWalletsUpdated?: (wallets: Wallet[]) => void;
}



function WalletConnectionContent({ auth0Id, accessToken, onWalletsUpdated }: WalletConnectionProps) {
    const { showToast, clearToasts } = useToast();
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
                await handleConnectJoey();
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
    const myWalletsRef = useRef<HTMLDivElement | null>(null);
    const { open } = useWeb3Modal();
    const { address: wagmiAddress, isConnected: isWagmiConnected, connector: wagmiConnector } = useAccount();
    // Joey Wallet: use custom hook for connection logic (must be after showToast is defined)
    const {
        isJoeyConnectPending,
        showJoeyQrModal,
        joeyConnectUri,
        joeyDeepLink,
        connect: handleConnectJoey,
        cancel: handleCancelJoeyQr,
    } = useJoeyWalletConnect({ showToast });

    // Xaman2 Wallet: use custom hook for modal-based connection
    const {
        isXaman2ConnectPending,
        showXaman2QrModal,
        xaman2ConnectUri,
        xaman2DeepLink,
        connect: handleConnectXaman2,
        cancel: handleCancelXaman2Qr,
    } = useXaman2WalletConnect({ showToast });

    const [wallets, setWallets] = useState<Wallet[]>([]);
    const [isLoading, setIsLoading] = useState(false);
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
                await disconnectWallet(auth0Id, accessToken);
            } catch (error) {
                console.warn('Best-effort disconnect failed, continuing with new connection:', error);
            }
        },
        [accessToken, auth0Id, showToast]
    );

    const { mutateAsync: wagmiDisconnectAsync } = useWagmiDisconnect();

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

    // Memoize handler args after all dependencies are declared
    const xamanHandlerArgs = useMemo(() => ({
        auth0Id,
        accessToken,
        wallets,
        setIsLoading,
        setShowToast: showToast,
        loadWallets,
        repairWalletAddressIfNeeded,
        tryDisconnectCurrentWallet,
        connectWallet,
        addWallet,
        showToast,
        setWallets,
        onWalletsUpdated,
        getUserWallets,
        connectedWallet: wallets.find((w) => w.is_connected && w.wallet_type === 'xaman'),
    }), [auth0Id, accessToken, wallets, setIsLoading, showToast, loadWallets, repairWalletAddressIfNeeded, tryDisconnectCurrentWallet, connectWallet, addWallet, setWallets, onWalletsUpdated, getUserWallets]);

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


    // Xaman redirect recovery can be handled in the handler if needed, or here if you want to keep the logic

    const handleConnectXaman = async (walletIdToConnect?: number) => {
        clearWalletToasts();
        await xamanHandler.connect({ ...xamanHandlerArgs, walletIdToConnect });
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
                    // Joey Wallet disconnect is now handled by joeyHandler
                } else if (walletToDelete.wallet_type === 'xaman') {

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

            {/* Xaman2 Modal */}
            {showXaman2QrModal && xaman2ConnectUri && typeof document !== 'undefined' && createPortal(
                <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-black/80 p-4 sm:p-6">
                    <div className="w-full max-w-sm rounded-xl bg-neutral-900 p-6 shadow-xl border border-white/10">
                        <h3 className="text-white text-lg font-semibold mb-2">Scan With Xaman Wallet</h3>
                        <p className="text-sm text-white/70 mb-4">
                            Open Xaman Wallet on your phone and scan this QR code to continue.
                        </p>

                        <div className="mx-auto mb-4 w-fit rounded-lg bg-white p-3">
                            <img
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(xaman2ConnectUri)}`}
                                alt="Xaman Wallet connection QR code"
                                className="h-56 w-56"
                            />
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            {xaman2DeepLink ? (
                                <a
                                    href={xaman2DeepLink}
                                    className="inline-flex items-center justify-center rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
                                >
                                    Open Xaman App
                                </a>
                            ) : (
                                <div />
                            )}
                            <Button
                                onClick={() => void handleCancelXaman2Qr()}
                                className="bg-gray-600 hover:bg-gray-700 active:bg-gray-800 text-sm"
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {showAddWalletModal && typeof document !== 'undefined' && createPortal(
                (() => {
                    // Determine which wallet types the user already has
                    const walletTypes = wallets.map(w => w.wallet_type);
                    const offeredWallets = [
                        { type: 'walletconnect', label: 'WalletConnect', color: 'bg-[#0988F0] hover:bg-[#0666b3] active:bg-[#054a7a]', onClick: () => void handleSelectWalletType('walletconnect') },
                        { type: 'joey', label: 'Joey Wallet', color: 'bg-[#F76807] hover:bg-[#c94e06] active:bg-[#a13d04]', onClick: () => { setShowAddWalletModal(false); void handleConnectJoey(); } },
                        { type: 'xaman', label: 'Xaman (XUMM)', color: 'bg-[#0030CF] hover:bg-[#002399] active:bg-[#001966]', onClick: () => void handleSelectWalletType('xaman') },
                        { type: 'xaman2', label: 'Xaman2 (Modal)', color: 'bg-[#0030CF] hover:bg-[#002399] active:bg-[#001966]', onClick: () => { setShowAddWalletModal(false); void handleConnectXaman2(); } },
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
                                                disabled={isLoading}
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
                                        disabled={isLoading}
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
            <WalletConnectionContent auth0Id={auth0Id} accessToken={accessToken} onWalletsUpdated={onWalletsUpdated} />
        </joeyStandalone.provider.Provider>
    );
}

export default WalletConnection;
