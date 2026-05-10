import { buildGlobePinShareUrl } from './globeShareUrl';
import { emitXoloToast } from './xoloToastBus';

/**
 * Same behavior as the Xglobe map pin popup share button: prefers the native
 * Web Share API, then falls back to copying the URL (clipboard or execCommand).
 */
export async function shareGlobePinLink(
  tokenId: string,
  pinTitle?: string | null
): Promise<void> {
  const url = buildGlobePinShareUrl(tokenId, pinTitle);
  const nativeShareData = {
    title: 'Xolo Dojo Xglobe',
    text: 'Check out this Xglobe pin',
    url,
  };

  if (typeof navigator.share === 'function') {
    try {
      await navigator.share(nativeShareData);
      return;
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return;
      }
    }
  }

  try {
    await navigator.clipboard.writeText(url);
    emitXoloToast('success', 'Link copied to clipboard');
  } catch {
    try {
      const ta = document.createElement('textarea');
      ta.value = url;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      emitXoloToast('success', 'Link copied to clipboard');
    } catch {
      emitXoloToast('error', 'Could not copy link');
    }
  }
}
