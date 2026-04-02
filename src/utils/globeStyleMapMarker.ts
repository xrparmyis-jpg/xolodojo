const MAPBOX_PIN_SVG_URL = 'https://docs.mapbox.com/mapbox-gl-js/assets/pin.svg';

/** DOM for Mapbox GL marker: stem (Mapbox pin.svg) + optional circular NFT avatar — matches XoloGlobe. */
export function createGlobeStylePinMarkerElements(imageUrl: string | null): {
    markerElement: HTMLDivElement;
    markerVisualElement: HTMLDivElement;
    setAvatarUrl: (url: string | null) => void;
} {
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
    markerVisualElement.style.backgroundImage = `url('${MAPBOX_PIN_SVG_URL}')`;
    markerVisualElement.style.backgroundSize = 'contain';
    markerVisualElement.style.backgroundRepeat = 'no-repeat';
    markerVisualElement.style.backgroundPosition = 'center';
    markerVisualElement.style.position = 'absolute';
    markerVisualElement.style.left = '50%';
    markerVisualElement.style.bottom = '0';
    markerVisualElement.style.transform = 'translateX(-50%)';
    markerVisualElement.style.transformOrigin = '50% 100%';

    let avatarElement: HTMLDivElement | null = null;

    const applyAvatar = (url: string | null) => {
        if (!url) {
            if (avatarElement) {
                avatarElement.remove();
                avatarElement = null;
            }
            return;
        }

        if (!avatarElement) {
            avatarElement = document.createElement('div');
            avatarElement.style.position = 'absolute';
            avatarElement.style.top = '1px';
            avatarElement.style.left = '50%';
            avatarElement.style.transform = 'translateX(-50%)';
            avatarElement.style.width = '30px';
            avatarElement.style.height = '30px';
            avatarElement.style.borderRadius = '9999px';
            avatarElement.style.border = '1.5px solid rgba(255,255,255,0.9)';
            avatarElement.style.backgroundSize = 'cover';
            avatarElement.style.backgroundPosition = 'center';
            avatarElement.style.backgroundRepeat = 'no-repeat';
            markerVisualElement.appendChild(avatarElement);
        }
        const safeUrl = url.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
        avatarElement.style.backgroundImage = `url("${safeUrl}")`;
    };

    applyAvatar(imageUrl);
    markerElement.appendChild(markerVisualElement);

    return {
        markerElement,
        markerVisualElement,
        setAvatarUrl: applyAvatar,
    };
}
