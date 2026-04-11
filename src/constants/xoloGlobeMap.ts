/** Step for +/- zoom buttons on the globe and pin-placement map. */
export const MAP_ZOOM_BUTTON_STEP = 1;

/**
 * Minimum zoom when focusing a pin on XoloGlobe (see MapBoxXoloGlobe `pinFocusMinZoom`).
 * Snap-zoom uses this target.
 */
export const PIN_FOCUS_MIN_ZOOM = 16.5 - 2 * MAP_ZOOM_BUTTON_STEP;

/** XoloGlobe initial zoom (map constructor). */
export const GLOBE_DEFAULT_ZOOM = 1.15;

/** XoloGlobe initial center [lng, lat]. */
export const GLOBE_DEFAULT_CENTER: [number, number] = [130, 35];
