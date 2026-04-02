/** Stored pin website: host and path only (no scheme); links use https://. */

export const PIN_WEBSITE_MAX_LENGTH = 500;

/** Strip scheme/slashes and unsafe pseudo-schemes; cap length. */
export function parsePinWebsiteForStorage(raw: string): string | null {
    let s = raw.trim();
    if (!s) {
        return null;
    }
    s = s.replace(/^https?:\/\//i, '');
    s = s.replace(/^\/+/, '');
    if (!s) {
        return null;
    }
    if (/^[a-z][\w+.-]*:/i.test(s)) {
        return null;
    }
    return s.slice(0, PIN_WEBSITE_MAX_LENGTH);
}

/** Build https URL for popup links; returns null if storage value is missing or invalid. */
export function pinWebsiteStorageToHref(stored: string | null | undefined): string | null {
    if (stored == null || typeof stored !== 'string') {
        return null;
    }
    const trimmed = stored.trim();
    if (!trimmed) {
        return null;
    }
    if (/^[a-z][\w+.-]*:/i.test(trimmed)) {
        return null;
    }
    return `https://${trimmed}`;
}
