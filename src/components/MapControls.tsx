import { useEffect, useState } from 'react';
import type { Map } from 'mapbox-gl';

interface MapControlsProps {
    mapRef: React.RefObject<Map | null>;
    isSpinning?: boolean;
    onToggleSpin?: () => void;
}

type LightPreset = 'dawn' | 'day' | 'dusk' | 'night';
type MapStyleMode = 'street' | 'satellite';

const MAP_STYLES: Record<MapStyleMode, string> = {
    street: 'mapbox://styles/mapbox/standard',
    satellite: 'mapbox://styles/mapbox/standard-satellite',
};

export default function MapControls({ mapRef, isSpinning = false, onToggleSpin }: MapControlsProps) {
    const [currentPreset, setCurrentPreset] = useState<LightPreset>('night');
    const [mapStyleMode, setMapStyleMode] = useState<MapStyleMode>('satellite');
    const [zoom, setZoom] = useState(2);

    const lightPresets: { icon: string; title: string; value: LightPreset }[] = [
        { icon: '🌅', title: 'Dawn', value: 'dawn' },
        { icon: '☀️', title: 'Day', value: 'day' },
        { icon: '🌆', title: 'Dusk', value: 'dusk' },
        { icon: '🌙', title: 'Night', value: 'night' },
    ];

    const applyLightPreset = (preset: LightPreset, map: Map) => {
        try {
            map.setConfigProperty('basemap', 'lightPreset', preset);
        } catch (e) {
            console.warn('Light preset not supported on this style:', e);
        }
    };

    const handleLightPreset = (preset: LightPreset) => {
        if (mapRef.current) {
            applyLightPreset(preset, mapRef.current);
            setCurrentPreset(preset);
        }
    };

    const handleStyleMode = (mode: MapStyleMode) => {
        if (!mapRef.current || mapStyleMode === mode) return;

        const map = mapRef.current;
        map.setStyle(MAP_STYLES[mode]);
        setMapStyleMode(mode);

        map.once('style.load', () => {
            applyLightPreset(currentPreset, map);
        });
    };

    const handleZoom = (direction: 'in' | 'out') => {
        if (mapRef.current) {
            const currentZoom = mapRef.current.getZoom();
            const newZoom = direction === 'in' ? currentZoom + 1 : currentZoom - 1;
            mapRef.current.zoomTo(newZoom, { duration: 300 });
            setZoom(newZoom);
        }
    };

    useEffect(() => {
        if (!mapRef.current) return;

        const map = mapRef.current;
        const handleZoomChange = () => {
            setZoom(mapRef.current?.getZoom() || 2);
        };

        map.on('zoom', handleZoomChange);

        return () => {
            map.off('zoom', handleZoomChange);
        };
    }, [mapRef]);

    useEffect(() => {
        if (!mapRef.current) return;

        const map = mapRef.current;
        const handleStyleLoad = () => {
            applyLightPreset(currentPreset, map);
        };

        if (map.isStyleLoaded()) {
            handleStyleLoad();
        } else {
            map.once('style.load', handleStyleLoad);
        }
    }, [mapRef, currentPreset]);

    return (
        <>
            <div className="absolute top-4 left-4 z-20 flex gap-2 rounded-lg border border-gray-200 bg-[#8989a312] p-3 shadow-lg backdrop-blur-sm">
                <div className="flex gap-1 border-r border-gray-300 pr-3">
                    {lightPresets.map((preset) => (
                        <button
                            key={preset.value}
                            onClick={() => handleLightPreset(preset.value)}
                            className={`flex h-8 w-8 items-center justify-center rounded text-sm transition-all ${currentPreset === preset.value
                                ? 'bg-blue-600 text-[#C9E8E9] shadow-md'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-[#C9E8E9]'
                                }`}
                            title={preset.title}
                            aria-label={preset.title}
                        >
                            <span aria-hidden="true">{preset.icon}</span>
                        </button>
                    ))}
                </div>

                {onToggleSpin && (
                    <button
                        onClick={onToggleSpin}
                        className={`px-2 py-1 text-xs font-medium rounded transition-all border-r border-gray-300 pr-3 ${isSpinning
                            ? 'bg-green-600 text-[#C9E8E9] hover:bg-green-700'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-[#C9E8E9]'
                            }`}
                        title={isSpinning ? 'Pause rotation' : 'Start rotation'}
                    >
                        {isSpinning ? '⏸ Pause' : '▶ Spin'}
                    </button>
                )}

                <div className="flex gap-1">
                    <button
                        onClick={() => handleZoom('in')}
                        className="px-2 py-1 text-xs font-bold rounded bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-[#C9E8E9] transition-colors"
                        title="Zoom in"
                    >
                        +
                    </button>
                    <span className="px-2 py-1 text-xs font-bold text-gray-700 min-w-8 text-center">
                        {zoom.toFixed(1)}
                    </span>
                    <button
                        onClick={() => handleZoom('out')}
                        className="px-2 py-1 text-xs font-bold rounded bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-[#C9E8E9] transition-colors"
                        title="Zoom out"
                    >
                        −
                    </button>
                </div>
            </div>

            <div className="absolute bottom-4 left-4 z-20 flex overflow-hidden rounded-lg border border-gray-200 bg-[#8989a312] shadow-lg backdrop-blur-sm">
                <button
                    onClick={() => handleStyleMode('street')}
                    className={`px-3 py-2 text-xs font-medium transition-colors ${mapStyleMode === 'street'
                        ? 'bg-blue-600 text-[#C9E8E9]'
                        : 'bg-white text-gray-700 hover:bg-gray-100 hover:text-[#C9E8E9]'
                        }`}
                    title="Street view"
                >
                    🗺️ Street
                </button>
                <button
                    onClick={() => handleStyleMode('satellite')}
                    className={`px-3 py-2 text-xs font-medium border-l border-gray-200 transition-colors ${mapStyleMode === 'satellite'
                        ? 'bg-blue-600 text-[#C9E8E9]'
                        : 'bg-white text-gray-700 hover:bg-gray-100 hover:text-[#C9E8E9]'
                        }`}
                    title="Satellite view"
                >
                    🛰️ Satellite
                </button>
            </div>
        </>
    );
}
