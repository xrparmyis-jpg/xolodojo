import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faCopy, faSpinner, faThumbtack } from '@fortawesome/free-solid-svg-icons';
import Button from './Button';
import Modal from './Modal';
import ConfirmModal from './ConfirmModal';
import NftPinLocationMap from './NftPinLocationMap';
import { useToast } from './ToastProvider';
import type { WalletAssetSummary } from '../services/walletAssetService';
import { getPinnedNfts, pinNft, unpinNft } from '../services/pinnedNftService';

interface NftGalleryProps {
    nftCount: number;
    nfts: WalletAssetSummary['nfts'];
    walletAddress?: string;
    isLoading: boolean;
    auth0Id: string;
    accessToken?: string;
}

export default function NftGallery({ nftCount, nfts, walletAddress, isLoading, auth0Id, accessToken }: NftGalleryProps) {
    const NFTS_PER_PAGE = 12;
    const [currentNftPage, setCurrentNftPage] = useState(1);
    const [failedNftThumbnails, setFailedNftThumbnails] = useState<Record<string, boolean>>({});
    const [loadedNftThumbnails, setLoadedNftThumbnails] = useState<Record<string, boolean>>({});
    const [resolvedNftThumbnails, setResolvedNftThumbnails] = useState<Record<string, string | null>>({});
    const [resolvedNftTitles, setResolvedNftTitles] = useState<Record<string, string | null>>({});
    const [resolvedNftCollections, setResolvedNftCollections] = useState<Record<string, string | null>>({});
    const [collectionFallbackTokens, setCollectionFallbackTokens] = useState<Record<string, boolean>>({});
    const [selectedNftTokenId, setSelectedNftTokenId] = useState<string | null>(null);
    const [copiedFieldKey, setCopiedFieldKey] = useState<string | null>(null);
    const [pinnedTokenIds, setPinnedTokenIds] = useState<string[]>([]);
    const [pinTargetTokenId, setPinTargetTokenId] = useState<string | null>(null);
    const [pinFlowStep, setPinFlowStep] = useState<'instructions' | 'submit'>('instructions');
    const [pendingUnpinTokenId, setPendingUnpinTokenId] = useState<string | null>(null);
    const [isPinActionLoading, setIsPinActionLoading] = useState(false);
    const [isSelectedNftImageLoaded, setIsSelectedNftImageLoaded] = useState(false);
    const [pinLocation, setPinLocation] = useState<{ lng: number; lat: number } | null>(null);
    const { showToast } = useToast();
    const metadataResultCacheRef = useRef<Partial<Record<string, { url: string | null; isCollectionFallback: boolean; title: string | null; collectionName: string | null } | null>>>({});
    const metadataRequestCacheRef = useRef<Partial<Record<string, Promise<{ url: string | null; isCollectionFallback: boolean; title: string | null; collectionName: string | null } | null>>>>({});

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
        return query.get('nftDebug') === '1';
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

    const isHttpUrl = (value: string): boolean => /^https?:\/\//i.test(value);
    const isJsonUrl = (value: string): boolean => /\.json($|\?)/i.test(value);

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

    const resolveImageCandidate = (value: unknown): string | null => {
        if (typeof value !== 'string' || !value.trim()) {
            return null;
        }

        const candidates = getStorageUrlCandidates(value.trim());
        return candidates.find((candidate) =>
            candidate.startsWith('data:image/') || (isHttpUrl(candidate) && !isJsonUrl(candidate))
        ) || null;
    };

    const deriveCollectionNameFromTitle = (title: string | null): string | null => {
        if (!title) {
            return null;
        }

        const cleaned = title
            .replace(/\s*#\d+$/i, '')
            .replace(/\s+\d+$/i, '')
            .trim();

        return cleaned || null;
    };

    const pickNftDetailsFromMetadata = (metadata: unknown): { url: string | null; isCollectionFallback: boolean; title: string | null; collectionName: string | null } | null => {
        if (!metadata || typeof metadata !== 'object') {
            return null;
        }

        const metadataRecord = metadata as Record<string, unknown>;
        const collectionRecord = metadataRecord.collection as Record<string, unknown> | undefined;
        const titleCandidates = [
            metadataRecord.name,
            metadataRecord.title,
            metadataRecord.token_name,
            metadataRecord.nft_name,
            (metadataRecord.properties as Record<string, unknown> | undefined)?.name,
        ];
        const propertiesRecord = metadataRecord.properties as Record<string, unknown> | undefined;
        const collectionNameCandidates = [
            metadataRecord.collection_name,
            metadataRecord.collection_title,
            collectionRecord?.name,
            collectionRecord?.title,
            propertiesRecord?.collection,
            propertiesRecord?.collection_name,
            (propertiesRecord?.collection as Record<string, unknown> | undefined)?.name,
        ];

        const title = titleCandidates.find((value): value is string => typeof value === 'string' && value.trim().length > 0)?.trim() || null;
        const metadataCollectionName = collectionNameCandidates.find((value): value is string => typeof value === 'string' && value.trim().length > 0)?.trim() || null;
        const collectionName = metadataCollectionName || deriveCollectionNameFromTitle(title);

        const directImageValues = [
            metadataRecord.image,
            metadataRecord.image_url,
            metadataRecord.thumbnail,
            metadataRecord.thumbnail_url,
            metadataRecord.cover_image,
            metadataRecord.content,
            (metadataRecord.properties as Record<string, unknown> | undefined)?.image,
        ];

        for (const value of directImageValues) {
            const imageCandidate = resolveImageCandidate(value);
            if (imageCandidate) {
                return {
                    url: imageCandidate,
                    isCollectionFallback: false,
                    title,
                    collectionName,
                };
            }
        }

        const collectionImageValues = [
            metadataRecord.collection_image,
            metadataRecord.collection_thumbnail,
            collectionRecord?.image,
            collectionRecord?.image_url,
            collectionRecord?.thumbnail,
            collectionRecord?.cover,
        ];

        for (const value of collectionImageValues) {
            const imageCandidate = resolveImageCandidate(value);
            if (imageCandidate) {
                return {
                    url: imageCandidate,
                    isCollectionFallback: true,
                    title,
                    collectionName,
                };
            }
        }

        if (title || collectionName) {
            return {
                url: null,
                isCollectionFallback: false,
                title,
                collectionName,
            };
        }

        return null;
    };

    const resolveNftDetailsFromMetadata = useCallback(async (uri: string | null): Promise<{ url: string | null; isCollectionFallback: boolean; title: string | null; collectionName: string | null } | null> => {
        if (!uri) {
            return null;
        }

        const normalizedUri = decodeHexUri(uri);
        if (!normalizedUri) {
            return null;
        }

        if (metadataResultCacheRef.current[normalizedUri] !== undefined) {
            return metadataResultCacheRef.current[normalizedUri];
        }

        if (metadataRequestCacheRef.current[normalizedUri]) {
            return metadataRequestCacheRef.current[normalizedUri];
        }

        const resolutionPromise = (async () => {
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
                    const resolvedDetails = pickNftDetailsFromMetadata(metadata);
                    debugNft('Resolved NFT details from metadata', {
                        metadataUrl,
                        resolvedDetails,
                    });
                    if (resolvedDetails) {
                        return resolvedDetails;
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
        })();

        metadataRequestCacheRef.current[normalizedUri] = resolutionPromise;
        const resolved = await resolutionPromise;
        metadataResultCacheRef.current[normalizedUri] = resolved;
        delete metadataRequestCacheRef.current[normalizedUri];

        return resolved;
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

    const totalNftPages = useMemo(() => {
        return Math.max(1, Math.ceil(nftCount / NFTS_PER_PAGE));
    }, [NFTS_PER_PAGE, nftCount]);

    const paginatedNfts = useMemo(() => {
        if (!nfts.length) {
            return [];
        }
        const start = (currentNftPage - 1) * NFTS_PER_PAGE;
        const end = start + NFTS_PER_PAGE;
        return nfts.slice(start, end);
    }, [NFTS_PER_PAGE, currentNftPage, nfts]);

    useEffect(() => {
        setCurrentNftPage(1);
    }, [walletAddress]);

    useEffect(() => {
        setFailedNftThumbnails({});
    }, [walletAddress, currentNftPage]);

    useEffect(() => {
        setLoadedNftThumbnails({});
    }, [walletAddress, currentNftPage]);

    useEffect(() => {
        setResolvedNftThumbnails({});
    }, [walletAddress]);

    useEffect(() => {
        setResolvedNftTitles({});
        setResolvedNftCollections({});
    }, [walletAddress]);

    useEffect(() => {
        setCollectionFallbackTokens({});
    }, [walletAddress]);

    useEffect(() => {
        metadataResultCacheRef.current = {};
        metadataRequestCacheRef.current = {};
    }, [walletAddress]);

    useEffect(() => {
        setSelectedNftTokenId(null);
        setCopiedFieldKey(null);
    }, [walletAddress]);

    useEffect(() => {
        let cancelled = false;

        const loadPinned = async () => {
            try {
                if (!walletAddress) {
                    setPinnedTokenIds([]);
                    return;
                }

                const pinned = await getPinnedNfts(auth0Id, walletAddress, accessToken);
                if (!cancelled) {
                    setPinnedTokenIds(pinned.map((item) => item.token_id));
                }
            } catch (error) {
                debugNft('Failed to load pinned NFTs', {
                    error: error instanceof Error ? error.message : String(error),
                });
                if (!cancelled) {
                    setPinnedTokenIds([]);
                }
            }
        };

        void loadPinned();

        return () => {
            cancelled = true;
        };
    }, [accessToken, auth0Id, debugNft, walletAddress]);

    useEffect(() => {
        let cancelled = false;

        const resolveCurrentPageThumbnails = async () => {
            const updates: Record<string, string> = {};
            const titleUpdates: Record<string, string | null> = {};
            const collectionUpdates: Record<string, string | null> = {};
            const fallbackUpdates: Record<string, boolean> = {};

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
                        fallbackUpdates[nft.token_id] = false;
                        debugNft('Using direct thumbnail candidate', {
                            tokenId: nft.token_id,
                            thumbnail: directCandidates[0],
                        });
                        return;
                    }

                    const metadataDetails = await resolveNftDetailsFromMetadata(nft.uri);
                    debugNft('Using metadata-derived NFT details', {
                        tokenId: nft.token_id,
                        details: metadataDetails,
                    });

                    if (metadataDetails) {
                        if (metadataDetails.url) {
                            updates[nft.token_id] = metadataDetails.url;
                        }
                        titleUpdates[nft.token_id] = metadataDetails.title;
                        collectionUpdates[nft.token_id] = metadataDetails.collectionName;
                        fallbackUpdates[nft.token_id] = metadataDetails.isCollectionFallback;
                    }
                })
            );

            if (!cancelled && Object.keys(updates).length > 0) {
                setResolvedNftThumbnails((current) => ({
                    ...current,
                    ...updates,
                }));
            }

            if (!cancelled && Object.keys(fallbackUpdates).length > 0) {
                setCollectionFallbackTokens((current) => ({
                    ...current,
                    ...fallbackUpdates,
                }));
            }

            if (!cancelled && Object.keys(titleUpdates).length > 0) {
                setResolvedNftTitles((current) => ({
                    ...current,
                    ...titleUpdates,
                }));
            }

            if (!cancelled && Object.keys(collectionUpdates).length > 0) {
                setResolvedNftCollections((current) => ({
                    ...current,
                    ...collectionUpdates,
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
    }, [currentNftPage, debugNft, paginatedNfts, resolveNftDetailsFromMetadata, resolvedNftThumbnails]);

    const selectedNft = useMemo(
        () => nfts.find((nft) => nft.token_id === selectedNftTokenId) || null,
        [nfts, selectedNftTokenId]
    );

    const selectedNftTitle = selectedNft
        ? resolvedNftTitles[selectedNft.token_id]
        || `NFT ${selectedNft.token_id.slice(0, 8)}...`
        : '';

    const selectedNftCollectionName = selectedNft
        ? resolvedNftCollections[selectedNft.token_id]
        || deriveCollectionNameFromTitle(selectedNftTitle)
        || 'Unknown Collection'
        : '';

    const selectedNftThumbnailUrl = selectedNft
        ? getNftThumbnailUrl(selectedNft.token_id, selectedNft.uri)
        : null;

    const selectedNftThumbnailSrc = getNftThumbnailSrc(selectedNftThumbnailUrl);

    useEffect(() => {
        setIsSelectedNftImageLoaded(false);
    }, [selectedNftTokenId, selectedNftThumbnailSrc]);

    const pinTargetNft = useMemo(
        () => nfts.find((nft) => nft.token_id === pinTargetTokenId) || null,
        [nfts, pinTargetTokenId]
    );

    const pinTargetTitle = pinTargetNft
        ? resolvedNftTitles[pinTargetNft.token_id]
        || `NFT ${pinTargetNft.token_id.slice(0, 8)}...`
        : '';

    const pinTargetCollectionName = pinTargetNft
        ? resolvedNftCollections[pinTargetNft.token_id]
        || deriveCollectionNameFromTitle(pinTargetTitle)
        || 'Unknown Collection'
        : '';

    const hasAnyPinned = pinnedTokenIds.length > 0;

    const openPinModalForNft = (tokenId: string) => {
        setPinTargetTokenId(tokenId);
        setPinFlowStep(hasAnyPinned ? 'submit' : 'instructions');
        setPinLocation(null);
    };

    const closePinModal = () => {
        setPinTargetTokenId(null);
        setPinFlowStep('instructions');
        setPinLocation(null);
    };

    const handleSubmitPin = async () => {
        if (!pinTargetNft) {
            return;
        }

        if (!walletAddress) {
            showToast('error', 'No connected wallet found for pinning.');
            return;
        }

        if (!pinLocation) {
            showToast('error', 'Please place your location pin on the map first.');
            return;
        }

        const pinTargetThumbnailUrl = getNftThumbnailUrl(pinTargetNft.token_id, pinTargetNft.uri);

        try {
            setIsPinActionLoading(true);
            const nextPinned = await pinNft(
                auth0Id,
                {
                    token_id: pinTargetNft.token_id,
                    wallet_address: walletAddress,
                    issuer: pinTargetNft.issuer,
                    uri: pinTargetNft.uri,
                    latitude: pinLocation.lat,
                    longitude: pinLocation.lng,
                    image_url: pinTargetThumbnailUrl,
                    title: pinTargetTitle,
                    collection_name: pinTargetCollectionName,
                },
                accessToken
            );
            setPinnedTokenIds(nextPinned.map((item) => item.token_id));
            showToast('success', 'NFT pinned successfully.');
            closePinModal();
        } catch (error) {
            debugNft('Failed to pin NFT', {
                tokenId: pinTargetNft.token_id,
                error: error instanceof Error ? error.message : String(error),
            });
            showToast('error', `Failed to pin NFT: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            setIsPinActionLoading(false);
        }
    };

    const handleConfirmUnpin = async () => {
        if (!pendingUnpinTokenId) {
            return;
        }

        if (!walletAddress) {
            showToast('error', 'No connected wallet found for unpinning.');
            return;
        }

        try {
            setIsPinActionLoading(true);
            const nextPinned = await unpinNft(auth0Id, pendingUnpinTokenId, walletAddress, accessToken);
            setPinnedTokenIds(nextPinned.map((item) => item.token_id));
            setPendingUnpinTokenId(null);
            showToast('success', 'NFT unpinned successfully.');
        } catch (error) {
            debugNft('Failed to unpin NFT', {
                tokenId: pendingUnpinTokenId,
                error: error instanceof Error ? error.message : String(error),
            });
            showToast('error', `Failed to unpin NFT: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            setIsPinActionLoading(false);
        }
    };

    const handleCopyValue = async (fieldKey: string, value: string | null) => {
        if (!value) {
            return;
        }

        try {
            await navigator.clipboard.writeText(value);
            setCopiedFieldKey(fieldKey);
            setTimeout(() => {
                setCopiedFieldKey((currentCopiedKey) =>
                    currentCopiedKey === fieldKey ? null : currentCopiedKey
                );
            }, 1500);
        } catch (error) {
            debugNft('Failed to copy NFT detail value', {
                fieldKey,
                error: error instanceof Error ? error.message : String(error),
            });
        }
    };

    if (nftCount <= 0) {
        return null;
    }

    return (
        <div className="rounded-md border border-white/10 bg-black/20 p-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 justify-items-center">
                {paginatedNfts.map((nft) => (
                    <div
                        key={nft.token_id}
                        className="relative w-full max-w-[200px] rounded bg-white/[0.03] p-2 text-left transition-colors hover:bg-white/[0.06]"
                    >
                        <button
                            type="button"
                            onClick={() => setSelectedNftTokenId(nft.token_id)}
                            className="cursor-pointer w-full"
                        >
                            {(() => {
                                const thumbnailUrl = getNftThumbnailUrl(nft.token_id, nft.uri);
                                const thumbnailSrc = getNftThumbnailSrc(thumbnailUrl);
                                const thumbnailFailed = failedNftThumbnails[nft.token_id];
                                const isCollectionFallback = collectionFallbackTokens[nft.token_id] === true;

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
                                        <div className="h-auto w-full aspect-square max-h-[200px] rounded border border-white/10 bg-white/5" />
                                    );
                                }

                                const isThumbnailLoaded = loadedNftThumbnails[nft.token_id] === true;

                                return (
                                    <div
                                        className={`relative h-auto w-full aspect-square max-h-[200px] overflow-hidden rounded border ${isCollectionFallback ? 'border-red-600' : 'border-white/10'}`}
                                    >
                                        {!isThumbnailLoaded && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-white/5">
                                                <FontAwesomeIcon icon={faSpinner} className="text-white/60 animate-spin" />
                                            </div>
                                        )}
                                        <img
                                            src={thumbnailSrc}
                                            alt="NFT thumbnail"
                                            className={`h-full w-full object-cover transition-opacity duration-200 ${isThumbnailLoaded ? 'opacity-100' : 'opacity-0'}`}
                                            loading="lazy"
                                            decoding="async"
                                            onLoad={() => {
                                                setLoadedNftThumbnails((current) => ({
                                                    ...current,
                                                    [nft.token_id]: true,
                                                }));
                                            }}
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
                                                setLoadedNftThumbnails((current) => ({
                                                    ...current,
                                                    [nft.token_id]: false,
                                                }));
                                            }}
                                        />
                                    </div>
                                );
                            })()}
                        </button>

                        {(() => {
                            const isPinned = pinnedTokenIds.includes(nft.token_id);

                            return (
                                <button
                                    type="button"
                                    onClick={(event) => {
                                        event.preventDefault();
                                        event.stopPropagation();

                                        if (isPinned) {
                                            setPendingUnpinTokenId(nft.token_id);
                                            return;
                                        }

                                        openPinModalForNft(nft.token_id);
                                    }}
                                    title={isPinned ? 'Remove NFT pin' : 'Pin NFT'}
                                    className={`cursor-pointer absolute bottom-4 right-3 inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/20 transition-colors hover:text-sky-500 hover:bg-black/55 ${isPinned ? 'bg-black/45 text-sky-500' : 'bg-black/35 text-white/55'}`.trim()}
                                >
                                    <FontAwesomeIcon icon={faThumbtack} className="text-sm" />
                                    <span className="sr-only">{isPinned ? 'Remove NFT pin' : 'Pin NFT'}</span>
                                </button>
                            );
                        })()}
                    </div>
                ))}
            </div>

            {totalNftPages > 1 && (
                <div className="mt-3 flex items-center justify-between text-xs text-white/70">
                    <span>
                        Page {currentNftPage} of {totalNftPages}
                    </span>
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

            <Modal
                isOpen={selectedNft != null}
                title={selectedNftTitle}
                onClose={() => setSelectedNftTokenId(null)}
                closeOnOverlayClick
                showCloseButton
                maxWidthClassName="max-w-[560px]"
            >
                {selectedNft && (
                    <div className="space-y-4">
                        <div className="mx-auto h-[500px] w-[500px] max-w-full overflow-hidden rounded-lg border border-white/10">
                            {selectedNftThumbnailSrc ? (
                                <div className="relative h-full w-full bg-white/5">
                                    {!isSelectedNftImageLoaded && (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <FontAwesomeIcon icon={faSpinner} className="text-white/60 animate-spin" />
                                        </div>
                                    )}
                                    <img
                                        src={selectedNftThumbnailSrc}
                                        alt={selectedNftTitle}
                                        className={`h-full w-full object-cover transition-opacity duration-200 ${isSelectedNftImageLoaded ? 'opacity-100' : 'opacity-0'}`}
                                        loading="lazy"
                                        decoding="async"
                                        onLoad={() => setIsSelectedNftImageLoaded(true)}
                                        onError={() => setIsSelectedNftImageLoaded(false)}
                                    />
                                </div>
                            ) : (
                                <div className="h-full w-full bg-white/5" />
                            )}
                        </div>

                        <div className="space-y-2 text-sm">
                            <p className="text-white/80">
                                Collection: <span className="font-medium text-white">{selectedNftCollectionName}</span>
                            </p>
                            <div className="flex items-center gap-2 text-white/80">
                                <span>Collection Address:</span>
                                <span className="font-mono text-xs text-white/95 break-all">
                                    {selectedNft.issuer || 'N/A'}
                                </span>
                                {selectedNft.issuer && (
                                    <button
                                        type="button"
                                        onClick={() => void handleCopyValue(`${selectedNft.token_id}-collection`, selectedNft.issuer)}
                                        title={copiedFieldKey === `${selectedNft.token_id}-collection` ? 'Copied' : 'Copy collection address'}
                                        className="inline-flex h-5 w-5 items-center justify-center rounded border border-white/35 bg-black/35 p-0.5 text-white/85 hover:bg-black/45 hover:text-white"
                                    >
                                        <FontAwesomeIcon
                                            icon={copiedFieldKey === `${selectedNft.token_id}-collection` ? faCheck : faCopy}
                                            className="text-[10px]"
                                        />
                                        <span className="sr-only">Copy collection address</span>
                                    </button>
                                )}
                                {copiedFieldKey === `${selectedNft.token_id}-collection` && (
                                    <span className="text-[10px] text-green-300">Copied</span>
                                )}
                            </div>
                            <div className="flex items-center gap-2 text-white/80">
                                <span>NFT:</span>
                                <span className="font-mono text-xs text-white/95 break-all">
                                    {selectedNft.token_id}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => void handleCopyValue(`${selectedNft.token_id}-nft`, selectedNft.token_id)}
                                    title={copiedFieldKey === `${selectedNft.token_id}-nft` ? 'Copied' : 'Copy NFT address'}
                                    className="inline-flex h-5 w-5 items-center justify-center rounded border border-white/35 bg-black/35 p-0.5 text-white/85 hover:bg-black/45 hover:text-white"
                                >
                                    <FontAwesomeIcon
                                        icon={copiedFieldKey === `${selectedNft.token_id}-nft` ? faCheck : faCopy}
                                        className="text-[10px]"
                                    />
                                    <span className="sr-only">Copy NFT address</span>
                                </button>
                                {copiedFieldKey === `${selectedNft.token_id}-nft` && (
                                    <span className="text-[10px] text-green-300">Copied</span>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

            <Modal
                isOpen={pinTargetNft != null}
                title="Pin NFT"
                onClose={closePinModal}
                closeOnOverlayClick
                showCloseButton
                maxWidthClassName="max-w-xl"
            >
                {pinTargetNft && (
                    <div className="space-y-4 text-sm text-white/85">
                        {pinFlowStep === 'instructions' ? (
                            <>
                                <p className="text-white/90">
                                    Before pinning your first NFT, here is how this works.
                                </p>
                                <ul className="list-disc l-8 space-y-1 text-white/70">
                                    <li>You may pin as many NFTs as you want.</li>
                                    <li>Use the map to find your location to be used in the XoloGlobe map.</li>
                                    <li>You may unpin an NFT at anytime.</li>
                                </ul>
                                <div className="flex justify-end">
                                    <Button
                                        onClick={() => setPinFlowStep('submit')}
                                        className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800"
                                    >
                                        Continue
                                    </Button>
                                </div>
                            </>
                        ) : (
                            <>
                                <p className="text-white/90">Choose your pin location on the map, then submit to save.</p>
                                <p className="text-white/70">
                                    Ready to pin <span className="font-medium text-white">{pinTargetTitle}</span> from <span className="font-medium text-white">{pinTargetCollectionName}</span>.
                                </p>
                                <div className="flex justify-end gap-3 pt-1">
                                    <Button
                                        onClick={() => void handleSubmitPin()}
                                        disabled={isPinActionLoading || !pinLocation}
                                        className="bg-green-600 hover:bg-green-700 active:bg-green-800"
                                    >
                                        {isPinActionLoading ? 'Saving pin' : 'Submit Pin'}
                                    </Button>
                                </div>
                                <NftPinLocationMap
                                    onLocationChange={setPinLocation}
                                    className="mt-2"
                                />
                                <p className="text-xs text-white/60">
                                    Current pin: {pinLocation ? `${pinLocation.lat.toFixed(5)}, ${pinLocation.lng.toFixed(5)}` : 'Not set'}
                                </p>
                            </>
                        )}
                    </div>
                )}
            </Modal>

            <ConfirmModal
                isOpen={pendingUnpinTokenId != null}
                title="Remove pinned NFT?"
                message="This will remove this NFT from the XoloGlobe map. You may pin it again later at any time."
                confirmLabel="Remove"
                loading={isPinActionLoading}
                onCancel={() => setPendingUnpinTokenId(null)}
                onConfirm={() => void handleConfirmUnpin()}
            />
        </div>
    );
}