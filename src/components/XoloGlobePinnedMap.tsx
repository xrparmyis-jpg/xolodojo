import { useEffect, useMemo, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import type { Map } from 'mapbox-gl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPause, faPlay, faPlus, faMinus, faSpinner, faSun, faMoon } from '@fortawesome/free-solid-svg-icons';
import { getXoloGlobePins, type XoloGlobePin } from '../services/xoloGlobePinService';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || '';

interface XoloGlobePinnedMapProps {
    className?: string;
}

export default function XoloGlobePinnedMap({ className }: XoloGlobePinnedMapProps) {
    const mapContainerRef = useRef<HTMLDivElement | null>(null);
    const mapRef = useRef<Map | null>(null);
    const markersRef = useRef<mapboxgl.Marker[]>([]);
    const markerElementsRef = useRef<Array<{ marker: mapboxgl.Marker; visualElement: HTMLDivElement }>>([]);
    const spinningRef = useRef(true);
    const userInteractingRef = useRef(false);
    const [pins, setPins] = useState<XoloGlobePin[]>([]);
    const [isSpinning, setIsSpinning] = useState(true);
    const [lightPreset, setLightPreset] = useState<'day' | 'night'>('night');
    const [mapStyleMode, setMapStyleMode] = useState<'street' | 'satellite'>('satellite');
    const [isLoading, setIsLoading] = useState(true);
    const [hasMapToken, setHasMapToken] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    const secondsPerRevolution = 120;
    const maxSpinZoom = 5;
    const slowSpinZoom = 3;

    const accessToken = useMemo(() => import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || '', []);

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

    const spinGlobe = () => {
        const map = mapRef.current;
        if (!map) {
            return;
        }

        const zoom = map.getZoom();
        if (spinningRef.current && !userInteractingRef.current && zoom < maxSpinZoom) {
            let distancePerSecond = 360 / secondsPerRevolution;
            if (zoom > slowSpinZoom) {
                const zoomDif = (maxSpinZoom - zoom) / (maxSpinZoom - slowSpinZoom);
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
            visualElement.style.transform = `translateX(-50%) scale(${scale})`;
            visualElement.style.transformOrigin = '50% 100%';
        });
    };

    const handleToggleSpin = () => {
        const next = !spinningRef.current;
        spinningRef.current = next;
        setIsSpinning(next);

        if (next) {
            spinGlobe();
            return;
        }

        mapRef.current?.stop();
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
                color: 'rgb(18, 20, 30)',
                'high-color': 'rgb(38, 42, 56)',
                'horizon-blend': 0.06,
                'space-color': 'rgb(7, 8, 14)',
                'star-intensity': 0.45,
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
            zoom: 0.75,
        });

        mapRef.current = map;

        map.on('style.load', () => {
            map.setFog({
                color: 'rgb(18, 20, 30)',
                'high-color': 'rgb(38, 42, 56)',
                'horizon-blend': 0.06,
                'space-color': 'rgb(7, 8, 14)',
                'star-intensity': 0.45,
            });
            applyLightPreset(lightPreset);
        });

        map.on('load', () => {
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
        });

        map.on('moveend', () => {
            updateMarkerScale();
            spinGlobe();
        });

        return () => {
            markersRef.current.forEach(marker => marker.remove());
            markersRef.current = [];
            markerElementsRef.current = [];
            map.remove();
            mapRef.current = null;
        };
    }, [accessToken]);

    useEffect(() => {
        const map = mapRef.current;
        if (!map) {
            return;
        }

        markersRef.current.forEach(marker => marker.remove());
        markersRef.current = [];

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

                const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(
                    `<h2>${pin.title || `NFT ${pin.token_id.slice(0, 8)}...`}</h2>${pin.collection_name || 'Xolo NFT'}<br/>${pin.latitude.toFixed(5)}, ${pin.longitude.toFixed(5)}`
                );

                const marker = new mapboxgl.Marker({
                    element: markerElement,
                    anchor: 'bottom',
                    rotationAlignment: 'horizon',
                    offset: [0, 7],
                })
                    .setLngLat([pin.longitude, pin.latitude])
                    .setPopup(popup)
                    .addTo(map);

                nextMarkerElements.push({ marker, visualElement: markerVisualElement });
                return marker;
            });

            markersRef.current = nextMarkers;
            markerElementsRef.current = nextMarkerElements;
            updateMarkerScale();
        }, 400);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [pins]);

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

            <div className="absolute left-3 top-1/2 z-20 -translate-y-1/2 overflow-hidden rounded border border-black/40 bg-black/60">
                <button
                    type="button"
                    onClick={() => handleZoom('in')}
                    className="cursor-pointer flex h-8 w-8 items-center justify-center border-b border-black/35 text-white transition-colors hover:bg-black/70 hover:text-yellow-300"
                    title="Zoom in"
                    aria-label="Zoom in"
                >
                    <FontAwesomeIcon icon={faPlus} className="text-xs" />
                </button>

                <button
                    type="button"
                    onClick={() => handleZoom('out')}
                    className="cursor-pointer flex h-8 w-8 items-center justify-center border-b border-black/35 text-white transition-colors hover:bg-black/70 hover:text-yellow-300"
                    title="Zoom out"
                    aria-label="Zoom out"
                >
                    <FontAwesomeIcon icon={faMinus} className="text-xs" />
                </button>

                <button
                    type="button"
                    onClick={handleToggleSpin}
                    className="cursor-pointer flex h-8 w-8 items-center justify-center border-b border-black/35 text-white transition-colors hover:bg-black/70 hover:text-yellow-300"
                    title={isSpinning ? 'Pause globe rotation' : 'Start globe rotation'}
                    aria-label={isSpinning ? 'Pause globe rotation' : 'Start globe rotation'}
                >
                    <FontAwesomeIcon icon={isSpinning ? faPause : faPlay} className="text-xs" />
                </button>

                <button
                    type="button"
                    onClick={() => applyLightPreset('day')}
                    className={`group cursor-pointer flex h-8 w-8 items-center justify-center border-b border-black/35 ${lightPreset === 'day' ? 'bg-black text-yellow-300' : 'bg-transparent text-white ring-1 ring-inset ring-black/45 hover:bg-white/15 hover:text-yellow-300'}`}
                    title="Day"
                    aria-label="Day"
                >
                    <FontAwesomeIcon icon={faSun} className="text-xs" />
                </button>

                <button
                    type="button"
                    onClick={() => applyLightPreset('night')}
                    className={`group cursor-pointer flex h-8 w-8 items-center justify-center ${lightPreset === 'night' ? 'bg-black text-yellow-300' : 'bg-transparent text-white ring-1 ring-inset ring-black/45 hover:bg-white/15 hover:text-yellow-300'}`}
                    title="Night"
                    aria-label="Night"
                >
                    <FontAwesomeIcon icon={faMoon} className="text-xs" />
                </button>
            </div>

            <div className="absolute right-3 top-3 z-20 inline-flex overflow-hidden rounded border border-black/40 bg-black/55 text-[10px] leading-none text-white">
                <button
                    type="button"
                    onClick={() => handleStyleMode('street')}
                    className={`cursor-pointer h-6 px-2 transition-colors ${mapStyleMode === 'street' ? 'bg-black/80 text-white' : 'bg-transparent text-white/85 hover:bg-black/60 hover:text-yellow-300'}`}
                    title="Street"
                    aria-label="Street"
                >
                    Map
                </button>
                <button
                    type="button"
                    onClick={() => handleStyleMode('satellite')}
                    className={`cursor-pointer h-6 border-l border-black/35 px-2 transition-colors ${mapStyleMode === 'satellite' ? 'bg-black/80 text-white' : 'bg-transparent text-white/85 hover:bg-black/60 hover:text-yellow-300'}`}
                    title="Satellite"
                    aria-label="Satellite"
                >
                    Sat
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