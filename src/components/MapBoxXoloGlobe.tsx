import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import type { Map } from 'mapbox-gl';
import { useSearchParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { icon } from '@fortawesome/fontawesome-svg-core';
import {
    faDiscord,
    faInstagram,
    faTelegram,
    faTiktok,
    faXTwitter,
} from '@fortawesome/free-brands-svg-icons';
import { faPause, faPlay, faPlus, faMinus, faSpinner, faSun, faMoon, faMap, faSatellite } from '@fortawesome/free-solid-svg-icons';
import { getXoloGlobePins, type XoloGlobePin } from '../services/xoloGlobePinService';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || '';

interface MapBoxXoloGlobeProps {
    className?: string;
}

const socialPlatformMeta = {
    twitter: { label: 'X (Twitter)', hrefPrefix: 'https://x.com/', iconSvg: icon(faXTwitter).html.join('') },
    discord: { label: 'Discord', hrefPrefix: 'https://discord.com/users/', iconSvg: icon(faDiscord).html.join('') },
    tiktok: { label: 'TikTok', hrefPrefix: 'https://tiktok.com/@', iconSvg: icon(faTiktok).html.join('') },
    instagram: { label: 'Instagram', hrefPrefix: 'https://instagram.com/', iconSvg: icon(faInstagram).html.join('') },
    telegram: { label: 'Telegram', hrefPrefix: 'https://t.me/', iconSvg: icon(faTelegram).html.join('') },
} as const;

type SocialPlatformKey = keyof typeof socialPlatformMeta;

const socialPlatformOrder: SocialPlatformKey[] = ['twitter', 'discord', 'tiktok', 'instagram', 'telegram'];

const escapeHtml = (value: string) =>
    value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

const toSocialHref = (platform: SocialPlatformKey, handle: string) => {
    const { hrefPrefix } = socialPlatformMeta[platform];
    return `${hrefPrefix}${encodeURIComponent(handle)}`;
};

const tailwindSocialLink = "inline-flex items-center justify-center mr-1 mb-0 rounded-full border border-[#b7e9f7] w-10 h-10 bg-[rgba(25,25,35,0.85)] border border-white/20 bg-white/5 text-white/80 hover:border-white/40 hover:bg-white/10 hover:text-white transition-all duration-200";
const tailwindSocialIcon = "inline-block align-middle w-[22px] h-[22px] text-[18px] leading-[22px] text-[#cdcdcd] group-hover:text-white transition-colors duration-200";
const buildPinPopupHtml = (pin: XoloGlobePin) => {
    const fallbackTitle = `NFT ${pin.token_id.slice(0, 8)}...`;
    const title = escapeHtml(pin.title || fallbackTitle);

    const socials = socialPlatformOrder
        .map((platform) => {
            const rawHandle = pin.socials?.[platform];
            if (!rawHandle) {
                return null;
            }

            const handle = rawHandle.trim().replace(/^@+/, '');
            if (!handle) {
                return null;
            }

            const href = toSocialHref(platform, handle);
            const safeLabel = escapeHtml(socialPlatformMeta[platform].label);
            const safePlatform = escapeHtml(platform);
            const iconSvg = socialPlatformMeta[platform].iconSvg;

            return `<a class="${tailwindSocialLink} xolo-social-icon--${safePlatform}" href="${href}" target="_blank" rel="noopener noreferrer" aria-label="Open ${safeLabel} for @${escapeHtml(handle)}" title="${safeLabel}">
                <span class="${tailwindSocialIcon}" aria-hidden="true">${iconSvg}</span>
            </a>`;
        })
        .filter((item): item is string => Boolean(item));

    const socialsHtml = socials.length > 0
        ? `<div class="flex flex-row flex-wrap gap-1 mt-2 mb-2">${socials.join('')}</div>`
        : '';

    const noteRaw = typeof pin.pin_note === 'string' ? pin.pin_note.trim() : '';
    const noteHtml = noteRaw
        ? `<p class="xolo-popup-note mt-1 text-sm text-white/80">${escapeHtml(noteRaw)}</p>`
        : '';

    return `<div class="xolo-popup">`
        + `<h2 class="xolo-popup-title">${title}</h2>`
        + `${noteHtml}`
        + `${socialsHtml}`
        + '</div>';
};

export default function MapBoxXoloGlobe({ className }: MapBoxXoloGlobeProps) {
    const [searchParams] = useSearchParams();
    const mapContainerRef = useRef<HTMLDivElement | null>(null);
    const mapRef = useRef<Map | null>(null);
    const markersRef = useRef<mapboxgl.Marker[]>([]);
    const markerElementsRef = useRef<Array<{ marker: mapboxgl.Marker; visualElement: HTMLDivElement }>>([]);
    const pinPopupControllersRef = useRef<Record<string, { open: () => void }>>({});
    const autoOpenedPinTokenIdRef = useRef<string | null>(null);
    const spinningRef = useRef(true);
    const userInteractingRef = useRef(false);
    const popupFocusActiveRef = useRef(false);
    const spinningBeforePopupRef = useRef(false);
    const popupRestoreTimerRef = useRef<number | null>(null);
    const prePopupCameraRef = useRef<{
        center: [number, number];
        zoom: number;
        bearing: number;
        pitch: number;
    } | null>(null);
    const [pins, setPins] = useState<XoloGlobePin[]>([]);
    const [isSpinning, setIsSpinning] = useState(true);
    const [lightPreset, setLightPreset] = useState<'day' | 'night'>('night');
    const [mapStyleMode, setMapStyleMode] = useState<'street' | 'satellite'>('satellite');
    const [isLoading, setIsLoading] = useState(true);
    const [hasMapToken, setHasMapToken] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    const secondsPerRevolution = 120;
    /** Globe auto-rotation only when zoom is below this (Mapbox zoom; ~3 = regional, world is ~1–2). */
    const rotationMaxZoom = 3;
    /** Between this and `rotationMaxZoom`, rotation slows smoothly to zero. */
    const slowSpinZoomStart = 2;

    const [mapZoom, setMapZoom] = useState(1.15);
    const spinLockedByZoom = mapZoom >= rotationMaxZoom;

    const accessToken = useMemo(() => import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || '', []);
    const targetPinTokenId = searchParams.get('pin')?.trim() || null;

    const openTargetPinFromQuery = useCallback(() => {
        if (!targetPinTokenId || autoOpenedPinTokenIdRef.current === targetPinTokenId) {
            return;
        }

        const controller = pinPopupControllersRef.current[targetPinTokenId];
        if (!controller) {
            return;
        }

        autoOpenedPinTokenIdRef.current = targetPinTokenId;
        controller.open();
    }, [targetPinTokenId]);

    useEffect(() => {
        let cancelled = false;

        const loadPins = async () => {
            try {
                setIsLoading(true);
                setLoadError(null);
                const nextPins = await getXoloGlobePins();
                if (!cancelled) {
                    setPins(nextPins);
                }
            } catch (error) {
                if (!cancelled) {
                    setLoadError(error instanceof Error ? error.message : String(error));
                    setPins([]);
                }
            } finally {
                if (!cancelled) {
                    setIsLoading(false);
                }
            }
        };

        void loadPins();

        return () => {
            cancelled = true;
        };
    }, []);

    const stopRotationIfZoomTooHigh = () => {
        const map = mapRef.current;
        if (!map) {
            return;
        }
        if (map.getZoom() >= rotationMaxZoom && spinningRef.current) {
            spinningRef.current = false;
            setIsSpinning(false);
            map.stop();
        }
    };

    const spinGlobe = () => {
        const map = mapRef.current;
        if (!map) {
            return;
        }

        const zoom = map.getZoom();
        if (spinningRef.current && !userInteractingRef.current && zoom < rotationMaxZoom) {
            let distancePerSecond = 360 / secondsPerRevolution;
            if (zoom > slowSpinZoomStart) {
                const denom = rotationMaxZoom - slowSpinZoomStart;
                const zoomDif = denom > 0 ? (rotationMaxZoom - zoom) / denom : 0;
                distancePerSecond *= Math.max(0, zoomDif);
            }
            const center = map.getCenter();
            center.lng -= distancePerSecond;
            map.easeTo({ center, duration: 1000, easing: (n) => n });
        }
    };

    const updateMarkerScale = () => {
        const map = mapRef.current;
        if (!map) {
            return;
        }

        const container = map.getContainer();
        const containerWidth = container.clientWidth || 1;
        const containerHeight = container.clientHeight || 1;
        const centerX = containerWidth / 2;
        const centerY = containerHeight / 2;
        const zoom = map.getZoom();

        const zoomScale = Math.max(0.92, Math.min(1.32, 0.95 + ((zoom - 0.75) * 0.13)));

        markerElementsRef.current.forEach(({ marker, visualElement }) => {
            const projected = map.project(marker.getLngLat());
            const dx = (projected.x - centerX) / centerX;
            const dy = (projected.y - centerY) / centerY;
            const radial = Math.min(1, Math.sqrt((dx * dx) + (dy * dy)));
            const centerWeightedScale = 0.8 + (Math.pow(1 - radial, 1.35) * 0.42);
            const scale = Math.max(0.7, Math.min(1.5, zoomScale * centerWeightedScale));
            const lowerHemisphereCompensation = Math.max(0, dy) * 8;
            visualElement.style.transform = `translateX(-50%) translateY(${lowerHemisphereCompensation}px) scale(${scale})`;
            visualElement.style.transformOrigin = '50% 100%';
        });
    };

    const handleToggleSpin = () => {
        const map = mapRef.current;
        if (!map || map.getZoom() >= rotationMaxZoom) {
            return;
        }

        const next = !spinningRef.current;
        spinningRef.current = next;
        setIsSpinning(next);

        if (next) {
            spinGlobe();
            return;
        }

        map.stop();
    };

    const handleZoom = (direction: 'in' | 'out') => {
        const map = mapRef.current;
        if (!map) {
            return;
        }

        const currentZoom = map.getZoom();
        const targetZoom = direction === 'in' ? currentZoom + 1 : currentZoom - 1;
        map.zoomTo(targetZoom, { duration: 350 });
    };

    const applyLightPreset = (preset: 'day' | 'night') => {
        const map = mapRef.current;
        if (!map) {
            return;
        }

        try {
            map.setConfigProperty('basemap', 'lightPreset', preset);
        } catch {
        }
        setLightPreset(preset);
    };

    const handleStyleMode = (mode: 'street' | 'satellite') => {
        const map = mapRef.current;
        if (!map || mode === mapStyleMode) {
            return;
        }

        const style = mode === 'street'
            ? 'mapbox://styles/mapbox/standard'
            : 'mapbox://styles/mapbox/standard-satellite';

        setMapStyleMode(mode);
        map.setStyle(style);

        map.once('style.load', () => {
            map.setFog({
                color: 'rgb(165, 205, 255)',
                'high-color': 'rgb(100, 166, 235)',
                'horizon-blend': 0.14,
                'space-color': 'rgb(8, 14, 32)',
                'star-intensity': 0.35,
            });
            if (mode === 'street') {
                applyLightPreset(lightPreset);
            }
            updateMarkerScale();
        });
    };

    useEffect(() => {
        if (!mapContainerRef.current) {
            return;
        }

        if (!accessToken) {
            setHasMapToken(false);
            return;
        }

        setHasMapToken(true);

        const map = new mapboxgl.Map({
            container: mapContainerRef.current,
            style: 'mapbox://styles/mapbox/standard-satellite',
            attributionControl: false,
            center: [130, 35],
            zoom: 1.15,
        });

        mapRef.current = map;

        map.on('style.load', () => {
            map.setFog({
                color: 'rgb(165, 205, 255)',
                'high-color': 'rgb(100, 166, 235)',
                'horizon-blend': 0.14,
                'space-color': 'rgb(8, 14, 32)',
                'star-intensity': 0.35,
            });
            applyLightPreset(lightPreset);
        });

        map.on('load', () => {
            setMapZoom(map.getZoom());
            if (spinningRef.current) {
                spinGlobe();
            }
        });

        map.on('mousedown', () => {
            userInteractingRef.current = true;
        });

        map.on('touchstart', () => {
            userInteractingRef.current = true;
        });

        map.on('mouseup', () => {
            userInteractingRef.current = false;
            spinGlobe();
        });

        map.on('dragend', () => {
            userInteractingRef.current = false;
            spinGlobe();
        });

        map.on('touchend', () => {
            userInteractingRef.current = false;
            spinGlobe();
        });

        map.on('move', () => {
            updateMarkerScale();
        });

        map.on('zoom', () => {
            updateMarkerScale();
            stopRotationIfZoomTooHigh();
            setMapZoom(map.getZoom());
        });

        map.on('moveend', () => {
            updateMarkerScale();
            spinGlobe();
        });

        return () => {
            markersRef.current.forEach(marker => marker.remove());
            markersRef.current = [];
            markerElementsRef.current = [];
            pinPopupControllersRef.current = {};
            map.remove();
            mapRef.current = null;
        };
    }, [accessToken]);

    useEffect(() => {
        if (autoOpenedPinTokenIdRef.current !== targetPinTokenId) {
            autoOpenedPinTokenIdRef.current = null;
        }

        openTargetPinFromQuery();
    }, [openTargetPinFromQuery, targetPinTokenId]);

    useEffect(() => {
        const map = mapRef.current;
        if (!map) {
            return;
        }

        markersRef.current.forEach(marker => marker.remove());
        markersRef.current = [];
        pinPopupControllersRef.current = {};

        const timeoutId = window.setTimeout(() => {
            const nextMarkerElements: Array<{ marker: mapboxgl.Marker; visualElement: HTMLDivElement }> = [];

            const nextMarkers: mapboxgl.Marker[] = pins.map((pin) => {
                const markerElement = document.createElement('div');
                markerElement.className = 'xolo-globe-marker';
                markerElement.style.width = '1px';
                markerElement.style.height = '1px';
                markerElement.style.position = 'relative';

                const markerVisualElement = document.createElement('div');
                const markerWidth = 36;
                const markerHeight = 54;
                markerVisualElement.style.width = `${markerWidth}px`;
                markerVisualElement.style.height = `${markerHeight}px`;
                markerVisualElement.style.backgroundImage = "url('https://docs.mapbox.com/mapbox-gl-js/assets/pin.svg')";
                markerVisualElement.style.backgroundSize = 'contain';
                markerVisualElement.style.backgroundRepeat = 'no-repeat';
                markerVisualElement.style.backgroundPosition = 'center';
                markerVisualElement.style.position = 'absolute';
                markerVisualElement.style.left = '50%';
                markerVisualElement.style.bottom = '0';
                markerVisualElement.style.transform = 'translateX(-50%)';
                markerVisualElement.style.transformOrigin = '50% 100%';

                if (pin.image_url) {
                    const avatarElement = document.createElement('div');
                    avatarElement.style.position = 'absolute';
                    avatarElement.style.top = '1px';
                    avatarElement.style.left = '50%';
                    avatarElement.style.transform = 'translateX(-50%)';
                    avatarElement.style.width = '30px';
                    avatarElement.style.height = '30px';
                    avatarElement.style.borderRadius = '9999px';
                    avatarElement.style.border = '1.5px solid rgba(255,255,255,0.9)';
                    avatarElement.style.backgroundImage = `url('${pin.image_url}')`;
                    avatarElement.style.backgroundSize = 'cover';
                    avatarElement.style.backgroundPosition = 'center';
                    avatarElement.style.backgroundRepeat = 'no-repeat';
                    markerVisualElement.appendChild(avatarElement);
                }

                markerVisualElement.style.cursor = 'pointer';
                markerElement.appendChild(markerVisualElement);

                const popup = new mapboxgl.Popup({
                    offset: 68,
                    className: 'xolo-globe-popup',
                    anchor: 'bottom',
                }).setHTML(
                    buildPinPopupHtml(pin)
                );

                const focusOnPin = () => {
                    if (popupRestoreTimerRef.current != null) {
                        window.clearTimeout(popupRestoreTimerRef.current);
                        popupRestoreTimerRef.current = null;
                    }

                    if (!popupFocusActiveRef.current) {
                        const currentCenter = map.getCenter();
                        prePopupCameraRef.current = {
                            center: [currentCenter.lng, currentCenter.lat],
                            zoom: map.getZoom(),
                            bearing: map.getBearing(),
                            pitch: map.getPitch(),
                        };
                    }

                    popupFocusActiveRef.current = true;
                    spinningBeforePopupRef.current = spinningRef.current;

                    if (spinningRef.current) {
                        spinningRef.current = false;
                        setIsSpinning(false);
                        map.stop();
                    }

                    // Remove pointer cursor while popup is open
                    markerVisualElement.style.cursor = '';
                    map.easeTo({
                        center: [pin.longitude, pin.latitude],
                        zoom: Math.max(map.getZoom(), 6.4),
                        duration: 1750,
                        easing: (t) => 1 - Math.pow(1 - t, 3),
                        essential: true,
                    });
                };

                popup.on('open', focusOnPin);

                popup.on('close', () => {
                    // Restore pointer cursor when popup closes
                    markerVisualElement.style.cursor = 'pointer';
                    popupRestoreTimerRef.current = window.setTimeout(() => {
                        if (document.querySelector('.mapboxgl-popup')) {
                            return;
                        }

                        popupFocusActiveRef.current = false;
                        const previousCamera = prePopupCameraRef.current;
                        prePopupCameraRef.current = null;

                        if (previousCamera) {
                            map.easeTo({
                                center: previousCamera.center,
                                zoom: previousCamera.zoom,
                                bearing: previousCamera.bearing,
                                pitch: previousCamera.pitch,
                                duration: 1850,
                                easing: (t) => t < 0.5
                                    ? 4 * t * t * t
                                    : 1 - Math.pow(-2 * t + 2, 3) / 2,
                                essential: true,
                            });
                        }

                        if (spinningBeforePopupRef.current && map.getZoom() < rotationMaxZoom) {
                            spinningRef.current = true;
                            setIsSpinning(true);
                            map.once('moveend', () => {
                                window.setTimeout(() => {
                                    spinGlobe();
                                }, 220);
                            });
                        }

                        spinningBeforePopupRef.current = false;
                    }, 40);
                });

                const marker = new mapboxgl.Marker({
                    element: markerElement,
                    anchor: 'bottom',
                    rotationAlignment: 'horizon',
                    offset: [0, 7],
                })
                    .setLngLat([pin.longitude, pin.latitude])
                    .setPopup(popup)
                    .addTo(map);

                pinPopupControllersRef.current[pin.token_id] = {
                    open: () => {
                        if (!popup.isOpen()) {
                            popup.addTo(map);
                            return;
                        }

                        focusOnPin();
                    },
                };

                nextMarkerElements.push({ marker, visualElement: markerVisualElement });
                return marker;
            });

            markersRef.current = nextMarkers;
            markerElementsRef.current = nextMarkerElements;
            updateMarkerScale();
            openTargetPinFromQuery();
        }, 400);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [openTargetPinFromQuery, pins]);

    if (!hasMapToken) {
        return (
            <div className="rounded-lg border border-red-500/40 bg-red-950/40 p-3 text-sm text-red-200">
                Map is unavailable: missing <span className="font-mono">VITE_MAPBOX_ACCESS_TOKEN</span>.
            </div>
        );
    }

    return (
        <div className={className || 'relative'}>
            <div ref={mapContainerRef} className="h-full w-full overflow-hidden rounded-lg border border-[#36e9e424]" />

            <div className="absolute left-3 top-3 z-20 inline-flex overflow-hidden rounded-md border border-black/15 bg-[#8989a312] shadow-[0_2px_8px_rgba(0,0,0,0.35)]">
                <button
                    type="button"
                    onClick={() => applyLightPreset('day')}
                    className={`group flex h-8 w-8 cursor-pointer items-center justify-center border-r border-black/15 bg-[#8989a312] transition-colors ${lightPreset === 'day' ? 'text-[#C9E8E9]' : 'text-black hover:text-[#C9E8E9]'}`}
                    title="Day"
                    aria-label="Day"
                >
                    <FontAwesomeIcon icon={faSun} className="text-sm" />
                </button>

                <button
                    type="button"
                    onClick={() => applyLightPreset('night')}
                    className={`group flex h-8 w-8 cursor-pointer items-center justify-center bg-[#8989a312] transition-colors ${lightPreset === 'night' ? 'text-[#C9E8E9]' : 'text-black hover:text-[#C9E8E9]'}`}
                    title="Night"
                    aria-label="Night"
                >
                    <FontAwesomeIcon icon={faMoon} className="text-sm" />
                </button>
            </div>

            <div className="absolute left-3 top-1/2 z-20 -translate-y-1/2 overflow-hidden rounded-md border border-black/15 bg-[#8989a312] shadow-[0_2px_8px_rgba(0,0,0,0.35)]">
                <button
                    type="button"
                    onClick={() => handleZoom('in')}
                    className="flex h-8 w-8 cursor-pointer items-center justify-center border-b border-black/15 bg-[#8989a312] text-black/85 transition-colors hover:text-[#C9E8E9]"
                    title="Zoom in"
                    aria-label="Zoom in"
                >
                    <FontAwesomeIcon icon={faPlus} className="text-sm" />
                </button>

                <button
                    type="button"
                    onClick={() => handleZoom('out')}
                    className="flex h-8 w-8 cursor-pointer items-center justify-center border-b border-black/15 bg-[#8989a312] text-black/85 transition-colors hover:text-[#C9E8E9]"
                    title="Zoom out"
                    aria-label="Zoom out"
                >
                    <FontAwesomeIcon icon={faMinus} className="text-sm" />
                </button>

                <button
                    type="button"
                    onClick={handleToggleSpin}
                    disabled={spinLockedByZoom}
                    className={`flex h-8 w-8 items-center justify-center bg-[#8989a312] transition-colors ${spinLockedByZoom ? 'cursor-not-allowed opacity-45 text-black/50' : `cursor-pointer ${isSpinning ? 'text-[#C9E8E9]' : 'text-black hover:text-[#C9E8E9]'}`}`}
                    title={spinLockedByZoom ? 'Zoom out to use rotation (max zoom 3)' : (isSpinning ? 'Pause globe rotation' : 'Start globe rotation')}
                    aria-label={spinLockedByZoom ? 'Rotation unavailable while zoomed in; zoom out to enable' : (isSpinning ? 'Pause globe rotation' : 'Start globe rotation')}
                >
                    <FontAwesomeIcon icon={isSpinning ? faPause : faPlay} className="text-xs" />
                </button>
            </div>

            <div className="absolute right-3 top-3 z-20 inline-flex overflow-hidden rounded-md border border-black/15 bg-[#8989a312] shadow-[0_2px_8px_rgba(0,0,0,0.35)] text-black">
                <button
                    type="button"
                    onClick={() => handleStyleMode('street')}
                    className={`flex h-8 w-8 cursor-pointer items-center justify-center bg-[#8989a312] transition-colors ${mapStyleMode === 'street' ? 'text-[#C9E8E9]' : 'text-black/85 hover:text-[#C9E8E9]'}`}
                    title="Street"
                    aria-label="Street"
                >
                    <FontAwesomeIcon icon={faMap} className="text-xs" />
                </button>
                <button
                    type="button"
                    onClick={() => handleStyleMode('satellite')}
                    className={`flex h-8 w-8 cursor-pointer items-center justify-center border-l border-black/15 bg-[#8989a312] transition-colors ${mapStyleMode === 'satellite' ? 'text-[#C9E8E9]' : 'text-black/85 hover:text-[#C9E8E9]'}`}
                    title="Satellite"
                    aria-label="Satellite"
                >
                    <FontAwesomeIcon icon={faSatellite} className="text-xs" />
                </button>
            </div>

            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
                    <div className="inline-flex items-center gap-2 rounded-md border border-white/20 bg-black/65 px-3 py-2 text-sm text-white/90">
                        <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                        Loading pins...
                    </div>
                </div>
            )}

            {!isLoading && loadError && (
                <div className="absolute bottom-3 left-3 right-3 rounded-md border border-red-400/40 bg-red-950/70 px-3 py-2 text-xs text-red-100">
                    Failed to load pins: {loadError}
                </div>
            )}

            {!isLoading && !loadError && pins.length === 0 && (
                <div className="absolute bottom-3 left-3 right-3 rounded-md border border-white/20 bg-black/65 px-3 py-2 text-xs text-white/80">
                    No pins have been placed yet.
                </div>
            )}
        </div>
    );
}