import { icon } from '@fortawesome/fontawesome-svg-core';
import {
  faDiscord,
  faInstagram,
  faLinkedinIn,
  faTelegram,
  faTiktok,
  faXTwitter,
} from '@fortawesome/free-brands-svg-icons';
import { faBookmark as faBookmarkSolid, faClock, faShareNodes, faThumbtack } from '@fortawesome/free-solid-svg-icons';
import { faBookmark as faBookmarkRegular } from '@fortawesome/free-regular-svg-icons';
import { sanitizePinNoteHtml } from './sanitizePinNoteHtml';

export interface PinPopupContent {
  token_id: string;
  title?: string | null;
  pin_note?: string | null;
  socials?: Partial<Record<SocialPlatformKey, string>> | null;
  latitude?: number;
  longitude?: number;
  /** When set, shows a blue thumbtack linking back to profile (e.g. owner-only). */
  ownerProfileHref?: string | null;
  /**
   * Share + optional bookmark (when `canBookmark`). Defaults to true so globe + placement match.
   * Set false to hide the action row (e.g. rare embeds).
   */
  showPinActions?: boolean;
  /** Logged-in viewer: show bookmark control. */
  canBookmark?: boolean;
  isBookmarked?: boolean;
}

const socialPlatformMeta = {
  twitter: {
    label: 'X (Twitter)',
    hrefPrefix: 'https://x.com/',
    iconSvg: icon(faXTwitter).html.join(''),
  },
  discord: {
    label: 'Discord',
    hrefPrefix: 'https://discord.com/users/',
    iconSvg: icon(faDiscord).html.join(''),
  },
  tiktok: {
    label: 'TikTok',
    hrefPrefix: 'https://tiktok.com/@',
    iconSvg: icon(faTiktok).html.join(''),
  },
  instagram: {
    label: 'Instagram',
    hrefPrefix: 'https://instagram.com/',
    iconSvg: icon(faInstagram).html.join(''),
  },
  telegram: {
    label: 'Telegram',
    hrefPrefix: 'https://t.me/',
    iconSvg: icon(faTelegram).html.join(''),
  },
  linkedin: {
    label: 'LinkedIn',
    hrefPrefix: 'https://www.linkedin.com/in/',
    iconSvg: icon(faLinkedinIn).html.join(''),
  },
} as const;

export type SocialPlatformKey = keyof typeof socialPlatformMeta;

export const pinPopupSocialPlatformOrder: SocialPlatformKey[] = [
  'twitter',
  'discord',
  'tiktok',
  'instagram',
  'telegram',
  'linkedin',
];

export const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const toSocialHref = (platform: SocialPlatformKey, handle: string) => {
  const trimmed = handle.trim();
  if (platform === 'linkedin') {
    if (/^https?:\/\//i.test(trimmed)) {
      return trimmed;
    }
    const slug = trimmed.replace(/^\/+|\/+$/g, '').replace(/^in\//i, '');
    return `${socialPlatformMeta.linkedin.hrefPrefix}${encodeURIComponent(slug)}`;
  }
  const { hrefPrefix } = socialPlatformMeta[platform];
  return `${hrefPrefix}${encodeURIComponent(trimmed)}`;
};

const tailwindSocialLink =
  'inline-flex items-center justify-center mr-0.5 mb-0 rounded-full border border-[#b7e9f7] w-8 h-8 bg-[rgba(25,25,35,0.85)] border border-white/20 bg-white/5 text-white/80 hover:border-white/40 hover:bg-white/10 hover:text-white transition-all duration-200';
const tailwindSocialIcon =
  'inline-block align-middle w-[17px] h-[17px] text-[14px] leading-[17px] text-[#cdcdcd] group-hover:text-white transition-colors duration-200';

const localTimeClockSvg = icon(faClock).html.join('');
const tailwindLocalTimeClock =
  'inline-block align-middle w-[14px] h-[14px] text-[13px] leading-[14px] text-[#C9E8E9]';
const thumbtackSvg = icon(faThumbtack).html.join('');
const shareSvg = icon(faShareNodes, { classes: 'xolo-popup-fa' }).html.join('');
const bookmarkOutlineSvg = icon(faBookmarkRegular, { classes: 'xolo-popup-fa' }).html.join('');
const bookmarkSolidSvg = icon(faBookmarkSolid, { classes: 'xolo-popup-fa' }).html.join('');

const actionBtnBase =
  'xolo-popup-action-btn inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md border border-white/20 bg-white/5 text-white/80 hover:border-white/40 hover:bg-white/10 hover:text-white transition-colors';
/** Social chips: centered in the flex-1 area next to share/bookmark; wrap when needed. */
const tailwindSocialsCluster =
  'xolo-popup-socials flex min-h-8 min-w-0 flex-1 flex-wrap content-center justify-center gap-x-0.5 gap-y-1 pl-2 sm:pl-3';

export function buildPinPopupHtml(pin: PinPopupContent): string {
  const fallbackTitle = `NFT ${pin.token_id.slice(0, 8)}...`;
  const rawTitle = typeof pin.title === 'string' ? pin.title.trim() : '';
  const title = escapeHtml(rawTitle || fallbackTitle);

  const socials = pinPopupSocialPlatformOrder
    .map(platform => {
      const rawHandle = pin.socials?.[platform];
      if (typeof rawHandle !== 'string') {
        return null;
      }

      const handle = rawHandle.trim().replace(/^@+/, '');
      if (!handle) {
        return null;
      }

      const href = toSocialHref(platform, handle);
      const safeLabel = escapeHtml(socialPlatformMeta[platform].label);
      const safePlatform = escapeHtml(platform);
      const iconSvg = socialPlatformMeta[platform].iconSvg;

      return `<a class="${tailwindSocialLink} xolo-social-icon--${safePlatform}" href="${href}" target="_blank" rel="noopener noreferrer" aria-label="Open ${safeLabel} for @${escapeHtml(handle)}" title="${safeLabel}">
                <span class="${tailwindSocialIcon}" aria-hidden="true">${iconSvg}</span>
            </a>`;
    })
    .filter((item): item is string => Boolean(item));

  const socialsInner = socials.join('');

  const noteRaw =
    typeof pin.pin_note === 'string'
      ? pin.pin_note.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim()
      : '';
  const noteSanitized = noteRaw ? sanitizePinNoteHtml(noteRaw) : '';
  const noteHtml = noteSanitized
    ? `<div class="xolo-popup-note xolo-popup-note--richtext mt-1 text-sm">${noteSanitized}</div>`
    : '';

  const showActions = pin.showPinActions !== false;
  const canBookmark = Boolean(pin.canBookmark);
  const isBookmarked = Boolean(pin.isBookmarked);
  const safeToken = escapeHtml(pin.token_id);
  const shareTitle = 'Copy link to this pin';
  const shareLabel = 'Copy link to this pin';

  const actionButtonsBlock =
    showActions
      ? `<div class="flex shrink-0 items-center gap-1.5">` +
        `<button type="button" class="${actionBtnBase}" data-xolo-action="share" title="${escapeHtml(shareTitle)}" aria-label="${escapeHtml(shareLabel)}">` +
        `<span class="xolo-popup-fa-wrap" aria-hidden="true">${shareSvg}</span></button>` +
        (canBookmark
          ? `<button type="button" class="${actionBtnBase} xolo-popup-action-btn--bookmark${isBookmarked ? ' xolo-popup-action-btn--bookmarked' : ''}" ` +
            `data-xolo-action="bookmark" data-xolo-bookmarked="${isBookmarked ? '1' : '0'}" ` +
            `title="${isBookmarked ? 'Remove from saved' : 'Save to profile'}" ` +
            `aria-label="${isBookmarked ? 'Remove from saved' : 'Save to profile'}" ` +
            `aria-pressed="${isBookmarked ? 'true' : 'false'}">` +
            `<span class="xolo-popup-bm xolo-popup-bm--outline${isBookmarked ? ' hidden' : ''}" aria-hidden="true">${bookmarkOutlineSvg}</span>` +
            `<span class="xolo-popup-bm xolo-popup-bm--solid${!isBookmarked ? ' hidden' : ''}" aria-hidden="true">${bookmarkSolidSvg}</span>` +
            `</button>`
          : '') +
        `</div>`
      : '';

  const socialsOnlyHtml =
    !showActions && socials.length > 0
      ? `<div class="xolo-popup-socials-only mt-2 flex flex-row flex-wrap justify-center gap-0.5">${socialsInner}</div>`
      : '';

  const actionsAndSocialsRow =
    showActions
      ? `<div class="xolo-popup-actions mt-2 flex w-full min-w-0 max-w-full flex-row flex-wrap items-center gap-x-2 gap-y-2" data-xolo-popup-token="${safeToken}">` +
        actionButtonsBlock +
        (socials.length > 0
          ? `<div class="${tailwindSocialsCluster}">${socialsInner}</div>`
          : '') +
        `</div>`
      : '';

  const hasCoords =
    typeof pin.latitude === 'number' &&
    typeof pin.longitude === 'number' &&
    Number.isFinite(pin.latitude) &&
    Number.isFinite(pin.longitude);

  const ownerHref =
    typeof pin.ownerProfileHref === 'string' && pin.ownerProfileHref.trim()
      ? pin.ownerProfileHref.trim()
      : '';

  const localTimeInner = hasCoords
    ? `<p class="xolo-popup-local-time mb-0 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-[#9ec9d4]/95" role="group" aria-label="Local time at pin location"><span class="${tailwindLocalTimeClock} shrink-0" aria-hidden="true">${localTimeClockSvg}</span><span class="xolo-popup-local-time-value tabular-nums min-w-0">—</span><span class="xolo-popup-local-time-zone shrink-0 text-[#9ec9d4]/90"></span></p>`
    : '';

  const ownerThumbtackHtml = ownerHref
    ? `<a class="xologlobe-pin-thumbtack-btn xologlobe-pin-thumbtack-btn--pinned shrink-0" href="${escapeHtml(ownerHref)}" title="Edit pin on profile" aria-label="Edit pin on profile">${thumbtackSvg}</a>`
    : '';

  let footerHtml = '';
  if (hasCoords && ownerHref) {
    footerHtml =
      `<div class="xolo-popup-footer mt-2 flex flex-row flex-wrap items-end justify-between gap-x-3 gap-y-2">` +
      `<div class="min-w-0 flex-1">${localTimeInner}</div>` +
      `<div class="ml-auto flex shrink-0 items-center">${ownerThumbtackHtml}</div>` +
      `</div>`;
  } else if (hasCoords) {
    footerHtml =
      `<p class="xolo-popup-local-time mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-[#9ec9d4]/95" role="group" aria-label="Local time at pin location"><span class="${tailwindLocalTimeClock} shrink-0" aria-hidden="true">${localTimeClockSvg}</span><span class="xolo-popup-local-time-value tabular-nums min-w-0">—</span><span class="xolo-popup-local-time-zone shrink-0 text-[#9ec9d4]/90"></span></p>`;
  } else if (ownerHref) {
    footerHtml =
      `<div class="xolo-popup-footer mt-2 flex flex-row justify-end">${ownerThumbtackHtml}</div>`;
  }

  return (
    `<div class="xolo-popup">` +
    `<h2 class="xolo-popup-title !mb-0">${title}</h2>` +
    `${noteHtml}` +
    `${actionsAndSocialsRow}` +
    `${socialsOnlyHtml}` +
    `${footerHtml}` +
    '</div>'
  );
}
