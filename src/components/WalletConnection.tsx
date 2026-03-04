import { useState, useEffect, useMemo, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faArrowsRotate,
    faCheck,
    faCopy,
    faLink,
    faLinkSlash,
    faXmark,
} from '@fortawesome/free-solid-svg-icons';
import Button from './Button';
import ConfirmModal from './ConfirmModal';
import NftGallery from './NftGallery';
import { useToast } from './ToastProvider';
import {
    authorizeXamanAccount,
    clearXamanSession,
    getXamanRedirectUrl,
    isXamanConfigured,
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

function WalletConnectionContent({ auth0Id, accessToken, onWalletsUpdated }: WalletConnectionProps) {
    const [wallets, setWallets] = useState<Wallet[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
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
            if (connectedWallet?.wallet_type === 'xaman') {
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

            showToast('error', 'Only Xaman wallets can be connected. Re-add this wallet with Xaman.');
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
                if (walletToDelete.wallet_type === 'xaman') {
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

    return (
        <div className="w-full p-6 bg-black/30 rounded-lg mt-4">
            <div className="flex justify-between items-center mb-4">
                <h4 className="text-white text-lg">
                    My Wallets {wallets.length > 0 && <span className="text-white/70 text-sm ml-2">({wallets.length})</span>}
                </h4>
            </div>

            {/* Wallets List */}
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
                                            className="inline-flex h-5 w-5 p-0.5 items-center justify-center rounded border border-white/35 bg-black/35 text-white/85 hover:bg-black/45 hover:text-white"
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
                                                    ? 'bg-purple-900/60 text-purple-200 border border-purple-500/40'
                                                    : 'bg-blue-900/60 text-blue-200 border border-blue-500/40'
                                                    }`}
                                            >
                                                {wallet.wallet_type === 'xaman'
                                                    ? 'Xaman (XUMM)'
                                                    : wallet.wallet_type}
                                            </span>
                                            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-white/10 text-white/80 border border-white/20">
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
                                                className="w-9 h-9 p-0 bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-xs"
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
                                                className="w-9 h-9 p-0 bg-red-600 hover:bg-red-700 active:bg-red-800 text-xs"
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
                                                className="w-9 h-9 p-0 bg-green-600 hover:bg-green-700 active:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed text-xs"
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
                                                className="w-9 h-9 p-0 bg-red-600 hover:bg-red-700 active:bg-red-800 text-xs"
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

            <ConfirmModal
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

            {/* Add/Connect Wallet Button */}
            <Button
                onClick={() => {
                    void handleConnectXaman();
                }}
                disabled={isLoading}
                className="w-full text-center bg-blue-600 hover:bg-blue-700 active:bg-blue-800"
            >
                {wallets.length > 0 ? (
                    'Add Another Wallet'
                ) : (
                    'Add New Wallet'
                )}
            </Button>

            <div className="mt-4 rounded-lg border border-white/10 bg-black/20 p-4">
                {!connectedWallet ? (
                    <p className="text-white/50 text-sm">No wallet currently connected.</p>
                ) : isAssetsLoading ? (
                    <p className="text-white/60 text-sm">Loading wallet summary...</p>
                ) : assetsError ? (
                    <p className="text-red-300 text-sm">Wallet summary unavailable: {assetsError}</p>
                ) : connectedWalletAssets ? (
                    <div className="space-y-3 text-sm text-white/85">
                        <div className="flex items-start justify-between gap-3">
                            <p>
                                {/* XRP Balance: <span className="font-semibold text-white">{connectedWalletAssets.xrp_balance ?? 'N/A'}</span><br /> */}
                                NFTs Found: <span className="font-semibold text-white">{connectedWalletAssets.nft_count}</span>
                            </p>
                            <button
                                type="button"
                                onClick={() => void refreshConnectedWalletAssets()}
                                disabled={!connectedWallet || isAssetsLoading || isLoading}
                                title="Refresh connected wallet summary"
                                className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-white/20 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
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
        </div>
    );
}

export function WalletConnection({ auth0Id, accessToken, onWalletsUpdated }: WalletConnectionProps) {
    return (
        <WalletConnectionContent auth0Id={auth0Id} accessToken={accessToken} onWalletsUpdated={onWalletsUpdated} />
    );
}

export default WalletConnection;
