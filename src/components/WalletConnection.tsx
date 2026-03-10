import { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useAccount, useDisconnect as useWagmiDisconnect } from 'wagmi';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faArrowsRotate,
    faCheck,
    faCopy,
    faLink,
    faLinkSlash,
    faSpinner,
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

const walletConnectTimeoutMs = Number(import.meta.env.VITE_WALLETCONNECT_CONNECT_TIMEOUT_MS || 60000);

function WalletConnectionContent({ auth0Id, accessToken, onWalletsUpdated }: WalletConnectionProps) {
    const { open } = useWeb3Modal();
    const { address: wagmiAddress, isConnected: isWagmiConnected } = useAccount();
    const { mutateAsync: wagmiDisconnectAsync } = useWagmiDisconnect();
    const [wallets, setWallets] = useState<Wallet[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showAddWalletModal, setShowAddWalletModal] = useState(false);
    const [isWalletConnectPending, setIsWalletConnectPending] = useState(false);
    const [pendingWalletConnectId, setPendingWalletConnectId] = useState<number | null>(null);
    const [isXamanRedirectRecoveryDone, setIsXamanRedirectRecoveryDone] = useState(false);
    const [connectedWalletAssets, setConnectedWalletAssets] = useState<WalletAssetSummary | null>(null);
    const [isAssetsLoading, setIsAssetsLoading] = useState(false);
    const [assetsError, setAssetsError] = useState<string | null>(null);
    const [copiedWalletId, setCopiedWalletId] = useState<number | null>(null);
    const { showToast } = useToast();

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
            const result = await getUserWallets(auth0Id, accessToken);
            if (result.success) {
                setWallets(result.wallets || []);
                onWalletsUpdated?.(result.wallets || []);
            }
        } catch (error) {
            console.error('Failed to load wallets:', error);
            showToast('error', 'Failed to load wallets');
        } finally {
            setIsLoading(false);
        }
    }, [accessToken, auth0Id, onWalletsUpdated, showToast]);

    // Load wallets on mount
    useEffect(() => {
        void loadWallets();
    }, [loadWallets]);

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

                const result = await addWallet(auth0Id, normalizedAddress, 'walletconnect', accessToken);
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
        tryDisconnectCurrentWallet,
        wagmiAddress,
        wallets,
        loadWallets,
        showToast,
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

                const normalizedXrplAddress = xrplAddress.toLowerCase();
                const latestWalletsResult = await getUserWallets(auth0Id, accessToken);
                const latestWallets = latestWalletsResult.success ? latestWalletsResult.wallets || [] : [];

                const currentConnectedWallet = latestWallets.find((wallet) => wallet.is_connected);
                const existingWallet = latestWallets.find(
                    (wallet) => wallet.wallet_address.toLowerCase() === normalizedXrplAddress
                );

                if (existingWallet) {
                    if (currentConnectedWallet && currentConnectedWallet.id !== existingWallet.id) {
                        await tryDisconnectCurrentWallet(currentConnectedWallet);
                    }
                    await connectWallet(auth0Id, existingWallet.id, accessToken);
                    await loadWallets();
                    showToast('success', 'Xaman wallet connected');
                    return;
                }

                const result = await addWallet(auth0Id, xrplAddress, 'xaman', accessToken);
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

    useEffect(() => {
        if (!isWalletConnectPending || isWagmiConnected) {
            return;
        }

        const timeout = setTimeout(() => {
            setPendingWalletConnectId(null);
            setIsWalletConnectPending(false);
            showToast('error', 'WalletConnect request timed out. Please try again.');
        }, walletConnectTimeoutMs);

        return () => clearTimeout(timeout);
    }, [isWalletConnectPending, isWagmiConnected, showToast]);

    const handleConnectXaman = async (walletIdToConnect?: number) => {
        try {
            setIsLoading(true);

            if (!isXamanConfigured()) {
                showToast('error', 'Xaman is not configured. Set VITE_XAMAN_API_KEY and restart the app.');
                return;
            }

            const xrplAddress = await authorizeXamanAccount();
            const normalizedXrplAddress = xrplAddress.toLowerCase();

            if (walletIdToConnect != null) {
                const targetWallet = wallets.find((wallet) => wallet.id === walletIdToConnect);
                if (!targetWallet) {
                    showToast('error', 'Wallet not found');
                    return;
                }

                if (targetWallet.wallet_address.toLowerCase() !== normalizedXrplAddress) {
                    showToast('error', 'Scanned Xaman account does not match the selected wallet address.');
                    return;
                }

                if (connectedWallet && connectedWallet.id !== targetWallet.id) {
                    await tryDisconnectCurrentWallet(connectedWallet);
                }
                await connectWallet(auth0Id, targetWallet.id, accessToken);
                await loadWallets();
                showToast('success', 'Xaman wallet connected');
                return;
            }

            const existingWallet = wallets.find(
                (wallet) => wallet.wallet_address.toLowerCase() === normalizedXrplAddress
            );

            if (existingWallet) {
                if (connectedWallet && connectedWallet.id !== existingWallet.id) {
                    await tryDisconnectCurrentWallet(connectedWallet);
                }
                await connectWallet(auth0Id, existingWallet.id, accessToken);
                await loadWallets();
                showToast('success', 'Xaman wallet connected');
                return;
            }

            const result = await addWallet(auth0Id, xrplAddress, 'xaman', accessToken);
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

    const handleDisconnect = async () => {
        try {
            setIsLoading(true);
            if (connectedWallet?.wallet_type === 'walletconnect') {
                await wagmiDisconnectAsync();
            } else if (connectedWallet?.wallet_type === 'xaman') {
                await clearXamanSession();
            }
            // Then disconnect at the database level
            await disconnectWallet(auth0Id, accessToken);
            showToast('success', 'Wallet disconnected');
            await loadWallets();
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            console.error('Failed to disconnect wallet:', err);
            showToast('error', `Failed to disconnect: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleConnectExisting = async (walletId: number) => {
        try {
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
            setIsLoading(true);

            // Check if this is the connected wallet
            const walletToDelete = wallets.find(w => w.id === walletId);
            if (walletToDelete?.is_connected) {
                if (walletToDelete.wallet_type === 'walletconnect') {
                    await wagmiDisconnectAsync();
                } else if (walletToDelete.wallet_type === 'xaman') {
                    await clearXamanSession();
                }
                // Then disconnect at the database level
                await disconnectWallet(auth0Id, accessToken);
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

    const handleConfirmDelete = async () => {
        if (pendingDeleteId == null) return;
        await handleDelete(pendingDeleteId);
        setShowDeleteModal(false);
        setPendingDeleteId(null);
    };

    const handleCopyWalletAddress = async (walletId: number, walletAddress: string) => {
        try {
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

    const connectedWallet = wallets.find(w => w.is_connected);

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

    const getConnectionChannel = (walletType: string) => {
        if (walletType === 'xaman') {
            return 'Mobile';
        }
        return 'Web';
    };

    const sortedWallets = useMemo(
        () => [...wallets].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
        [wallets]
    );

    const isInteractionBlocked = isLoading || isAssetsLoading || isWalletConnectPending;
    const loadingLabel = isAssetsLoading
        ? 'Loading wallet summary...'
        : isWalletConnectPending
            ? 'Connecting wallet...'
            : 'Loading...';
    const shouldUseSummaryMinHeight = isAssetsLoading || ((connectedWalletAssets?.nft_count ?? 0) > 0);

    return (
        <div className="relative w-full p-6 bg-black/30 rounded-lg mt-4">
            <div className="flex justify-between items-center mb-4">
                <h4 className="text-white text-lg">
                    My Wallets {wallets.length > 0 && <span className="text-white/70 text-sm ml-2">({wallets.length})</span>}
                </h4>
            </div>

            {wallets.length > 0 ? (
                <div className="space-y-3 mb-4">
                    {sortedWallets.map((wallet) => (
                        <div
                            key={wallet.id}
                            className={`p-4 rounded-lg border ${wallet.is_connected
                                ? 'bg-green-900/30 border-green-500/60'
                                : 'bg-white/5 border-white/10'
                                }`}
                        >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="text-white font-mono text-sm break-all">
                                            {wallet.wallet_address.slice(0, 6)}...{wallet.wallet_address.slice(-4)}
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => void handleCopyWalletAddress(wallet.id, wallet.wallet_address)}
                                            title={copiedWalletId === wallet.id ? 'Copied' : 'Copy wallet address'}
                                            className="inline-flex h-5 w-5 p-0.5 items-center justify-center rounded border border-blue-600/35 bg-black/35 text-white/85 hover:bg-black/45 hover:text-white"
                                        >
                                            <FontAwesomeIcon
                                                icon={copiedWalletId === wallet.id ? faCheck : faCopy}
                                                className="text-[10px] cursor-pointer"
                                            />
                                            <span className="sr-only">
                                                {copiedWalletId === wallet.id ? '' : 'Copy wallet address'}
                                            </span>
                                        </button>
                                        <span className="text-[10px] h-5 text-green-300 flex items-center">
                                            {copiedWalletId === wallet.id && (
                                                <>Copied</>
                                            )}
                                        </span>
                                    </div>
                                    <div className="mt-2">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span
                                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${wallet.wallet_type === 'xaman'
                                                    ? 'bg-[#0030cf]/90 text-white/90 border border-white/40'
                                                    : wallet.wallet_type === 'walletconnect'
                                                        ? 'bg-emerald-900/60 text-emerald-200 border border-emerald-500/40'
                                                        : 'bg-blue-900/60 text-blue-200 border border-blue-500/40'
                                                    }`}
                                            >
                                                {wallet.wallet_type === 'xaman'
                                                    ? 'Xaman (XUMM)'
                                                    : wallet.wallet_type === 'walletconnect'
                                                        ? 'WalletConnect'
                                                        : wallet.wallet_type}
                                            </span>
                                            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-green-600/70 text-white/80 border border-white/40">
                                                {getConnectionChannel(wallet.wallet_type)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {wallet.is_connected ? (
                                        <>
                                            <Button
                                                onClick={() => handleDisconnect()}
                                                disabled={isLoading}
                                                title="Disconnect wallet"
                                                className="w-8 h-8 p-0 bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-md text-white/85 hover:text-white"
                                            >
                                                <FontAwesomeIcon icon={faLinkSlash} className="cursor-pointer" />
                                                <span className="sr-only">Disconnect wallet</span>
                                            </Button>
                                            <Button
                                                onClick={() => {
                                                    setPendingDeleteId(wallet.id);
                                                    setShowDeleteModal(true);
                                                }}
                                                title="Remove wallet from profile"
                                                disabled={isLoading}
                                                className="cursor-pointer inline-flex h-8 w-8 items-center justify-center rounded-md bg-red-600/60 text-white/85 hover:bg-red-600/40 hover:text-white"
                                            >
                                                <FontAwesomeIcon icon={faXmark} className="cursor-pointer" />
                                                <span className="sr-only">Remove wallet</span>
                                            </Button>
                                        </>
                                    ) : (
                                        <>
                                            <Button
                                                onClick={() => handleConnectExisting(wallet.id)}
                                                disabled={isLoading}
                                                title="Connect wallet"
                                                className="w-8 h-8 p-0 bg-green-600 hover:bg-green-700 active:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed text-md text-white/85 hover:text-white"
                                            >
                                                <FontAwesomeIcon icon={faLink} className="cursor-pointer" />
                                                <span className="sr-only">Connect wallet</span>
                                            </Button>
                                            <Button
                                                onClick={() => {
                                                    setPendingDeleteId(wallet.id);
                                                    setShowDeleteModal(true);
                                                }}
                                                title="Remove wallet from profile"
                                                disabled={isLoading}
                                                className="cursor-pointer inline-flex h-8 w-8 items-center justify-center rounded-md bg-red-600/60 text-white/85 hover:bg-red-600/40 hover:text-white"
                                            >
                                                <FontAwesomeIcon icon={faXmark} className="cursor-pointer" />
                                                <span className="sr-only">Remove wallet</span>
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-white/50 text-center py-4 mb-4">No wallets added yet.</p>
            )}

            <ModalConfirm
                isOpen={showDeleteModal}
                title="Remove wallet?"
                message="This will remove the wallet from your profile. You can always re-add it later by connecting again."
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

            <Button
                onClick={() => {
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
                    'Add New Wallet'
                )}
            </Button>

            <div className={`mt-4 rounded-lg border border-white/10 bg-black/20 p-4 ${shouldUseSummaryMinHeight ? 'min-h-[300px]' : ''}`}>
                {!connectedWallet ? (
                    <p className="text-white/50 text-sm">No wallet currently connected.</p>
                ) : isAssetsLoading ? (
                    <p className="hidden text-white/60 text-sm">Loading wallet summary...</p>
                ) : assetsError ? (
                    <p className="text-red-300 text-sm">Wallet summary unavailable: {assetsError}</p>
                ) : connectedWalletAssets ? (
                    <div className="space-y-3 text-sm text-white/85">
                        <div className="flex items-start justify-between gap-3">
                            <p>
                                NFTs Found: <span className="font-semibold text-white">{connectedWalletAssets.nft_count}</span>
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
    return (
        <WalletConnectionContent auth0Id={auth0Id} accessToken={accessToken} onWalletsUpdated={onWalletsUpdated} />
    );
}

export default WalletConnection;
