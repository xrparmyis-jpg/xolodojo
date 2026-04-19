import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ResilientImage from './ResilientImage';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { faCheck, faCopy, faPlus, faSpinner, faThumbtack, faXmark } from '@fortawesome/free-solid-svg-icons';
import Button from './Button';
import Modal from './Modal';
import ModalConfirm from './ModalConfirm';
import MapBoxPinLocation from './MapBoxPinLocation';
import { useToast } from './ToastProvider';
import { useAuth } from '../providers/AuthContext';
import type { WalletAssetSummary } from '../services/walletAssetService';
import { PIN_NOTE_MAX_LENGTH, PIN_NOTE_MIN_LENGTH } from '../constants/pinNote';
import { PIN_WEBSITE_MAX_LENGTH, parsePinWebsiteForStorage } from '../utils/pinWebsiteUrl';
import { normalizeNfTokenId } from '../utils/nfTokenId';
import {
    getPinnedNfts,
    pinNft,
    unpinNft,
    type PinnedNftItem,
    type PinnedNftSocials,
} from '../services/pinnedNftService';

type PinFormMode = 'create' | 'edit';
import { getUserProfile, type ProfileSocials } from '../services/profileService';
import {
    socialPlatformOrder,
    createEmptyVisibleInputs,
    normalizeSocials,
    getSocialProfileUrl,
    type SocialPlatformKey,
} from '../hooks/useSocials';

interface NftGalleryProps {
    nftCount: number;
    nfts: WalletAssetSummary['nfts'];
    walletAddress?: string;
    isLoading: boolean;
    /** When set, pin flow uses these socials instead of fetching /user/profile. */
    profileSocialsForPins?: ProfileSocials;
    /** Wallet-only: persist pin-form socials to profile/session so the next pin pre-fills. */
    syncPinSocialsToProfile?: (socials: ProfileSocials) => void;
}

/** Resolves metadata maps keyed by wallet token id vs API pins (normalized hex). */
function lookupResolvedStringField(
    map: Record<string, string | null>,
    tokenId: string | undefined | null
): string | null {
    if (!tokenId) {
        return null;
    }
    const target = normalizeNfTokenId(tokenId);
    for (const [k, v] of Object.entries(map)) {
        if (normalizeNfTokenId(k) === target && typeof v === 'string' && v.trim()) {
            return v.trim();
        }
    }
    return null;
}

const parseSocialsFromPreferences = (preferences: unknown): PinnedNftSocials => {
    if (!preferences) {
        return {};
    }

    let parsedPreferences: Record<string, unknown> | null = null;

    if (typeof preferences === 'string') {
        try {
            const parsed = JSON.parse(preferences) as unknown;
            parsedPreferences = parsed && typeof parsed === 'object'
                ? (parsed as Record<string, unknown>)
                : null;
        } catch {
            return {};
        }
    } else if (typeof preferences === 'object') {
        parsedPreferences = preferences as Record<string, unknown>;
    }

    if (!parsedPreferences) {
        return {};
    }

    const source = parsedPreferences.socials as ProfileSocials | undefined;
    if (!source || typeof source !== 'object') {
        return {};
    }

    return socialPlatformOrder.reduce<PinnedNftSocials>((acc, platform) => {
        const value = source[platform.key];
        if (typeof value !== 'string') {
            return acc;
        }

        const normalized = value.trim().replace(/^@+/, '');
        if (!normalized) {
            return acc;
        }

        acc[platform.key] = normalized;
        return acc;
    }, {});
};

/** Single trait row (OpenSea / Metaplex-style metadata `attributes`). */
export type NftTrait = { trait_type: string; value: string | number };

type NftMetadataResolution = {
    url: string | null;
    isCollectionFallback: boolean;
    title: string | null;
    collectionName: string | null;
    traits: NftTrait[];
};

function parseAttributeEntry(raw: unknown): NftTrait | null {
    if (!raw || typeof raw !== 'object') {
        return null;
    }
    const r = raw as Record<string, unknown>;
    const traitType =
        typeof r.trait_type === 'string'
            ? r.trait_type
            : typeof r.traitType === 'string'
                ? r.traitType
                : typeof r.name === 'string'
                    ? r.name
                    : null;
    const value = r.value;
    if (!traitType?.trim()) {
        return null;
    }
    if (typeof value === 'number') {
        return { trait_type: traitType.trim(), value };
    }
    if (typeof value === 'string') {
        return { trait_type: traitType.trim(), value: value.trim() };
    }
    if (typeof value === 'boolean') {
        return { trait_type: traitType.trim(), value: value ? 'Yes' : 'No' };
    }
    return null;
}

/**
 * Traits are not returned by the wallet API — only `uri` points to off-chain JSON.
 * Common formats: top-level `attributes`, `properties.attributes`, or `traits`.
 */
function extractTraitsFromMetadata(metadata: unknown): NftTrait[] {
    if (!metadata || typeof metadata !== 'object') {
        return [];
    }
    const o = metadata as Record<string, unknown>;
    const out: NftTrait[] = [];

    const pushFromArray = (arr: unknown) => {
        if (!Array.isArray(arr)) {
            return;
        }
        for (const item of arr) {
            const p = parseAttributeEntry(item);
            if (p) {
                out.push(p);
            }
        }
    };

    pushFromArray(o.attributes);

    const props = o.properties;
    if (props && typeof props === 'object') {
        pushFromArray((props as Record<string, unknown>).attributes);
    }

    if (Array.isArray(o.traits)) {
        for (const t of o.traits) {
            if (typeof t === 'string' && t.trim()) {
                out.push({ trait_type: 'Trait', value: t.trim() });
            } else {
                const p = parseAttributeEntry(t);
                if (p) {
                    out.push(p);
                }
            }
        }
    }

    return out;
}

export default function NftGallery({
    nftCount,
    nfts,
    walletAddress,
    isLoading,
    profileSocialsForPins,
    syncPinSocialsToProfile,
}: NftGalleryProps) {
    const NFTS_PER_PAGE = 12;
    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams, setSearchParams] = useSearchParams();

    /** Prefer assets summary address; fallback to session wallet so we never skip GET /pinned-nfts while assets load. */
    const walletQueryForPinnedApi = useMemo(() => {
        if (walletAddress) {
            return walletAddress;
        }
        if (user?.authMode === 'wallet' && user.walletAddress) {
            return user.walletAddress;
        }
        return undefined;
    }, [walletAddress, user?.authMode, user?.walletAddress]);

    /** Wallet-only sessions use synthetic `id` from /auth/me; allow fetch whenever wallet mode is set. */
    const canLoadPinnedNfts = useMemo(() => {
        if (!user) {
            return false;
        }
        if (user.authMode === 'wallet') {
            return true;
        }
        return Boolean(user.id);
    }, [user]);
    const [currentNftPage, setCurrentNftPage] = useState(1);
    // Track failed state per tokenId (boolean)
    const [resolvedNftThumbnails, setResolvedNftThumbnails] = useState<Record<string, string | null>>({});
    const [resolvedNftTitles, setResolvedNftTitles] = useState<Record<string, string | null>>({});
    const [resolvedNftCollections, setResolvedNftCollections] = useState<Record<string, string | null>>({});
    const [resolvedNftTraits, setResolvedNftTraits] = useState<Record<string, NftTrait[]>>({});
    const [collectionFallbackTokens, setCollectionFallbackTokens] = useState<Record<string, boolean>>({});
    const [selectedNftTokenId, setSelectedNftTokenId] = useState<string | null>(null);
    const [copiedFieldKey, setCopiedFieldKey] = useState<string | null>(null);
    const [pinnedNftItems, setPinnedNftItems] = useState<PinnedNftItem[]>([]);
    const [pinTargetTokenId, setPinTargetTokenId] = useState<string | null>(null);
    const [pinFormMode, setPinFormMode] = useState<PinFormMode>('create');
    const [pinFormStep, setPinFormStep] = useState<1 | 2>(1);
    const [pendingUnpinTokenId, setPendingUnpinTokenId] = useState<string | null>(null);
    const [isPinActionLoading, setIsPinActionLoading] = useState(false);
    const [isSelectedNftImageLoaded, setIsSelectedNftImageLoaded] = useState(false);
    // Cache loaded NFT image URLs by tokenId
    const [loadedNftImageUrls, setLoadedNftImageUrls] = useState<Record<string, string>>({});

    // Helper to handle image load in gallery and cache the URL
    const handleGalleryImageLoad = (tokenId: string, src: string) => {
        setLoadedNftImageUrls((prev) => ({ ...prev, [tokenId]: src }));
    };
    const [pinLocation, setPinLocation] = useState<{ lng: number; lat: number } | null>(null);
    const [pinTitleInput, setPinTitleInput] = useState('');
    const [pinNoteInput, setPinNoteInput] = useState('');
    const [pinWebsiteSuffixInput, setPinWebsiteSuffixInput] = useState('');
    const [pinSuccessState, setPinSuccessState] = useState<{
        tokenId: string;
        title: string;
        collectionName: string;
        kind: 'created' | 'updated';
    } | null>(null);
    const [availableProfileSocials, setAvailableProfileSocials] = useState<PinnedNftSocials>({});
    const [pinDraftSocials, setPinDraftSocials] = useState<ProfileSocials>({});
    const [pinVisibleSocialInputs, setPinVisibleSocialInputs] = useState(() => createEmptyVisibleInputs());
    const [pendingRemovePinSocial, setPendingRemovePinSocial] = useState<SocialPlatformKey | null>(null);
    const { showToast } = useToast();
    const metadataResultCacheRef = useRef<Partial<Record<string, NftMetadataResolution | null>>>({});
    const metadataRequestCacheRef = useRef<Partial<Record<string, Promise<NftMetadataResolution | null>>>>({});

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

    const pickNftDetailsFromMetadata = (metadata: unknown): NftMetadataResolution | null => {
        if (!metadata || typeof metadata !== 'object') {
            return null;
        }

        const metadataRecord = metadata as Record<string, unknown>;
        const traits = extractTraitsFromMetadata(metadata);
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
                    traits,
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
                    traits,
                };
            }
        }

        if (title || collectionName || traits.length > 0) {
            return {
                url: null,
                isCollectionFallback: false,
                title,
                collectionName,
                traits,
            };
        }

        return null;
    };

    const resolveNftDetailsFromMetadata = useCallback(async (uri: string | null): Promise<NftMetadataResolution | null> => {
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
                    const metaObj =
                        metadata && typeof metadata === 'object'
                            ? (metadata as Record<string, unknown>)
                            : null;
                    debugNft('Metadata JSON top-level keys', {
                        metadataUrl,
                        keys: metaObj ? Object.keys(metaObj) : [],
                    });
                    debugNft('Raw metadata sample (truncated)', {
                        metadataUrl,
                        sample:
                            typeof metadata === 'object'
                                ? JSON.stringify(metadata).slice(0, 1200)
                                : String(metadata).slice(0, 400),
                    });
                    const resolvedDetails = pickNftDetailsFromMetadata(metadata);
                    debugNft('Resolved NFT details from metadata', {
                        metadataUrl,
                        resolvedDetails,
                        traitCount: resolvedDetails?.traits?.length ?? 0,
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

    // Returns the first candidate for a given tokenId
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
        setResolvedNftThumbnails({});
    }, [walletAddress]);

    useEffect(() => {
        setResolvedNftTitles({});
        setResolvedNftCollections({});
        setResolvedNftTraits({});
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

    const reloadPinnedNfts = useCallback(async () => {
        if (authLoading) {
            return;
        }
        if (!canLoadPinnedNfts) {
            setPinnedNftItems([]);
            return;
        }
        try {
            const pinned = await getPinnedNfts(walletQueryForPinnedApi);
            setPinnedNftItems(pinned);
        } catch (error) {
            debugNft('Failed to load pinned NFTs', {
                error: error instanceof Error ? error.message : String(error),
            });
            setPinnedNftItems([]);
        }
    }, [authLoading, canLoadPinnedNfts, debugNft, walletQueryForPinnedApi]);

    useEffect(() => {
        if (authLoading) {
            return;
        }
        if (!canLoadPinnedNfts) {
            setPinnedNftItems([]);
            return;
        }

        let cancelled = false;

        const loadPinned = async () => {
            try {
                const pinned = await getPinnedNfts(walletQueryForPinnedApi);
                if (!cancelled) {
                    setPinnedNftItems(pinned);
                }
            } catch (error) {
                debugNft('Failed to load pinned NFTs', {
                    error: error instanceof Error ? error.message : String(error),
                });
                if (!cancelled) {
                    setPinnedNftItems([]);
                }
            }
        };

        void loadPinned();

        return () => {
            cancelled = true;
        };
    }, [authLoading, canLoadPinnedNfts, debugNft, walletQueryForPinnedApi, location.pathname]);

    useEffect(() => {
        const onVisibility = () => {
            if (document.visibilityState !== 'visible' || location.pathname !== '/profile') {
                return;
            }
            void reloadPinnedNfts();
        };
        document.addEventListener('visibilitychange', onVisibility);
        return () => document.removeEventListener('visibilitychange', onVisibility);
    }, [reloadPinnedNfts, location.pathname]);

    const profilePinTokenParam = searchParams.get('pin')?.trim() ?? null;

    useEffect(() => {
        if (!profilePinTokenParam || !walletQueryForPinnedApi || isLoading) {
            return;
        }
        const normalizedTarget = normalizeNfTokenId(profilePinTokenParam);
        const idx = nfts.findIndex((n) => normalizeNfTokenId(n.token_id) === normalizedTarget);
        if (idx < 0) {
            return;
        }
        const targetPage = Math.floor(idx / NFTS_PER_PAGE) + 1;
        if (currentNftPage !== targetPage) {
            setCurrentNftPage(targetPage);
        }
    }, [NFTS_PER_PAGE, profilePinTokenParam, walletQueryForPinnedApi, isLoading, nfts, currentNftPage]);

    useEffect(() => {
        if (!profilePinTokenParam || !walletQueryForPinnedApi || isLoading) {
            return;
        }
        const normalizedTarget = normalizeNfTokenId(profilePinTokenParam);
        const idx = nfts.findIndex((n) => normalizeNfTokenId(n.token_id) === normalizedTarget);
        if (idx < 0) {
            return;
        }
        const targetPage = Math.floor(idx / NFTS_PER_PAGE) + 1;
        if (currentNftPage !== targetPage) {
            return;
        }

        const timeoutId = window.setTimeout(() => {
            const cards = document.querySelectorAll('[data-nft-token-id]');
            for (const c of cards) {
                const id = c.getAttribute('data-nft-token-id');
                if (id && normalizeNfTokenId(id) === normalizedTarget) {
                    c.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    break;
                }
            }
            setSearchParams(
                (prev) => {
                    const next = new URLSearchParams(prev);
                    next.delete('pin');
                    return next;
                },
                { replace: true },
            );
        }, 280);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [
        NFTS_PER_PAGE,
        profilePinTokenParam,
        walletQueryForPinnedApi,
        isLoading,
        nfts,
        currentNftPage,
        setSearchParams,
    ]);

    const pinnedTokenIdSet = useMemo(
        () => new Set(pinnedNftItems.map((p) => normalizeNfTokenId(p.token_id))),
        [pinnedNftItems]
    );

    const getPinSocialsSeed = useCallback((): ProfileSocials => {
        const source =
            profileSocialsForPins !== undefined
                ? profileSocialsForPins
                : (availableProfileSocials as ProfileSocials);
        return normalizeSocials(source);
    }, [profileSocialsForPins, availableProfileSocials]);

    const applyPinSocialsSeedWithOptionalPin = useCallback(
        (pinSocials: PinnedNftSocials | null | undefined) => {
            const base = getPinSocialsSeed();
            const fromPin = normalizeSocials((pinSocials ?? {}) as ProfileSocials);
            return normalizeSocials({ ...base, ...fromPin });
        },
        [getPinSocialsSeed]
    );

    const setPinSocialsUiFromDraft = useCallback((draft: ProfileSocials) => {
        setPinDraftSocials(draft);
        const vis = createEmptyVisibleInputs();
        socialPlatformOrder.forEach((p) => {
            if (draft[p.key]) {
                vis[p.key] = true;
            }
        });
        setPinVisibleSocialInputs(vis);
    }, []);

    useEffect(() => {
        if (profileSocialsForPins !== undefined) {
            setAvailableProfileSocials(
                socialPlatformOrder.reduce<PinnedNftSocials>((acc, platform) => {
                    const v = profileSocialsForPins[platform.key];
                    if (typeof v === 'string' && v.trim()) {
                        acc[platform.key] = v.trim().replace(/^@+/, '');
                    }
                    return acc;
                }, {})
            );
            return;
        }

        let cancelled = false;

        const loadProfileSocials = async () => {
            try {
                const result = await getUserProfile();
                if (!result.success || !result.user || cancelled) {
                    return;
                }

                const profileSocials = parseSocialsFromPreferences(result.user.preferences);
                setAvailableProfileSocials(profileSocials);
            } catch (error) {
                debugNft('Failed to load profile socials for pin selection', {
                    error: error instanceof Error ? error.message : String(error),
                });
                if (!cancelled) {
                    setAvailableProfileSocials({});
                }
            }
        };

        void loadProfileSocials();

        return () => {
            cancelled = true;
        };
    }, [debugNft, profileSocialsForPins]);

    useEffect(() => {
        let cancelled = false;

        const resolveCurrentPageThumbnails = async () => {
            const updates: Record<string, string> = {};
            const titleUpdates: Record<string, string | null> = {};
            const collectionUpdates: Record<string, string | null> = {};
            const fallbackUpdates: Record<string, boolean> = {};
            const traitUpdates: Record<string, NftTrait[]> = {};

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
                        traitUpdates[nft.token_id] = metadataDetails.traits;
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

            if (!cancelled && Object.keys(traitUpdates).length > 0) {
                setResolvedNftTraits((current) => ({
                    ...current,
                    ...traitUpdates,
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
        () =>
            selectedNftTokenId
                ? nfts.find(
                    (nft) =>
                        normalizeNfTokenId(nft.token_id) === normalizeNfTokenId(selectedNftTokenId)
                ) ?? null
                : null,
        [nfts, selectedNftTokenId]
    );

    const selectedNftTitle = selectedNft
        ? lookupResolvedStringField(resolvedNftTitles, selectedNft.token_id)
            || `NFT ${selectedNft.token_id.slice(0, 8)}...`
        : '';

    const selectedNftCollectionName = selectedNft
        ? lookupResolvedStringField(resolvedNftCollections, selectedNft.token_id)
            || deriveCollectionNameFromTitle(selectedNftTitle)
            || 'Unknown Collection'
        : '';

    const selectedNftTraits = selectedNft ? resolvedNftTraits[selectedNft.token_id] : undefined;

    const selectedNftThumbnailUrl = selectedNft
        ? getNftThumbnailUrl(selectedNft.token_id, selectedNft.uri)
        : null;

    // Use cached image URL for modal if available
    const selectedNftThumbnailSrc = selectedNft && loadedNftImageUrls[selectedNft.token_id]
        ? loadedNftImageUrls[selectedNft.token_id]
        : getNftThumbnailSrc(selectedNftThumbnailUrl);

    useEffect(() => {
        setIsSelectedNftImageLoaded(false);
    }, [selectedNftTokenId, selectedNftThumbnailSrc]);

    // Ensure traits load when opening the detail modal (e.g. direct image URI skipped metadata on the grid).
    useEffect(() => {
        if (!selectedNft?.uri) {
            return;
        }
        let cancelled = false;
        void (async () => {
            const details = await resolveNftDetailsFromMetadata(selectedNft.uri);
            if (cancelled || !details) {
                return;
            }
            setResolvedNftTraits((prev) => ({ ...prev, [selectedNft.token_id]: details.traits }));
        })();
        return () => {
            cancelled = true;
        };
    }, [selectedNft?.token_id, selectedNft?.uri, resolveNftDetailsFromMetadata]);

    const pinTargetNft = useMemo(
        () =>
            pinTargetTokenId
                ? nfts.find(
                    (nft) =>
                        normalizeNfTokenId(nft.token_id) === normalizeNfTokenId(pinTargetTokenId)
                ) ?? null
                : null,
        [nfts, pinTargetTokenId]
    );

    const pinTargetTitle = pinTargetNft
        ? lookupResolvedStringField(resolvedNftTitles, pinTargetNft.token_id)
            || `NFT ${pinTargetNft.token_id.slice(0, 8)}...`
        : '';

    const pinTargetCollectionName = pinTargetNft
        ? lookupResolvedStringField(resolvedNftCollections, pinTargetNft.token_id)
            || deriveCollectionNameFromTitle(pinTargetTitle)
            || 'Unknown Collection'
        : '';

    const normalizedPinTitle = pinTitleInput.trim();
    const normalizedPinNote = pinNoteInput
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .trim()
        .slice(0, PIN_NOTE_MAX_LENGTH);

    const selectedPinSocials = useMemo(
        () => normalizeSocials(pinDraftSocials) as PinnedNftSocials,
        [pinDraftSocials]
    );

    useEffect(() => {
        if (!syncPinSocialsToProfile || !pinTargetTokenId) {
            return;
        }
        const id = window.setTimeout(() => {
            syncPinSocialsToProfile(normalizeSocials(pinDraftSocials));
        }, 450);
        return () => window.clearTimeout(id);
    }, [pinDraftSocials, pinTargetTokenId, syncPinSocialsToProfile]);

    const pinMapPopupPreview = useMemo(() => {
        if (!pinTargetNft) {
            return null;
        }
        return {
            tokenId: pinTargetNft.token_id,
            title: pinTitleInput,
            pinNote: pinNoteInput,
            websiteUrl: parsePinWebsiteForStorage(pinWebsiteSuffixInput),
            socials: selectedPinSocials,
        };
    }, [pinTargetNft, pinTitleInput, pinNoteInput, pinWebsiteSuffixInput, selectedPinSocials]);

    const canContinuePinFormStep1 = Boolean(
        pinTargetNft
        && walletAddress
        && normalizedPinTitle.length > 0
        && normalizedPinNote.length >= PIN_NOTE_MIN_LENGTH
        && !isPinActionLoading
    );

    const canSubmitPin = Boolean(
        canContinuePinFormStep1
        && pinLocation
    );

    const pinActiveSocialPlatforms = useMemo(
        () =>
            socialPlatformOrder.filter(
                (platform) =>
                    Boolean((pinDraftSocials[platform.key] || '').trim()) ||
                    pinVisibleSocialInputs[platform.key]
            ),
        [pinDraftSocials, pinVisibleSocialInputs]
    );

    const pinOpenSocialPlatforms = useMemo(
        () => socialPlatformOrder.filter((platform) => pinVisibleSocialInputs[platform.key]),
        [pinVisibleSocialInputs]
    );

    const handlePinActivateSocial = (key: SocialPlatformKey) => {
        setPinVisibleSocialInputs((current) => ({
            ...current,
            [key]: !current[key],
        }));
    };

    const handlePinSocialInputChange = (key: SocialPlatformKey, value: string) => {
        setPinDraftSocials((current) => ({
            ...current,
            [key]: value.replace(/^@+/, ''),
        }));
    };

    const handlePinConfirmRemoveSocial = () => {
        if (!pendingRemovePinSocial) {
            return;
        }
        const key = pendingRemovePinSocial;
        setPinDraftSocials((current) => ({ ...current, [key]: '' }));
        setPinVisibleSocialInputs((current) => ({ ...current, [key]: false }));
        setPendingRemovePinSocial(null);
    };

    const openPinModalForCreate = (tokenId: string) => {
        setPinFormMode('create');
        setPinFormStep(1);
        setPinSuccessState(null);
        setPinTargetTokenId(tokenId);
        setPinLocation(null);
        const defaultTitle =
            lookupResolvedStringField(resolvedNftTitles, tokenId) ?? `NFT ${tokenId.slice(0, 8)}...`;
        setPinTitleInput(defaultTitle);
        setPinNoteInput('');
        setPinWebsiteSuffixInput('');
        setPinSocialsUiFromDraft(getPinSocialsSeed());
    };

    const openPinModalForEdit = (tokenId: string) => {
        const idKey = normalizeNfTokenId(tokenId);
        const existing = pinnedNftItems.find((p) => normalizeNfTokenId(p.token_id) === idKey);
        if (!existing) {
            showToast('error', 'Could not load this pin. Try refreshing.');
            return;
        }
        setPinFormMode('edit');
        setPinFormStep(1);
        setPinSuccessState(null);
        setPinTargetTokenId(tokenId);
        const lat = existing.latitude;
        const lng = existing.longitude;
        if (lat != null && lng != null && Number.isFinite(lat) && Number.isFinite(lng)) {
            setPinLocation({ lng, lat });
        } else {
            setPinLocation(null);
        }
        const fallbackTitle =
            lookupResolvedStringField(resolvedNftTitles, tokenId) ?? `NFT ${tokenId.slice(0, 8)}...`;
        setPinTitleInput((existing.title && existing.title.trim()) || fallbackTitle);
        const noteVal = existing.pin_note;
        setPinNoteInput(typeof noteVal === 'string' ? noteVal : '');
        setPinWebsiteSuffixInput(
            typeof existing.website_url === 'string' && existing.website_url.trim()
                ? existing.website_url.trim()
                : ''
        );
        setPinSocialsUiFromDraft(applyPinSocialsSeedWithOptionalPin(existing.socials ?? null));
    };

    const closePinModal = () => {
        setPinSuccessState(null);
        setPinTargetTokenId(null);
        setPinFormMode('create');
        setPinFormStep(1);
        setPinLocation(null);
        setPinTitleInput('');
        setPinNoteInput('');
        setPinWebsiteSuffixInput('');
        setPinDraftSocials({});
        setPinVisibleSocialInputs(createEmptyVisibleInputs());
        setPendingRemovePinSocial(null);
        setPendingUnpinTokenId(null);
    };

    const handleViewPinnedNftOnGlobe = () => {
        if (!pinSuccessState) {
            return;
        }

        const tokenId = pinSuccessState.tokenId;
        closePinModal();
        navigate(`/xologlobe?pin=${encodeURIComponent(tokenId)}`);
    };

    const handleSubmitPin = useCallback(async () => {
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

        if (!normalizedPinTitle) {
            showToast('error', 'Please add a title for your pin.');
            return;
        }

        if (normalizedPinNote.length < PIN_NOTE_MIN_LENGTH) {
            showToast('error', `Please add a pin description (at least ${PIN_NOTE_MIN_LENGTH} characters).`);
            return;
        }

        const pinTargetThumbnailUrl = getNftThumbnailUrl(pinTargetNft.token_id, pinTargetNft.uri);
        try {
            setIsPinActionLoading(true);
            const socialsPayload = normalizeSocials(pinDraftSocials) as PinnedNftSocials;
            syncPinSocialsToProfile?.(normalizeSocials(pinDraftSocials));
            const nextPinned = await pinNft({
                token_id: pinTargetNft.token_id,
                wallet_address: walletAddress,
                issuer: pinTargetNft.issuer,
                uri: pinTargetNft.uri,
                latitude: pinLocation.lat,
                longitude: pinLocation.lng,
                image_url: pinTargetThumbnailUrl,
                title: normalizedPinTitle,
                collection_name: pinTargetCollectionName,
                socials: socialsPayload,
                pin_note: normalizedPinNote,
                website_url: parsePinWebsiteForStorage(pinWebsiteSuffixInput),
            });
            setPinnedNftItems(nextPinned);
            showToast('success', pinFormMode === 'edit' ? 'Pin updated successfully.' : 'NFT pinned successfully.');
            setPinSuccessState({
                tokenId: pinTargetNft.token_id,
                title: normalizedPinTitle,
                collectionName: pinTargetCollectionName,
                kind: pinFormMode === 'edit' ? 'updated' : 'created',
            });
            setPinTargetTokenId(null);
            setPinFormStep(1);
            setPinLocation(null);
            setPinTitleInput('');
            setPinNoteInput('');
            setPinWebsiteSuffixInput('');
            setPinDraftSocials({});
            setPinVisibleSocialInputs(createEmptyVisibleInputs());
        } catch (error) {
            debugNft('Failed to pin NFT', {
                tokenId: pinTargetNft.token_id,
                error: error instanceof Error ? error.message : String(error),
            });
            showToast('error', `Failed to pin NFT: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            setIsPinActionLoading(false);
        }
    }, [
        debugNft,
        getNftThumbnailUrl,
        normalizedPinTitle,
        normalizedPinNote,
        pinLocation,
        pinTargetCollectionName,
        pinTargetNft,
        pinDraftSocials,
        syncPinSocialsToProfile,
        showToast,
        walletAddress,
        pinFormMode,
        pinWebsiteSuffixInput,
    ]);

    const handleConfirmUnpin = async () => {
        if (!pendingUnpinTokenId) {
            return;
        }

        if (!walletAddress) {
            showToast('error', 'No connected wallet found for unpinning.');
            return;
        }

        const tokenToUnpin = pendingUnpinTokenId;
        const wasEditingThisPin = pinTargetTokenId === tokenToUnpin;

        try {
            setIsPinActionLoading(true);
            const nextPinned = await unpinNft(tokenToUnpin, walletAddress);
            setPinnedNftItems(nextPinned);
            setPendingUnpinTokenId(null);
            showToast('success', 'NFT unpinned successfully.');
            if (wasEditingThisPin) {
                closePinModal();
            }
        } catch (error) {
            debugNft('Failed to unpin NFT', {
                tokenId: tokenToUnpin,
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
        <div className="rounded-md">
            <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 justify-items-stretch">
                {paginatedNfts.map((nft) => (
                    <div
                        key={nft.token_id}
                        data-nft-token-id={nft.token_id}
                        className="flex min-w-0 w-full justify-center text-left"
                    >
                        <div className="relative w-full max-w-[180px]">
                            <button
                                type="button"
                                onClick={() => setSelectedNftTokenId(nft.token_id)}
                                className="block w-full cursor-pointer"
                            >
                                {(() => {
                                    let directCandidates = getDirectNftThumbnailCandidates(nft.uri).filter(Boolean);
                                    const isCollectionFallback = collectionFallbackTokens[nft.token_id] === true;
                                    const resolved = resolvedNftThumbnails[nft.token_id];
                                    if ((!directCandidates || directCandidates.length === 0) && resolved) {
                                        directCandidates = [resolved];
                                    }
                                    if (nftDebugEnabled) {
                                        console.log('[NFT DEBUG] Render thumbnail', {
                                            tokenId: nft.token_id,
                                            uri: nft.uri,
                                            directCandidates,
                                            resolved,
                                        });
                                    }
                                    if (!directCandidates || directCandidates.length === 0) {
                                        return (
                                            <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded bg-white/5">
                                                <FontAwesomeIcon icon={faSpinner} className="text-white/60 animate-spin text-2xl" />
                                            </div>
                                        );
                                    }
                                    return (
                                        <div
                                            className={`relative aspect-square w-full overflow-hidden rounded border ${isCollectionFallback ? 'border-red-600' : 'border-white/10'}`}
                                        >
                                            <ResilientImage
                                                urls={directCandidates}
                                                alt="NFT thumbnail"
                                                className="h-full w-full min-h-0 object-cover"
                                                onLoad={e => handleGalleryImageLoad(nft.token_id, (e.target as HTMLImageElement).src)}
                                            />
                                        </div>
                                    );
                                })()}
                            </button>

                            {(() => {
                                const isPinned = pinnedTokenIdSet.has(normalizeNfTokenId(nft.token_id));

                                return (
                                    <button
                                        type="button"
                                        onClick={(event) => {
                                            event.preventDefault();
                                            event.stopPropagation();

                                            if (isPinned) {
                                                openPinModalForEdit(nft.token_id);
                                                return;
                                            }

                                            openPinModalForCreate(nft.token_id);
                                        }}
                                        title={isPinned ? 'Edit NFT pin' : 'Pin NFT'}
                                        className={`pointer-events-auto z-10 absolute bottom-2 right-2 ${
                                            isPinned
                                                ? 'xologlobe-pin-thumbtack-btn xologlobe-pin-thumbtack-btn--pinned'
                                                : 'xologlobe-pin-thumbtack-btn xologlobe-pin-thumbtack-btn--dim'
                                        }`}
                                    >
                                        <FontAwesomeIcon icon={faThumbtack} aria-hidden />
                                        <span className="sr-only">{isPinned ? 'Edit NFT pin' : 'Pin NFT'}</span>
                                    </button>
                                );
                            })()}
                        </div>
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
                        <div
                            className={`mx-auto h-[500px] w-[500px] max-w-full overflow-hidden rounded-lg ${selectedNftThumbnailSrc && !isSelectedNftImageLoaded ? '' : 'border border-white/10'}`}
                        >
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
                            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-white/80">
                                <span>
                                    Collection:{' '}
                                    <span className="font-medium text-white">{selectedNftCollectionName}</span>
                                </span>
                                {selectedNft.issuer && (
                                    <button
                                        type="button"
                                        onClick={() => void handleCopyValue(`${selectedNft.token_id}-collection`, selectedNft.issuer)}
                                        title={copiedFieldKey === `${selectedNft.token_id}-collection` ? 'Copied' : 'Copy collection address'}
                                        className="cursor-pointer inline-flex h-5 w-5 shrink-0 items-center justify-center rounded border border-white/35 bg-black/35 p-0.5 text-white/85 hover:bg-black/45 hover:text-white"
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
                            </p>

                            {selectedNft.uri ? (
                                <div className="border-t border-white/10 pt-3">
                                    {/* <p className="text-xs font-semibold uppercase tracking-wide text-white/70 mb-2">
                                        Traits
                                    </p> */}
                                    {selectedNftTraits === undefined ? (
                                        <p className="text-white/50 text-sm">Loading traits from metadata…</p>
                                    ) : selectedNftTraits.length === 0 ? (
                                        <p className="text-white/60 text-sm leading-relaxed">
                                            No trait rows found in metadata. Traits usually live in an{' '}
                                            <code className="rounded bg-white/10 px-1 text-white/90">attributes</code>{' '}
                                            array in the JSON at the token&apos;s URI. Add{' '}
                                            <code className="rounded bg-white/10 px-1 text-white/90">?nftDebug=1</code>{' '}
                                            to the page URL to log keys and a JSON sample in the console.
                                        </p>
                                    ) : (
                                        <ul className="grid gap-2 sm:grid-cols-2">
                                            {selectedNftTraits.map((trait, index) => (
                                                <li
                                                    key={`${trait.trait_type}-${String(trait.value)}-${index}`}
                                                    className="rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm"
                                                >
                                                    <div className="text-[11px] uppercase tracking-wide text-white/55">
                                                        {trait.trait_type}
                                                    </div>
                                                    <div className="font-medium text-white/95">{String(trait.value)}</div>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            ) : (
                                <p className="text-white/55 text-sm">
                                    This token has no URI on ledger — trait metadata is unavailable.
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </Modal>

            <Modal
                isOpen={pinTargetNft != null || pinSuccessState != null}
                allowVerticalOverflow
                title={
                    pinSuccessState
                        ? pinSuccessState.kind === 'updated'
                            ? 'Pin updated on Xglobe'
                            : 'Pin added to Xglobe'
                        : pinFormMode === 'edit'
                            ? 'Edit your Xglobe pin'
                            : 'Choose your Xglobe pin location on the globe'
                }
                onClose={closePinModal}
                closeOnOverlayClick
                showCloseButton
                maxWidthClassName="max-w-xl"
            >
                {pinSuccessState ? (
                    <div className="space-y-4 text-sm text-white/85">
                        <div className="rounded-lg border border-blue-500/25 bg-blue-600/10 px-4 py-3">
                            <p className="mt-1 text-white/75">
                                <span className="font-medium text-white">{pinSuccessState.title}</span>
                                {' '}
                                {pinSuccessState.kind === 'updated' ? (
                                    <>is now live on the Xglobe.</>
                                ) : (
                                    <>
                                        was added to{' '}
                                        <span className="font-medium text-white">{pinSuccessState.collectionName}</span>
                                        .
                                    </>
                                )}
                            </p>
                            <p className="mt-2 text-white/65">
                                You may come back to modify or remove your pin by clicking the{' '}
                                <span
                                    className="xologlobe-pin-thumbtack-btn xologlobe-pin-thumbtack-btn--pinned mx-0.5 translate-y-[2px] align-text-bottom"
                                    aria-hidden
                                >
                                    <FontAwesomeIcon icon={faThumbtack} aria-hidden />
                                </span>
                                <span className="sr-only"> thumbtack</span>
                                {' on your NFT card in Profile.'}
                            </p>
                        </div>

                        <div className="flex flex-wrap justify-end gap-3">
                            <Button
                                onClick={closePinModal}
                                className="bg-white/10 hover:bg-white/15 text-white/85 border border-white/15 px-4 py-2.5"
                            >
                                Done
                            </Button>
                            <Button
                                onClick={handleViewPinnedNftOnGlobe}
                                className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:bg-gradient-to-bl text-white font-semibold px-5 py-2.5"
                            >
                                View on Xglobe
                            </Button>
                        </div>
                    </div>
                ) : pinTargetNft && (
                    <div className="space-y-4 text-sm text-white/85">
                        {pinFormStep === 1 ? (
                            <div className="max-h-[min(72vh,640px)] space-y-4 overflow-y-auto overflow-x-hidden pr-1">
                                <div className="w-full min-w-0 flex flex-col">
                                    <label htmlFor="pin-title" className="block text-xs font-semibold uppercase tracking-wide text-white/80 mb-1">
                                        Pin Title <span className="text-red-300">*</span>
                                    </label>
                                    <input
                                        id="pin-title"
                                        type="text"
                                        value={pinTitleInput}
                                        onChange={(event) => setPinTitleInput(event.target.value)}
                                        placeholder="Add a title for this pin"
                                        maxLength={120}
                                        className="w-full rounded-lg border border-white/20 bg-black/40 px-3 py-2 text-white/90 placeholder:text-white/45 focus:outline-none focus:border-blue-500 transition-all duration-200"
                                    />
                                </div>

                                <div className="w-full min-w-0 flex flex-col">
                                    <label htmlFor="pin-description" className="block text-xs font-semibold uppercase tracking-wide text-white/80 mb-1">
                                        Pin Description <span className="text-red-300">*</span>{' '}
                                        <span className="font-normal text-white/50 normal-case">
                                            (max {PIN_NOTE_MAX_LENGTH} characters)
                                        </span>
                                    </label>
                                    <textarea
                                        id="pin-description"
                                        value={pinNoteInput}
                                        onChange={(event) => {
                                            const next = event.target.value;
                                            setPinNoteInput(
                                                next.length > PIN_NOTE_MAX_LENGTH
                                                    ? next.slice(0, PIN_NOTE_MAX_LENGTH)
                                                    : next
                                            );
                                        }}
                                        placeholder="Short line shown on the globe"
                                        rows={4}
                                        className="w-full min-w-0 resize-none rounded-lg border border-white/20 bg-black/40 px-3 py-2 text-sm text-white/90 placeholder:text-white/45 focus:outline-none focus:border-blue-500 transition-all duration-200"
                                    />
                                    <p className="mt-0.5 text-[11px] text-white/45">
                                        {pinNoteInput.length}/{PIN_NOTE_MAX_LENGTH}
                                    </p>
                                </div>

                                <div className="w-full min-w-0 flex flex-col">
                                    <label htmlFor="pin-website" className="block text-xs font-semibold uppercase tracking-wide text-white/80 mb-1">
                                        WEBSITE/PROJECT{' '}
                                        <span className="font-normal normal-case text-white/50">(optional)</span>
                                    </label>
                                    <div className="flex min-w-0 items-stretch overflow-hidden rounded-lg border border-white/20 bg-black/40 transition-all duration-200 focus-within:border-blue-500">
                                        <span
                                            className="flex shrink-0 items-center border-r border-white/15 bg-black/50 pl-3 pr-1 text-sm text-white/50 select-none"
                                            aria-hidden
                                        >
                                            https://
                                        </span>
                                        <input
                                            id="pin-website"
                                            type="text"
                                            inputMode="url"
                                            autoComplete="url"
                                            value={pinWebsiteSuffixInput}
                                            onChange={(event) => {
                                                const next = event.target.value;
                                                setPinWebsiteSuffixInput(
                                                    next.length > PIN_WEBSITE_MAX_LENGTH
                                                        ? next.slice(0, PIN_WEBSITE_MAX_LENGTH)
                                                        : next
                                                );
                                            }}
                                            onPaste={(event) => {
                                                const raw = event.clipboardData.getData('text/plain');
                                                const trimmed = raw.trim();
                                                if (!/^https?:\/\//i.test(trimmed)) {
                                                    return;
                                                }
                                                event.preventDefault();
                                                const normalized = parsePinWebsiteForStorage(trimmed);
                                                const next =
                                                    (normalized ?? '').slice(0, PIN_WEBSITE_MAX_LENGTH);
                                                setPinWebsiteSuffixInput(next);
                                            }}
                                            placeholder="xolodojo.io"
                                            className="min-w-0 flex-1 border-0 bg-transparent py-2 pr-3 pl-2 text-sm text-white/90 placeholder:text-white/40 focus:outline-none focus:ring-0"
                                        />
                                    </div>
                                </div>

                                <div className="w-full min-w-0 flex flex-col">
                                    <label className="block text-xs font-semibold uppercase tracking-wide text-white/80 mb-1">
                                        SOCIAL HANDLES{' '}
                                        <span className="font-normal normal-case text-white/50">(optional)</span>
                                    </label>
                                    <p className="text-xs text-white/55 mb-3">
                                        Add handles to show on this pin&apos;s globe popup. They are saved on the pin, not your password profile.
                                        {syncPinSocialsToProfile
                                            ? ' For wallet sign-in, we also remember them on this device for your next pin.'
                                            : null}
                                    </p>

                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {socialPlatformOrder.map((platform) => {
                                            const isActive = pinActiveSocialPlatforms.some(
                                                (p) => p.key === platform.key
                                            );
                                            return (
                                                <button
                                                    key={platform.key}
                                                    type="button"
                                                    title={isActive ? `Edit ${platform.label}` : `Add ${platform.label}`}
                                                    onClick={() => handlePinActivateSocial(platform.key)}
                                                    className={`cursor-pointer relative inline-flex h-9 w-9 items-center justify-center rounded-full border transition-all duration-200 ${isActive
                                                        ? 'border-emerald-400/60 bg-emerald-700/20 text-emerald-200'
                                                        : 'border-white/25 bg-white/5 text-white/70 hover:text-white hover:border-white/40'
                                                        }`}
                                                >
                                                    <FontAwesomeIcon icon={platform.icon} className="text-[15px]" />
                                                    {!isActive && (
                                                        <span className="absolute -right-0.5 -top-0.5 inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-blue-600 text-[8px] text-white">
                                                            <FontAwesomeIcon icon={faPlus} />
                                                        </span>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {pinOpenSocialPlatforms.length > 0 ? (
                                        <div className="space-y-2">
                                            {pinOpenSocialPlatforms.map((platform) => {
                                                const profileUrl = getSocialProfileUrl(
                                                    platform.key,
                                                    pinDraftSocials[platform.key]
                                                );
                                                return (
                                                    <div key={platform.key} className="flex items-center gap-2">
                                                        {profileUrl ? (
                                                            <a
                                                                href={profileUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                title={`Open ${platform.label}`}
                                                                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/5 text-white/80 hover:border-white/40 hover:bg-white/10 hover:text-white transition-all duration-200"
                                                            >
                                                                <FontAwesomeIcon icon={platform.icon} />
                                                            </a>
                                                        ) : (
                                                            <div className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/5 text-white/80">
                                                                <FontAwesomeIcon icon={platform.icon} />
                                                            </div>
                                                        )}
                                                        <div className="w-full min-w-0 md:w-1/2 md:min-w-[240px]">
                                                            <div className="relative">
                                                                <span className="pointer-events-none absolute inset-y-0 left-2.5 flex items-center text-white/45 text-sm">
                                                                    @
                                                                </span>
                                                                <input
                                                                    value={pinDraftSocials[platform.key] || ''}
                                                                    onChange={(e) =>
                                                                        handlePinSocialInputChange(
                                                                            platform.key,
                                                                            e.target.value
                                                                        )
                                                                    }
                                                                    placeholder={`${platform.label} username`}
                                                                    className="w-full rounded-lg border border-white/20 bg-black/40 pl-7 pr-3 py-2 text-sm text-white/90 placeholder:text-white/45 focus:outline-none focus:border-blue-500"
                                                                    autoComplete="off"
                                                                />
                                                            </div>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            title={`Remove ${platform.label}`}
                                                            onClick={() => setPendingRemovePinSocial(platform.key)}
                                                            className="cursor-pointer inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-red-500/40 bg-red-600/15 text-red-300 hover:bg-red-600/30"
                                                        >
                                                            <FontAwesomeIcon icon={faXmark} />
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : pinActiveSocialPlatforms.length === 0 ? (
                                        <p className="text-xs text-white/50">
                                            Tap a network above to add a handle for this pin.
                                        </p>
                                    ) : null}
                                </div>

                                <div className="flex w-full flex-wrap items-center justify-end gap-3 pt-1">
                                    {pinFormMode === 'edit' ? (
                                        <Button
                                            type="button"
                                            onClick={() => setPendingUnpinTokenId(pinTargetNft.token_id)}
                                            disabled={isPinActionLoading}
                                            className="btn-cta-danger"
                                        >
                                            Remove
                                        </Button>
                                    ) : null}
                                    <Button
                                        type="button"
                                        onClick={() => setPinFormStep(2)}
                                        disabled={!canContinuePinFormStep1}
                                        className="btn-cta-primary"
                                    >
                                        Continue
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="w-full min-w-0 flex flex-col overflow-visible">
                                <label className="block text-xs font-semibold uppercase tracking-wide text-white/80 mb-1">
                                    Pin map location
                                </label>
                                <MapBoxPinLocation
                                    key={`${pinTargetNft.token_id}-${pinFormMode}`}
                                    onLocationChange={setPinLocation}
                                    initialLocation={pinLocation}
                                    markerImageUrl={getNftThumbnailUrl(pinTargetNft.token_id, pinTargetNft.uri)}
                                    popupPreview={pinMapPopupPreview}
                                    mapHeightClassName="h-[280px]"
                                    footerAction={(
                                        <div className="flex w-full flex-wrap items-center justify-between gap-3">
                                            <Button
                                                type="button"
                                                onClick={() => setPinFormStep(1)}
                                                disabled={isPinActionLoading}
                                                className="btn-cta-secondary"
                                            >
                                                Back
                                            </Button>
                                            <div className="flex flex-wrap items-center justify-end gap-3">
                                                {pinFormMode === 'edit' ? (
                                                    <Button
                                                        type="button"
                                                        onClick={() => setPendingUnpinTokenId(pinTargetNft.token_id)}
                                                        disabled={isPinActionLoading}
                                                        className="btn-cta-danger"
                                                    >
                                                        Remove
                                                    </Button>
                                                ) : null}
                                                <Button
                                                    type="button"
                                                    onClick={() => void handleSubmitPin()}
                                                    disabled={!canSubmitPin}
                                                    className="btn-cta-primary"
                                                >
                                                    {isPinActionLoading ? 'Submitting...' : 'Submit'}
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                    className="mt-0"
                                />
                            </div>
                        )}
                    </div>
                )}
            </Modal>

            <ModalConfirm
                isOpen={pendingUnpinTokenId != null}
                title="Remove pinned NFT?"
                message="This will remove this NFT from the Xglobe map. You may pin it again later at any time."
                confirmLabel="Remove"
                loading={isPinActionLoading}
                onCancel={() => setPendingUnpinTokenId(null)}
                onConfirm={() => void handleConfirmUnpin()}
            />

            <ModalConfirm
                isOpen={pendingRemovePinSocial != null}
                title="Remove social from this pin?"
                message="Clears this handle from the pin form. It does not change your saved profile (password accounts)."
                confirmLabel="Remove"
                loading={false}
                onCancel={() => setPendingRemovePinSocial(null)}
                onConfirm={handlePinConfirmRemoveSocial}
            />
        </div>
    );
}