import { useEffect, useMemo, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import type { LngLatLike, Map } from 'mapbox-gl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLocationArrow } from '@fortawesome/free-solid-svg-icons';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || '';

interface SearchFeature {
    id: string;
    place_name: string;
    center: [number, number];
}

interface GeocodingResponse {
    features?: SearchFeature[];
}

interface NftPinLocationMapProps {
    onLocationChange: (location: { lng: number; lat: number } | null) => void;
    initialLocation?: { lng: number; lat: number } | null;
    className?: string;
}

export default function NftPinLocationMap({ onLocationChange, initialLocation = null, className }: NftPinLocationMapProps) {
    const mapContainerRef = useRef<HTMLDivElement | null>(null);
    const mapRef = useRef<Map | null>(null);
    const markerRef = useRef<mapboxgl.Marker | null>(null);
    const geolocateControlRef = useRef<mapboxgl.GeolocateControl | null>(null);
    const suppressResultsForQueryRef = useRef<string | null>(null);
    const [searchText, setSearchText] = useState('');
    const [searchResults, setSearchResults] = useState<SearchFeature[]>([]);
    const [hasMapToken, setHasMapToken] = useState(true);

    const accessToken = useMemo(() => import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || '', []);

    const setMarkerAt = (lng: number, lat: number, shouldFly = true) => {
        const map = mapRef.current;
        if (!map) {
            return;
        }

        if (!markerRef.current) {
            markerRef.current = new mapboxgl.Marker({ color: '#ff4d4f', draggable: true })
                .setLngLat([lng, lat])
                .addTo(map);

            markerRef.current.on('dragend', () => {
                const next = markerRef.current?.getLngLat();
                if (!next) {
                    return;
                }
                onLocationChange({ lng: next.lng, lat: next.lat });
            });
        } else {
            markerRef.current.setLngLat([lng, lat]);
        }

        if (shouldFly) {
            map.flyTo({ center: [lng, lat], zoom: Math.max(map.getZoom(), 10), essential: true });
        }

        onLocationChange({ lng, lat });
    };

    const tryCenterOnUser = () => {
        const map = mapRef.current;
        if (!map || !navigator.geolocation) {
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lng = position.coords.longitude;
                const lat = position.coords.latitude;
                map.flyTo({ center: [lng, lat], zoom: 10, essential: true });
            },
            () => {
                // Best effort only; no-op if user denies permission.
            },
            { enableHighAccuracy: true, timeout: 8000 }
        );
    };

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

    useEffect(() => {
        if (!mapContainerRef.current) {
            return;
        }

        if (!accessToken) {
            setHasMapToken(false);
            return;
        }

        setHasMapToken(true);

        const startingCenter: [number, number] = initialLocation
            ? [initialLocation.lng, initialLocation.lat]
            : [0, 20];

        const map = new mapboxgl.Map({
            container: mapContainerRef.current,
            style: 'mapbox://styles/mapbox/standard-satellite',
            center: startingCenter as LngLatLike,
            zoom: initialLocation ? 10 : 1.9,
        });

        mapRef.current = map;

        const navControl = new mapboxgl.NavigationControl({ showCompass: false, visualizePitch: false });
        map.addControl(navControl, 'top-left');

        const fullscreenControl = new mapboxgl.FullscreenControl();
        map.addControl(fullscreenControl, 'top-left');

        const geolocateControl = new mapboxgl.GeolocateControl({
            positionOptions: { enableHighAccuracy: true },
            trackUserLocation: false,
            showUserHeading: false,
            showAccuracyCircle: true,
        });
        geolocateControlRef.current = geolocateControl;
        map.addControl(geolocateControl, 'bottom-left');

        geolocateControl.on('geolocate', (event: GeolocationPosition) => {
            setMarkerAt(event.coords.longitude, event.coords.latitude, true);
        });

        map.on('click', (event) => {
            setMarkerAt(event.lngLat.lng, event.lngLat.lat, false);
        });

        map.on('load', () => {
            tryCenterOnUser();
            if (initialLocation) {
                setMarkerAt(initialLocation.lng, initialLocation.lat, false);
            }
        });

        return () => {
            markerRef.current?.remove();
            markerRef.current = null;
            geolocateControlRef.current = null;
            map.remove();
            mapRef.current = null;
        };
    }, [accessToken]);

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
        <div className={className || 'relative'}>
            <div className="mb-2 rounded-md border border-white/20 bg-black/65 px-3 py-2 text-xs text-white/85 backdrop-blur-sm">
                <div className="flex items-center gap-3">
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
                        placeholder="Search location"
                        className="flex-1 rounded-md border border-white/25 bg-black/50 px-3 py-2 text-sm text-white placeholder:text-white/60 focus:border-sky-500 focus:outline-none"
                    />
                    <button
                        type="button"
                        onClick={handleSearchSubmit}
                        className="inline-flex h-8 w-8 items-center justify-center rounded border border-white/30 bg-black/70 text-white hover:bg-black/80"
                        title="Search"
                    >
                        <FontAwesomeIcon icon={faLocationArrow} className="text-xs" />
                    </button>
                </div>

                {searchResults.length > 0 && (
                    <div className="mt-2 max-h-52 overflow-auto rounded-md border border-white/20 bg-black/80 backdrop-blur-sm">
                        {searchResults.map((result) => (
                            <button
                                type="button"
                                key={result.id}
                                onClick={() => handleSelectSearchResult(result)}
                                className="block w-full border-b border-white/10 px-3 py-2 text-left text-xs text-white/90 last:border-b-0 hover:bg-white/10"
                            >
                                {result.place_name}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div ref={mapContainerRef} className="h-[420px] w-full overflow-hidden rounded-lg border border-white/20" />
        </div>
    );
}
