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

/**
 * Pins within this ground distance (meters) are treated as one cluster and spread in a ring.
 * ~110m ≈ one short city block at mid-latitudes.
 */
export const GLOBE_PIN_CLUSTER_THRESHOLD_M = 110;

/** Base ring radius (meters) for spreading 2+ pins in a cluster. */
export const GLOBE_PIN_SPREAD_BASE_RADIUS_M = 36;

/** Extra radius per pin after the first two (meters), capped by max. */
export const GLOBE_PIN_SPREAD_RADIUS_PER_PIN_M = 9;

export const GLOBE_PIN_SPREAD_RADIUS_MAX_M = 92;
