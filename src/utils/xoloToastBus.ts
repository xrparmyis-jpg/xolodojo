type ToastType = 'success' | 'error';

export function emitXoloToast(type: ToastType, message: string): void {
  if (typeof window === 'undefined') {
    return;
  }
  window.dispatchEvent(
    new CustomEvent('xolo:toast', { detail: { type, message } })
  );
}
