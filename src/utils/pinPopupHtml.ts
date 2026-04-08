import { icon } from '@fortawesome/fontawesome-svg-core';
import {
  faDiscord,
  faInstagram,
  faLinkedinIn,
  faTelegram,
  faTiktok,
  faXTwitter,
} from '@fortawesome/free-brands-svg-icons';
import { pinWebsiteStorageToHref } from './pinWebsiteUrl';

/** Data needed to render the same popup markup as XoloGlobe / pin form preview. */
export interface PinPopupContent {
  token_id: string;
  title?: string | null;
  pin_note?: string | null;
  /** Host/path only (e.g. example.com); rendered as https://… */
  website_url?: string | null;
  socials?: Partial<Record<SocialPlatformKey, string>> | null;
  /**
   * When both are set, the popup includes a “Local time” row; Mapbox code updates
   * `.xolo-popup-local-time-value` every second from the pin coordinates.
   */
  latitude?: number;
  longitude?: number;
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

  const socialsHtml =
    socials.length > 0
      ? `<div class="xolo-popup-socials flex flex-row flex-wrap gap-0.5 mt-2">${socials.join('')}</div>`
      : '';

  const noteRaw =
    typeof pin.pin_note === 'string'
      ? pin.pin_note.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim()
      : '';
  const noteHtml = noteRaw
    ? `<p class="xolo-popup-note mt-1 text-sm">${escapeHtml(noteRaw)}</p>`
    : '';

  const websiteHref = pinWebsiteStorageToHref(pin.website_url);
  const websiteHtml = websiteHref
    ? `<p class="xolo-popup-website mt-2"><a class="text-sm font-medium text-cyan-300/95 underline decoration-cyan-400/50 underline-offset-2 hover:text-cyan-200 hover:decoration-cyan-300" href="${escapeHtml(websiteHref)}" target="_blank" rel="noopener noreferrer">Website/Project</a></p>`
    : '';

  const hasCoords =
    typeof pin.latitude === 'number'
    && typeof pin.longitude === 'number'
    && Number.isFinite(pin.latitude)
    && Number.isFinite(pin.longitude);
  const localTimeHtml = hasCoords
    ? `<p class="xolo-popup-local-time mt-1.5 text-xs text-[#9ec9d4]/95"><span class="font-semibold text-[#C9E8E9]">Local time:</span> <span class="xolo-popup-local-time-value tabular-nums">—</span></p>`
    : '';

  return (
    `<div class="xolo-popup">` +
    `<h2 class="xolo-popup-title">${title}</h2>` +
    `${localTimeHtml}` +
    `${noteHtml}` +
    `${websiteHtml}` +
    `${socialsHtml}` +
    '</div>'
  );
}
