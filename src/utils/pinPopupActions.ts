import { addSavedGlobePin, removeSavedGlobePin } from '../services/savedGlobePinsService';
import { buildGlobePinShareUrl } from './globeShareUrl';
import { emitXoloToast } from './xoloToastBus';
import { normalizeNfTokenId } from './nfTokenId';

function getTokenFromActionsRow(host: Element | null | undefined): string | null {
  if (!host) {
    return null;
  }
  const raw = host.getAttribute('data-xolo-popup-token');
  if (typeof raw !== 'string' || !raw.trim()) {
    return null;
  }
  const n = normalizeNfTokenId(raw);
  return n.length > 0 ? n : null;
}

function setBookmarkButtonState(btn: HTMLButtonElement, bookmarked: boolean) {
  btn.setAttribute('data-xolo-bookmarked', bookmarked ? '1' : '0');
  btn.setAttribute('aria-pressed', bookmarked ? 'true' : 'false');
  const removeLabel = 'Remove from saved';
  const addLabel = 'Save to profile';
  btn.title = bookmarked ? removeLabel : addLabel;
  btn.setAttribute('aria-label', bookmarked ? removeLabel : addLabel);
  btn.classList.toggle('xolo-popup-action-btn--bookmarked', bookmarked);
  const outline = btn.querySelector('.xolo-popup-bm--outline');
  const solid = btn.querySelector('.xolo-popup-bm--solid');
  if (outline instanceof HTMLElement) {
    outline.classList.toggle('hidden', bookmarked);
  }
  if (solid instanceof HTMLElement) {
    solid.classList.toggle('hidden', !bookmarked);
  }
}

export interface PinPopupActionsOptions {
  /**
   * Called after a successful add/remove so globe state (e.g. ref) can stay in sync
   * without a full marker pass.
   */
  onBookmarkStateChange?: (tokenId: string, bookmarked: boolean) => void;
}

/**
 * Binds share (clipboard) and bookmark (API) for `.xolo-popup-actions` inside a Mapbox popup root.
 * Run on `popup` open; call the disposer on close.
 */
export function bindPinPopupActions(
  popupRoot: Element | null | undefined,
  options?: PinPopupActionsOptions
): () => void {
  if (!popupRoot) {
    return () => {};
  }
  const root = popupRoot.classList?.contains('xolo-popup') ? popupRoot : popupRoot.querySelector?.('.xolo-popup');
  const actionsHost =
    (root ?? popupRoot).querySelector<HTMLElement>('.xolo-popup-actions[data-xolo-popup-token]') ??
    popupRoot.querySelector<HTMLElement>('.xolo-popup-actions[data-xolo-popup-token]');
  if (!actionsHost) {
    return () => {};
  }

  const ac = new AbortController();
  const { signal } = ac;

  const onShare = async (e: Event) => {
    e.preventDefault();
    e.stopPropagation();
    const id = getTokenFromActionsRow(actionsHost);
    if (!id) {
      emitXoloToast('error', 'Could not read pin id');
      return;
    }
    const url = buildGlobePinShareUrl(id);
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
  };

  const shareBtn = actionsHost.querySelector<HTMLButtonElement>('[data-xolo-action="share"]');
  shareBtn?.addEventListener('click', onShare, { capture: true, signal });

  const bookmarkBtn = actionsHost.querySelector<HTMLButtonElement>('[data-xolo-action="bookmark"]');
  if (bookmarkBtn) {
    const onBookmark = async (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      const id = getTokenFromActionsRow(actionsHost);
      if (!id) {
        return;
      }
      const isOn = bookmarkBtn.getAttribute('data-xolo-bookmarked') === '1';
      try {
        if (isOn) {
          await removeSavedGlobePin(id);
          setBookmarkButtonState(bookmarkBtn, false);
          options?.onBookmarkStateChange?.(id, false);
          emitXoloToast('success', 'Removed from saved');
        } else {
          await addSavedGlobePin(id);
          setBookmarkButtonState(bookmarkBtn, true);
          options?.onBookmarkStateChange?.(id, true);
          emitXoloToast('success', 'Saved to your profile');
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Bookmark failed';
        emitXoloToast('error', msg);
      }
    };
    bookmarkBtn.addEventListener('click', onBookmark, { capture: true, signal });
  }

  return () => ac.abort();
}
