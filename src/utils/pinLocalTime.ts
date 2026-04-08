import tzlookup from 'tz-lookup';

export interface LocalTimeParts {
  time: string;
  /** Short zone label, e.g. EST, GMT+1 (locale-dependent). */
  zone: string;
}

export function getLocalTimePartsAtCoordinates(
  lat: number,
  lng: number,
  when = new Date(),
): LocalTimeParts | null {
  let timeZone: string;
  try {
    timeZone = tzlookup(lat, lng);
  } catch {
    return null;
  }
  try {
    const time = new Intl.DateTimeFormat(undefined, {
      timeZone,
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(when);
    const tzParts = new Intl.DateTimeFormat(undefined, {
      timeZone,
      timeZoneName: 'short',
    }).formatToParts(when);
    let zone = tzParts.find(p => p.type === 'timeZoneName')?.value;
    if (!zone) {
      zone =
        new Intl.DateTimeFormat(undefined, {
          timeZone,
          timeZoneName: 'shortGeneric',
        })
          .formatToParts(when)
          .find(p => p.type === 'timeZoneName')?.value;
    }
    return {
      time,
      zone: zone ?? timeZone.split('/').pop()?.replace(/_/g, ' ') ?? timeZone,
    };
  } catch {
    return null;
  }
}

/**
 * Keeps `.xolo-popup-local-time-value` and `.xolo-popup-local-time-zone` in sync
 * with `getCoords()` until the returned disposer runs.
 */
export function bindPinPopupLocalTimeClock(
  popupRoot: Element | null | undefined,
  getCoords: () => { lat: number; lng: number },
): () => void {
  if (!popupRoot) {
    return () => {};
  }
  const el = popupRoot.querySelector('.xolo-popup-local-time-value');
  if (!(el instanceof HTMLElement)) {
    return () => {};
  }
  const elZone = popupRoot.querySelector('.xolo-popup-local-time-zone');
  const tick = () => {
    const { lat, lng } = getCoords();
    const parts = getLocalTimePartsAtCoordinates(lat, lng);
    if (!parts) {
      el.textContent = 'Unavailable';
      if (elZone instanceof HTMLElement) {
        elZone.textContent = '';
      }
      return;
    }
    el.textContent = parts.time;
    if (elZone instanceof HTMLElement) {
      elZone.textContent = ` (${parts.zone})`;
    }
  };
  tick();
  const id = window.setInterval(tick, 1000);
  return () => window.clearInterval(id);
}
