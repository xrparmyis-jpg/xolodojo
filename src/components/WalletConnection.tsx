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
    const NFTS_PER_PAGE = 24;
    const [wallets, setWallets] = useState<Wallet[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [connectedWalletAssets, setConnectedWalletAssets] = useState<WalletAssetSummary | null>(null);
    const [isAssetsLoading, setIsAssetsLoading] = useState(false);
    const [assetsError, setAssetsError] = useState<string | null>(null);
    const [currentNftPage, setCurrentNftPage] = useState(1);
    const [copiedWalletId, setCopiedWalletId] = useState<number | null>(null);
    const [failedNftThumbnails, setFailedNftThumbnails] = useState<Record<string, boolean>>({});
    const [resolvedNftThumbnails, setResolvedNftThumbnails] = useState<Record<string, string | null>>({});

    const ipfsGateways = useMemo(
        () => [
            'https://ipfs.io/ipfs/',
            'https://gateway.pinata.cloud/ipfs/',
            'https://cloudflare-ipfs.com/ipfs/',
        ],
        []
    );

    const nftDebugEnabled = useMemo(() => {
        if (typeof window === 'undefined') {
            return false;
        }
        const query = new URLSearchParams(window.location.search);
        return import.meta.env.DEV || query.get('nftDebug') === '1';
    }, []);

    const debugNft = useCallback((message: string, payload?: unknown) => {
        if (!nftDebugEnabled) {
            return;
        }
        if (payload === undefined) {
            console.log(`[NFT DEBUG] ${message}`);
            return;
        }
        console.log(`[NFT DEBUG] ${message}`, payload);
    }, [nftDebugEnabled]);

    const getProxiedUrl = useCallback((url: string, mode: 'json' | 'binary' = 'binary'): string => {
        const encodedUrl = encodeURIComponent(url);
        const debugParam = nftDebugEnabled ? '&debug=1' : '';
        return `/api/user/nft-resource-proxy?mode=${mode}&url=${encodedUrl}${debugParam}`;
    }, [nftDebugEnabled]);

    const decodeHexUri = (value: string): string => {
        const trimmed = value.trim();
        const isHexEncoded = /^[0-9a-fA-F]+$/.test(trimmed) && trimmed.length % 2 === 0;

        if (!isHexEncoded) {
            return trimmed;
        }

        try {
            const bytes = new Uint8Array(trimmed.length / 2);
            for (let i = 0; i < trimmed.length; i += 2) {
                bytes[i / 2] = parseInt(trimmed.slice(i, i + 2), 16);
            }
            return new TextDecoder().decode(bytes).replace(/\0+$/, '').trim();
        } catch {
            return trimmed;
        }
    };

    const getIpfsPath = (uri: string): string | null => {
        if (uri.startsWith('ipfs://ipfs/')) {
            return uri.slice('ipfs://ipfs/'.length);
        }
        if (uri.startsWith('ipfs://')) {
            return uri.slice('ipfs://'.length);
        }
        return null;
    };

    const encodePathSegment = (segment: string): string => {
        try {
            return encodeURIComponent(decodeURIComponent(segment));
        } catch {
            return encodeURIComponent(segment);
        }
    };

    const encodePathPreservingSlashes = (path: string): string =>
        path
            .split('/')
            .map((segment) => encodePathSegment(segment))
            .join('/');

    const normalizeHttpUrl = (urlValue: string): string => {
        try {
            const preSanitized = urlValue.trim().replace(/ /g, '%20').replace(/#/g, '%23');
            const parsed = new URL(preSanitized);
            parsed.pathname = encodePathPreservingSlashes(parsed.pathname);
            return parsed.toString();
        } catch {
            return urlValue.trim();
        }
    };

    const getStorageUrlCandidates = (uri: string): string[] => {
        const ipfsPath = getIpfsPath(uri);
        if (ipfsPath) {
            const encodedIpfsPath = encodePathPreservingSlashes(ipfsPath);
            return ipfsGateways.map((gateway) => `${gateway}${encodedIpfsPath}`);
        }
        if (uri.startsWith('ar://')) {
            const arPath = encodePathPreservingSlashes(uri.slice('ar://'.length));
            return [`https://arweave.net/${arPath}`];
        }
        if (isHttpUrl(uri)) {
            return [normalizeHttpUrl(uri)];
        }
        return [uri.trim()];
    };

    const isHttpUrl = (value: string): boolean => /^https?:\/\//i.test(value);
    const isJsonUrl = (value: string): boolean => /\.json($|\?)/i.test(value);

    const getDirectNftThumbnailCandidates = (uri: string | null): string[] => {
        if (!uri) {
            return [];
        }

        const decoded = decodeHexUri(uri);
        if (!decoded) {
            return [];
        }

        if (decoded.startsWith('data:image/')) {
            return [decoded];
        }

        const candidates = getStorageUrlCandidates(decoded).filter((candidate) => {
            if (!isHttpUrl(candidate)) {
                return false;
            }
            return !isJsonUrl(candidate);
        });

        return Array.from(new Set(candidates));
    };

    const getMetadataUrlCandidates = (uri: string | null): string[] => {
        if (!uri) {
            return [];
        }

        const decoded = decodeHexUri(uri);
        if (!decoded) {
            return [];
        }

        const candidates = getStorageUrlCandidates(decoded).filter((candidate) => {
            if (!isHttpUrl(candidate)) {
                return false;
            }
            return isJsonUrl(candidate);
        });

        return Array.from(new Set(candidates));
    };

    const pickImageFromMetadata = (metadata: unknown): string | null => {
        if (!metadata || typeof metadata !== 'object') {
            return null;
        }

        const metadataRecord = metadata as Record<string, unknown>;
        const possibleImageValues = [
            metadataRecord.image,
            metadataRecord.image_url,
            metadataRecord.thumbnail,
            metadataRecord.thumbnail_url,
            metadataRecord.cover_image,
            metadataRecord.content,
            (metadataRecord.properties as Record<string, unknown> | undefined)?.image,
        ];

        for (const value of possibleImageValues) {
            if (typeof value !== 'string' || !value.trim()) {
                continue;
            }

            const candidates = getStorageUrlCandidates(value.trim());
            const imageCandidate = candidates.find((candidate) =>
                candidate.startsWith('data:image/') || (isHttpUrl(candidate) && !isJsonUrl(candidate))
            );

            if (imageCandidate) {
                return imageCandidate;
            }
        }

        return null;
    };

    const resolveThumbnailFromMetadata = useCallback(async (uri: string | null): Promise<string | null> => {
        const metadataUrls = getMetadataUrlCandidates(uri);
        debugNft('Metadata URL candidates', { uri, metadataUrls });

        for (const metadataUrl of metadataUrls) {
            try {
                const response = await fetch(getProxiedUrl(metadataUrl, 'json'), { method: 'GET' });
                debugNft('Metadata fetch response', {
                    metadataUrl,
                    ok: response.ok,
                    status: response.status,
                });
                if (!response.ok) {
                    continue;
                }

                const metadata = (await response.json()) as unknown;
                const resolvedImage = pickImageFromMetadata(metadata);
                debugNft('Resolved image from metadata', {
                    metadataUrl,
                    resolvedImage,
                });
                if (resolvedImage) {
                    return resolvedImage;
                }
            } catch (error) {
                debugNft('Metadata fetch failed', {
                    metadataUrl,
                    error: error instanceof Error ? error.message : String(error),
                });
                continue;
            }
        }

        debugNft('No image resolved from metadata', { uri });
        return null;
    }, [debugNft, getProxiedUrl]);

    const getNftThumbnailUrl = (tokenId: string, uri: string | null): string | null => {
        const resolved = resolvedNftThumbnails[tokenId];
        if (resolved !== undefined) {
            return resolved;
        }

        const directCandidates = getDirectNftThumbnailCandidates(uri);
        return directCandidates[0] || null;
    };

    const getNftThumbnailSrc = (url: string | null): string | null => {
        if (!url) {
            return null;
        }

        if (url.startsWith('data:image/')) {
            return url;
        }

        if (url.startsWith('/api/user/nft-resource-proxy?')) {
            return url;
        }

        if (isHttpUrl(url)) {
            return getProxiedUrl(url, 'binary');
        }

        return null;
    };

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
            setMessage({ type: 'error', text: 'Failed to load wallets' });
        } finally {
            setIsLoading(false);
        }
    }, [accessToken, auth0Id, onWalletsUpdated]);

    // Load wallets on mount
    useEffect(() => {
        void loadWallets();
    }, [loadWallets]);

    const handleConnectXaman = async (walletIdToConnect?: number) => {
        try {
            setMessage(null);
            setIsLoading(true);

            if (!isXamanConfigured()) {
                setMessage({
                    type: 'error',
                    text: 'Xaman is not configured. Set VITE_XAMAN_API_KEY and restart the app.',
                });
                return;
            }

            const xrplAddress = await authorizeXamanAccount();
            const normalizedXrplAddress = xrplAddress.toLowerCase();

            if (walletIdToConnect != null) {
                const targetWallet = wallets.find((wallet) => wallet.id === walletIdToConnect);
                if (!targetWallet) {
                    setMessage({ type: 'error', text: 'Wallet not found' });
                    return;
                }

                if (targetWallet.wallet_address.toLowerCase() !== normalizedXrplAddress) {
                    setMessage({
                        type: 'error',
                        text: 'Scanned Xaman account does not match the selected wallet address.',
                    });
                    return;
                }

                if (connectedWallet && connectedWallet.id !== targetWallet.id) {
                    await tryDisconnectCurrentWallet(connectedWallet);
                }
                await connectWallet(auth0Id, targetWallet.id, accessToken);
                await loadWallets();
                setMessage({ type: 'success', text: 'Xaman wallet connected' });
                setTimeout(() => setMessage(null), 3000);
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
                setMessage({ type: 'success', text: 'Xaman wallet connected' });
                setTimeout(() => setMessage(null), 3000);
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
            setMessage({ type: 'success', text: 'Xaman wallet added and connected!' });
            setTimeout(() => setMessage(null), 3000);
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            console.error('Failed to connect Xaman wallet:', err);
            const normalizedMessage = err.message.toLowerCase();
            if (
                normalizedMessage.includes('access_denied') ||
                normalizedMessage.includes('invalid client') ||
                normalizedMessage.includes('redirect')
            ) {
                setMessage({
                    type: 'error',
                    text: `Xaman rejected the redirect URL. In apps.xumm.dev, add this exact Redirect URL: ${getXamanRedirectUrl()}`,
                });
            } else {
                setMessage({ type: 'error', text: `Failed to connect Xaman: ${err.message}` });
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleDisconnect = async () => {
        try {
            setMessage(null);
            setIsLoading(true);
            if (connectedWallet?.wallet_type === 'xaman') {
                await clearXamanSession();
            }
            // Then disconnect at the database level
            await disconnectWallet(auth0Id, accessToken);
            setMessage({ type: 'success', text: 'Wallet disconnected' });
            await loadWallets();
            setTimeout(() => setMessage(null), 3000);
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            console.error('Failed to disconnect wallet:', err);
            setMessage({ type: 'error', text: `Failed to disconnect: ${err.message}` });
        } finally {
            setIsLoading(false);
        }
    };

    const handleConnectExisting = async (walletId: number) => {
        try {
            setMessage(null);
            setIsLoading(true);

            const wallet = wallets.find((currentWallet) => currentWallet.id === walletId);
            if (!wallet) {
                setMessage({ type: 'error', text: 'Wallet not found' });
                return;
            }

            if (wallet.wallet_type === 'xaman') {
                await handleConnectXaman(wallet.id);
                return;
            }

            setMessage({
                type: 'error',
                text: 'Only Xaman wallets can be connected. Re-add this wallet with Xaman.',
            });
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            console.error('Failed to connect existing wallet:', err);
            setMessage({ type: 'error', text: `Failed to connect wallet: ${err.message}` });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (walletId: number) => {
        try {
            setMessage(null);
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
            setMessage({ type: 'success', text: 'Wallet deleted successfully' });
            await loadWallets();
            setTimeout(() => setMessage(null), 3000);
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            console.error('Failed to delete wallet:', err);
            setMessage({ type: 'error', text: `Failed to delete wallet: ${err.message}` });
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
            setMessage({ type: 'error', text: 'Failed to copy wallet address' });
            setTimeout(() => setMessage(null), 3000);
        }
    };

    const connectedWallet = wallets.find(w => w.is_connected);

    const refreshConnectedWalletAssets = useCallback(async () => {
        if (!connectedWallet) {
            setConnectedWalletAssets(null);
            setAssetsError(null);
            setIsAssetsLoading(false);
            setResolvedNftThumbnails({});
            setFailedNftThumbnails({});
            return;
        }

        try {
            setIsAssetsLoading(true);
            setAssetsError(null);
            setResolvedNftThumbnails({});
            setFailedNftThumbnails({});
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

    useEffect(() => {
        setCurrentNftPage(1);
    }, [connectedWallet?.id, connectedWalletAssets?.wallet_address]);

    useEffect(() => {
        setFailedNftThumbnails({});
    }, [connectedWalletAssets?.wallet_address, currentNftPage]);

    useEffect(() => {
        setResolvedNftThumbnails({});
    }, [connectedWalletAssets?.wallet_address]);

    const getConnectionChannel = (walletType: string) => {
        if (walletType === 'xaman') {
            return 'Mobile';
        }
        return 'Web';
    };

    // Stable order by date added (oldest first) so list doesn't jump when connecting/disconnecting
    const sortedWallets = useMemo(
        () => [...wallets].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
        [wallets]
    );

    const totalNftPages = useMemo(() => {
        const nftCount = connectedWalletAssets?.nft_count || 0;
        return Math.max(1, Math.ceil(nftCount / NFTS_PER_PAGE));
    }, [NFTS_PER_PAGE, connectedWalletAssets?.nft_count]);

    const paginatedNfts = useMemo(() => {
        if (!connectedWalletAssets?.nfts?.length) {
            return [];
        }
        const start = (currentNftPage - 1) * NFTS_PER_PAGE;
        const end = start + NFTS_PER_PAGE;
        return connectedWalletAssets.nfts.slice(start, end);
    }, [NFTS_PER_PAGE, connectedWalletAssets?.nfts, currentNftPage]);

    useEffect(() => {
        let cancelled = false;

        const resolveCurrentPageThumbnails = async () => {
            const updates: Record<string, string | null> = {};

            await Promise.all(
                paginatedNfts.map(async (nft) => {
                    if (resolvedNftThumbnails[nft.token_id] !== undefined) {
                        debugNft('Thumbnail already resolved in cache', {
                            tokenId: nft.token_id,
                            resolved: resolvedNftThumbnails[nft.token_id],
                        });
                        return;
                    }

                    const directCandidates = getDirectNftThumbnailCandidates(nft.uri);
                    const metadataCandidates = getMetadataUrlCandidates(nft.uri);
                    debugNft('Resolving NFT thumbnail', {
                        tokenId: nft.token_id,
                        uri: nft.uri,
                        directCandidates,
                        metadataCandidates,
                    });

                    if (directCandidates.length > 0) {
                        updates[nft.token_id] = directCandidates[0];
                        debugNft('Using direct thumbnail candidate', {
                            tokenId: nft.token_id,
                            thumbnail: directCandidates[0],
                        });
                        return;
                    }

                    const metadataImage = await resolveThumbnailFromMetadata(nft.uri);
                    updates[nft.token_id] = metadataImage;
                    debugNft('Using metadata-derived thumbnail', {
                        tokenId: nft.token_id,
                        thumbnail: metadataImage,
                    });
                })
            );

            if (!cancelled && Object.keys(updates).length > 0) {
                setResolvedNftThumbnails((current) => ({
                    ...current,
                    ...updates,
                }));
            }
        };

        if (paginatedNfts.length > 0) {
            debugNft('Resolving thumbnails for current page', {
                page: currentNftPage,
                nftCount: paginatedNfts.length,
            });
            void resolveCurrentPageThumbnails();
        }

        return () => {
            cancelled = true;
        };
    }, [currentNftPage, debugNft, paginatedNfts, resolveThumbnailFromMetadata, resolvedNftThumbnails]);

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

            {message && (
                <div
                    className={`mb-4 p-3 rounded-lg ${message.type === 'success'
                        ? 'bg-green-900/50 text-green-200'
                        : 'bg-red-900/50 text-red-200'
                        }`}
                >
                    {message.text}
                </div>
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
                    setMessage(null);
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
                                XRP Balance: <span className="font-semibold text-white">{connectedWalletAssets.xrp_balance ?? 'N/A'}</span><br />
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

                        {connectedWalletAssets.nft_count > 0 && (
                            <div className="rounded-md border border-white/10 bg-black/20 p-3">
                                <div className="flex flex-wrap gap-3">
                                    {paginatedNfts.map((nft) => (
                                        <div key={nft.token_id} className="rounded bg-white/[0.03] p-2">
                                            {(() => {
                                                const thumbnailUrl = getNftThumbnailUrl(nft.token_id, nft.uri);
                                                const thumbnailSrc = getNftThumbnailSrc(thumbnailUrl);
                                                const thumbnailFailed = failedNftThumbnails[nft.token_id];

                                                if (nftDebugEnabled) {
                                                    console.log('[NFT DEBUG] Render thumbnail', {
                                                        tokenId: nft.token_id,
                                                        uri: nft.uri,
                                                        thumbnailUrl,
                                                        thumbnailSrc,
                                                        thumbnailFailed,
                                                    });
                                                }

                                                if (!thumbnailSrc || thumbnailFailed) {
                                                    return (
                                                        <div className="h-[200px] w-[200px] rounded border border-white/10 bg-white/5" />
                                                    );
                                                }

                                                return (
                                                    <img
                                                        src={thumbnailSrc}
                                                        alt="NFT thumbnail"
                                                        className="h-[200px] w-[200px] rounded border border-white/10 object-cover"
                                                        loading="lazy"
                                                        onError={(event) => {
                                                            debugNft('Image load error', {
                                                                tokenId: nft.token_id,
                                                                src: event.currentTarget.currentSrc || event.currentTarget.src,
                                                                originalUri: nft.uri,
                                                            });
                                                            setFailedNftThumbnails((current) => ({
                                                                ...current,
                                                                [nft.token_id]: true,
                                                            }));
                                                        }}
                                                    />
                                                );
                                            })()}
                                        </div>
                                    ))}
                                </div>

                                {totalNftPages > 1 && (
                                    <div className="mt-3 flex justify-end text-xs text-white/70">
                                        <div className="flex items-center gap-2">
                                            <Button
                                                onClick={() => setCurrentNftPage((page) => Math.max(1, page - 1))}
                                                disabled={currentNftPage <= 1 || isLoading}
                                                className="bg-gray-700 hover:bg-gray-600 active:bg-gray-500 text-xs px-3 py-1"
                                            >
                                                Prev
                                            </Button>
                                            <Button
                                                onClick={() => setCurrentNftPage((page) => Math.min(totalNftPages, page + 1))}
                                                disabled={currentNftPage >= totalNftPages || isLoading}
                                                className="bg-gray-700 hover:bg-gray-600 active:bg-gray-500 text-xs px-3 py-1"
                                            >
                                                Next
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
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
