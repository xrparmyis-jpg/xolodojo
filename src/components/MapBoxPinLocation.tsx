import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import mapboxgl from 'mapbox-gl';
import type { LngLatLike, Map } from 'mapbox-gl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faAnglesDown,
    faAnglesUp,
    faMinus,
    faPlus,
    faSpinner,
} from '@fortawesome/free-solid-svg-icons';
import { GLOBE_DEFAULT_ZOOM, MAP_ZOOM_BUTTON_STEP } from '../constants/xoloGlobeMap';
import type { PinnedNftSocials } from '../services/pinnedNftService';
import { buildPinPopupHtml } from '../utils/pinPopupHtml';
import { bindPinPopupLocalTimeClock } from '../utils/pinLocalTime';
import { createGlobeStylePinMarkerElements } from '../utils/globeStyleMapMarker';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || '';

const PREVIEW_POPUP_CAMERA_OFFSET_Y = 115;
const PLACEMENT_PREVIEW_POPUP_OFFSET = 54;

interface SearchFeature {
    id: string;
    place_name: string;
    center: [number, number];
}

interface GeocodingResponse {
    features?: SearchFeature[];
}

export interface MapBoxPinPopupPreview {
    tokenId: string;
    title: string;
    pinNote: string;
    socials: PinnedNftSocials;
}

interface MapBoxPinLocationProps {
    onLocationChange: (location: { lng: number; lat: number } | null) => void;
    initialLocation?: { lng: number; lat: number } | null;
    className?: string;
    mapHeightClassName?: string;
    footerAction?: ReactNode;
    markerImageUrl?: string | null;
    popupPreview?: MapBoxPinPopupPreview | null;
}

/** Mapbox defers marker opacity (~60ms) using fog on globe; that can leave pin/state popup semi-faded after camera moves. */
const PLACEMENT_PIN_OPACITY_REINFORCE_MS = 120;

function reinforcePlacementPinOpacity(marker: mapboxgl.Marker, popup: mapboxgl.Popup | null) {
    const bump = (el: HTMLElement | null | undefined) => {
        if (!el) {
            return;
        }
        const o = parseFloat(window.getComputedStyle(el).opacity);
        if (!Number.isFinite(o) || o <= 0.02 || o >= 0.99) {
            return;
        }
        el.style.setProperty('opacity', '1', 'important');
    };
    bump(marker.getElement());
    if (popup?.isOpen()) {
        bump(popup.getElement() ?? undefined);
    }
}

function scheduleReinforcePlacementPinOpacity(marker: mapboxgl.Marker, popup: mapboxgl.Popup | null | undefined) {
    const run = () => reinforcePlacementPinOpacity(marker, popup ?? null);
    requestAnimationFrame(() => requestAnimationFrame(run));
    window.setTimeout(run, PLACEMENT_PIN_OPACITY_REINFORCE_MS);
}

function reinforcePinPreviewPopupChrome(popup: mapboxgl.Popup) {
    const surface = '#061415';
    const apply = () => {
        const root = popup.getElement();
        if (!root) {
            return;
        }
        const content = root.querySelector('.mapboxgl-popup-content');
        if (content instanceof HTMLElement) {
            content.style.backgroundColor = surface;
        }
    };
    apply();
    requestAnimationFrame(apply);
    window.setTimeout(apply, 50);
}

export default function MapBoxPinLocation({
    onLocationChange,
    initialLocation = null,
    className,
    mapHeightClassName = 'h-[378px]',
    footerAction,
    markerImageUrl = null,
    popupPreview = null,
}: MapBoxPinLocationProps) {
    const mapContainerRef = useRef<HTMLDivElement | null>(null);
    const mapRef = useRef<Map | null>(null);
    const markerRef = useRef<mapboxgl.Marker | null>(null);
    const popupRef = useRef<mapboxgl.Popup | null>(null);
    const setMarkerAvatarRef = useRef<((url: string | null) => void) | null>(null);
    const geolocateControlRef = useRef<mapboxgl.GeolocateControl | null>(null);
    const previewLocalTimeDisposeRef = useRef<(() => void) | null>(null);
    const suppressResultsForQueryRef = useRef<string | null>(null);
    const defaultPinMapViewRef = useRef<{ center: [number, number]; zoom: number }>({
        center: [0, 20],
        zoom: 1.9,
    });
    const [searchText, setSearchText] = useState('');
    const [searchResults, setSearchResults] = useState<SearchFeature[]>([]);
    const [hasMapToken, setHasMapToken] = useState(true);
    const [isLocatingUser, setIsLocatingUser] = useState(!initialLocation);

    const accessToken = useMemo(() => import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || '', []);

    const pinUiRef = useRef({
        markerImageUrl: null as string | null,
        popupPreview: null as MapBoxPinPopupPreview | null,
        onLocationChange,
    });
    pinUiRef.current.markerImageUrl = markerImageUrl ?? null;
    pinUiRef.current.popupPreview = popupPreview ?? null;
    pinUiRef.current.onLocationChange = onLocationChange;

    const attachOrUpdatePreviewPopup = useCallback((map: Map, marker: mapboxgl.Marker, preview: MapBoxPinPopupPreview) => {
        let popup = popupRef.current;
        if (!popup) {
            popup = new mapboxgl.Popup({
                offset: PLACEMENT_PREVIEW_POPUP_OFFSET,
                className: 'xolo-globe-popup',
                anchor: 'bottom',
                maxWidth: '320px',
                closeButton: false,
                closeOnClick: false,
            });
            popupRef.current = popup;
            marker.setPopup(popup);
            marker.togglePopup();
            map.once('moveend', () => reinforcePinPreviewPopupChrome(popup!));
        }

        const ll = marker.getLngLat();
        popup.setHTML(
            buildPinPopupHtml({
                token_id: preview.tokenId,
                title: preview.title,
                pin_note: preview.pinNote,
                socials: preview.socials,
                latitude: ll.lat,
                longitude: ll.lng,
            }),
        );
        reinforcePinPreviewPopupChrome(popup);
        previewLocalTimeDisposeRef.current?.();
        previewLocalTimeDisposeRef.current = bindPinPopupLocalTimeClock(popup.getElement(), () => {
            const next = marker.getLngLat();
            return { lat: next.lat, lng: next.lng };
        });
        scheduleReinforcePlacementPinOpacity(marker, popup);
    }, []);

    const schedulePinOpacityIfMarker = useCallback(() => {
        const marker = markerRef.current;
        if (!marker) {
            return;
        }
        scheduleReinforcePlacementPinOpacity(marker, popupRef.current);
    }, []);

    /** After globe-scale zoom, horizon-aligned markers can vanish; keep popup attached and content fresh. */
    const ensurePreviewPopupVisible = useCallback(() => {
        const map = mapRef.current;
        const marker = markerRef.current;
        const preview = pinUiRef.current.popupPreview;
        if (!map || !marker || !preview) {
            return;
        }
        const popup = marker.getPopup();
        if (!popup) {
            return;
        }
        if (!popup.isOpen()) {
            popup.addTo(map);
        }
        attachOrUpdatePreviewPopup(map, marker, preview);
    }, [attachOrUpdatePreviewPopup]);

    const afterPlacementCameraMove = useCallback(() => {
        ensurePreviewPopupVisible();
        schedulePinOpacityIfMarker();
    }, [ensurePreviewPopupVisible, schedulePinOpacityIfMarker]);

    const removePreviewPopup = useCallback(() => {
        previewLocalTimeDisposeRef.current?.();
        previewLocalTimeDisposeRef.current = null;
        const popup = popupRef.current;
        if (popup) {
            popup.remove();
            popupRef.current = null;
        }
        markerRef.current?.setPopup(null);
    }, []);

    const setMarkerAt = useCallback((lng: number, lat: number, shouldFly = true) => {
        const map = mapRef.current;
        if (!map) {
            return;
        }

        const { markerImageUrl: imageUrl, popupPreview: preview, onLocationChange: onLoc } = pinUiRef.current;

        if (!markerRef.current) {
            const { markerElement, markerVisualElement, setAvatarUrl } = createGlobeStylePinMarkerElements(
                imageUrl,
            );
            setMarkerAvatarRef.current = setAvatarUrl;
            markerVisualElement.style.cursor = 'grab';

            const marker = new mapboxgl.Marker({
                element: markerElement,
                draggable: true,
                anchor: 'bottom',
                rotationAlignment: 'viewport',
                pitchAlignment: 'viewport',
                offset: [0, 7],
                occludedOpacity: 1,
            })
                .setLngLat([lng, lat])
                .addTo(map);

            markerRef.current = marker;

            marker.on('dragend', () => {
                const next = markerRef.current?.getLngLat();
                if (!next) {
                    return;
                }
                pinUiRef.current.onLocationChange({ lng: next.lng, lat: next.lat });
                scheduleReinforcePlacementPinOpacity(marker, marker.getPopup());
            });

            if (preview) {
                attachOrUpdatePreviewPopup(map, marker, preview);
            }
        } else {
            markerRef.current.setLngLat([lng, lat]);
        }

        const targetZoom = Math.max(map.getZoom(), 10);
        const cameraOpts = {
            center: [lng, lat] as LngLatLike,
            zoom: targetZoom,
            essential: true,
            ...(preview ? { offset: [0, PREVIEW_POPUP_CAMERA_OFFSET_Y] as [number, number] } : {}),
        };

        if (shouldFly) {
            map.flyTo({ ...cameraOpts, duration: 1400 });
            map.once('moveend', schedulePinOpacityIfMarker);
        } else if (preview) {
            // Globe preview: nudge camera so the bubble above the pin is not clipped (no pan when preview is off).
            map.easeTo({ ...cameraOpts, duration: 0 });
            map.once('moveend', schedulePinOpacityIfMarker);
        }

        onLoc({ lng, lat });
    }, [attachOrUpdatePreviewPopup, schedulePinOpacityIfMarker]);

    const tryCenterOnUser = useCallback(() => {
        const map = mapRef.current;
        if (!map || !navigator.geolocation) {
            setIsLocatingUser(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lng = position.coords.longitude;
                const lat = position.coords.latitude;
                setIsLocatingUser(false);
                setMarkerAt(lng, lat, true);
            },
            () => {
                setIsLocatingUser(false);
            },
            { enableHighAccuracy: true, timeout: 8000 }
        );
    }, [setMarkerAt]);

    const handleSelectSearchResult = (result: SearchFeature) => {
        const [lng, lat] = result.center;
        setMarkerAt(lng, lat, true);
        suppressResultsForQueryRef.current = result.place_name.trim().toLowerCase();
        setSearchText(result.place_name);
        setSearchResults([]);
    };

    const handleSearchSubmit = () => {
        if (searchResults.length === 0) {
            return;
        }
        handleSelectSearchResult(searchResults[0]);
    };

    const handlePlacementZoomStep = useCallback((dir: 'in' | 'out') => {
        const map = mapRef.current;
        if (!map) {
            return;
        }
        const z = map.getZoom();
        map.zoomTo(dir === 'in' ? z + MAP_ZOOM_BUTTON_STEP : z - MAP_ZOOM_BUTTON_STEP, { duration: 350 });
        map.once('moveend', afterPlacementCameraMove);
    }, [afterPlacementCameraMove]);

    /** Match opening “placement” zoom (e.g. 10 with a pin, ~2 when locating on the globe). */
    const handlePlacementZoomPinStart = useCallback(() => {
        const map = mapRef.current;
        if (!map) {
            return;
        }
        map.easeTo({ zoom: defaultPinMapViewRef.current.zoom, duration: 550, essential: true });
        map.once('moveend', afterPlacementCameraMove);
    }, [afterPlacementCameraMove]);

    /** Same world scale as XoloGlobe default so users can drag the pin across regions. */
    const handlePlacementZoomGlobe = useCallback(() => {
        const map = mapRef.current;
        if (!map) {
            return;
        }
        map.easeTo({ zoom: GLOBE_DEFAULT_ZOOM, duration: 650, essential: true });
        map.once('moveend', afterPlacementCameraMove);
    }, [afterPlacementCameraMove]);

    useEffect(() => {
        if (!mapContainerRef.current) {
            return;
        }

        if (!accessToken) {
            setHasMapToken(false);
            return;
        }

        setHasMapToken(true);

        // Capture once per map mount only — parent may update `initialLocation` on drag without remounting.
        const initial = initialLocation;
        const startingCenter: [number, number] = initial
            ? [initial.lng, initial.lat]
            : [0, 20];
        const startingZoom = initial ? 10 : 1.9;
        defaultPinMapViewRef.current = { center: startingCenter, zoom: startingZoom };

        const map = new mapboxgl.Map({
            container: mapContainerRef.current,
            style: 'mapbox://styles/mapbox/standard-satellite',
            center: startingCenter as LngLatLike,
            zoom: startingZoom,
            attributionControl: false,
        });

        mapRef.current = map;

        const geolocateControl = new mapboxgl.GeolocateControl({
            positionOptions: { enableHighAccuracy: true },
            trackUserLocation: false,
            showUserHeading: false,
            showAccuracyCircle: true,
        });
        geolocateControlRef.current = geolocateControl;
        map.addControl(geolocateControl, 'top-right');

        geolocateControl.on('geolocate', (event: GeolocationPosition) => {
            setMarkerAt(event.coords.longitude, event.coords.latitude, true);
        });

        map.on('click', (event) => {
            setMarkerAt(event.lngLat.lng, event.lngLat.lat, false);
        });

        map.on('load', () => {
            if (initial) {
                setMarkerAt(initial.lng, initial.lat, false);
                setIsLocatingUser(false);
                return;
            }

            setIsLocatingUser(true);
            tryCenterOnUser();
        });

        return () => {
            previewLocalTimeDisposeRef.current?.();
            previewLocalTimeDisposeRef.current = null;
            popupRef.current = null;
            setMarkerAvatarRef.current = null;
            markerRef.current?.remove();
            markerRef.current = null;
            geolocateControlRef.current = null;
            map.remove();
            mapRef.current = null;
        };
    }, [accessToken, setMarkerAt, tryCenterOnUser]);

    useEffect(() => {
        setMarkerAvatarRef.current?.(markerImageUrl ?? null);
    }, [markerImageUrl]);

    useEffect(() => {
        const map = mapRef.current;
        const marker = markerRef.current;
        if (!map || !marker) {
            return;
        }

        if (popupPreview) {
            attachOrUpdatePreviewPopup(map, marker, popupPreview);
        } else {
            removePreviewPopup();
        }
    }, [popupPreview, attachOrUpdatePreviewPopup, removePreviewPopup]);

    useEffect(() => {
        const normalizedQuery = searchText.trim().toLowerCase();

        if (!normalizedQuery || !accessToken) {
            setSearchResults([]);
            return;
        }

        if (suppressResultsForQueryRef.current === normalizedQuery) {
            setSearchResults([]);
            return;
        }

        const timeoutId = window.setTimeout(async () => {
            try {
                const response = await fetch(
                    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchText)}.json?limit=6&access_token=${encodeURIComponent(accessToken)}`
                );

                if (!response.ok) {
                    setSearchResults([]);
                    return;
                }

                const data = (await response.json()) as GeocodingResponse;
                setSearchResults(data.features || []);
            } catch {
                setSearchResults([]);
            }
        }, 250);

        return () => window.clearTimeout(timeoutId);
    }, [accessToken, searchText]);

    if (!hasMapToken) {
        return (
            <div className="rounded-lg border border-red-500/40 bg-red-950/40 p-3 text-sm text-red-200">
                Map is unavailable: missing <span className="font-mono">VITE_MAPBOX_ACCESS_TOKEN</span>.
            </div>
        );
    }

    return (
        <div className={`${className || 'relative'} mapbox-pin-controls overflow-visible`}>
            <div className="relative overflow-visible">
                <div ref={mapContainerRef} className={`${mapHeightClassName} w-full overflow-hidden rounded-lg border border-[#3fcfcf2e]`} />

                <div className="pointer-events-auto absolute left-3 top-3 z-10 xologlobe-map-ctrl-group">
                    <button
                        type="button"
                        className="xologlobe-map-ctrl-btn"
                        title="Full zoom in"
                        aria-label="Full zoom in"
                        onClick={handlePlacementZoomPinStart}
                    >
                        <FontAwesomeIcon icon={faAnglesUp} />
                    </button>
                    <button
                        type="button"
                        className="xologlobe-map-ctrl-btn"
                        title="Zoom in"
                        aria-label="Zoom in"
                        onClick={() => handlePlacementZoomStep('in')}
                    >
                        <FontAwesomeIcon icon={faPlus} />
                    </button>
                    <button
                        type="button"
                        className="xologlobe-map-ctrl-btn"
                        title="Zoom out"
                        aria-label="Zoom out"
                        onClick={() => handlePlacementZoomStep('out')}
                    >
                        <FontAwesomeIcon icon={faMinus} />
                    </button>
                    <button
                        type="button"
                        className="xologlobe-map-ctrl-btn"
                        title="Full zoom out"
                        aria-label="Full zoom out"
                        onClick={handlePlacementZoomGlobe}
                    >
                        <FontAwesomeIcon icon={faAnglesDown} />
                    </button>
                </div>

                {isLocatingUser && (
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-lg">
                        <div className="inline-flex items-center gap-2 rounded-md bg-black/70 px-3 py-2 text-xs text-white">
                            <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                            Locating...
                        </div>
                    </div>
                )}
            </div>

            {popupPreview ? (
                <p className="mt-2 text-[11px] text-white/45">
                    Drag the pin or click on the map to move it.
                </p>
            ) : null}

            <div className="mt-3 overflow-visible text-sm text-white/85">
                <div className="relative z-20 overflow-visible">
                    <div className="flex w-full min-w-0 items-center gap-3">
                        <input
                            type="text"
                            value={searchText}
                            onChange={(event) => {
                                const nextValue = event.target.value;
                                if (
                                    suppressResultsForQueryRef.current &&
                                    nextValue.trim().toLowerCase() !== suppressResultsForQueryRef.current
                                ) {
                                    suppressResultsForQueryRef.current = null;
                                }
                                setSearchText(nextValue);
                            }}
                            onKeyDown={(event) => {
                                if (event.key === 'Enter') {
                                    event.preventDefault();
                                    handleSearchSubmit();
                                }
                            }}
                            placeholder="Enter an address to search and choose from suggested locations"
                            className="w-full min-w-0 flex-1 rounded-lg border border-white/20 bg-black/40 px-3 py-2 text-sm text-white/90 placeholder:text-white/45 focus:outline-none focus:border-blue-500 transition-all duration-200"
                        />
                    </div>

                    {searchResults.length > 0 ? (
                        <div
                            role="listbox"
                            className={
                                /* Opens upward over the map so the modal/footer don’t grow or scroll */
                                'absolute left-0 right-0 bottom-full z-[60] mb-1 max-h-[min(50vh,18rem)] overflow-y-auto overflow-x-hidden rounded-lg ' +
                                'border border-white/20 bg-black/95 backdrop-blur-sm shadow-[0_-8px_32px_rgba(0,0,0,0.65)]'
                            }
                        >
                            {searchResults.map((result) => (
                                <button
                                    type="button"
                                    key={result.id}
                                    onClick={() => handleSelectSearchResult(result)}
                                    className="cursor-pointer block w-full min-w-0 border-b border-white/10 px-3 py-2 text-left text-sm text-white/90 last:border-b-0 transition-colors duration-200 hover:bg-white/10 break-words"
                                >
                                    {result.place_name}
                                </button>
                            ))}
                        </div>
                    ) : null}
                </div>

                {footerAction ? (
                    <div className="relative z-[15] mt-3 flex w-full flex-wrap items-center gap-3">
                        {footerAction}
                    </div>
                ) : null}
            </div>
        </div>
    );
}
