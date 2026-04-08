import tzlookup from 'tz-lookup';

export function formatLocalTimeAtCoordinates(lat: number, lng: number, when = new Date()): string {
  let timeZone: string;
  try {
    timeZone = tzlookup(lat, lng);
  } catch {
    return 'Unavailable';
  }
  try {
    return new Intl.DateTimeFormat(undefined, {
      timeZone,
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(when);
  } catch {
    return 'Unavailable';
  }
}

/**
 * Keeps `.xolo-popup-local-time-value` in sync with `getCoords()` until the returned disposer runs.
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
  const tick = () => {
    const { lat, lng } = getCoords();
    el.textContent = formatLocalTimeAtCoordinates(lat, lng);
  };
  tick();
  const id = window.setInterval(tick, 1000);
  return () => window.clearInterval(id);
}
