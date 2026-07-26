import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faDiscord,
  faXTwitter,
  faTiktok,
  faInstagram,
  faTelegram,
  faLinkedinIn,
} from '@fortawesome/free-brands-svg-icons';
import { faEnvelope } from '@fortawesome/free-solid-svg-icons';

import GsapSocialLinks from './GsapSocialLinks';
import { getSocialProfileUrl } from '../common/getSocialProfileUrl';

export interface TeamMemberSocials {
  twitter?: string;
  discord?: string;
  linkedin?: string;
  tiktok?: string;
  instagram?: string;
  telegram?: string;
}

interface TeamMemberSocialLinksProps {
  name: string;
  email?: string;
  socials?: TeamMemberSocials;
  className?: string;
}

const linkClassName =
  'inline-flex items-center justify-center w-8 h-8 md:w-9 md:h-9 rounded-full border border-[#b7e9f7] text-[#cdcdcd] hover:text-white hover:bg-[#b7e9f7]/80 transition-all duration-300 ease-in-out';

function isValidLink(s?: string) {
  return !!s && s !== '#' && s.trim() !== '';
}

function TeamMemberSocialLinks({
  name,
  email,
  socials,
  className = '',
}: TeamMemberSocialLinksProps) {
  const links = [
    isValidLink(email) && (
      <a
        key="email"
        href={`mailto:${email}`}
        title="Email"
        aria-label={`Email ${name}`}
        target="_blank"
        rel="noopener noreferrer"
        className={linkClassName}
      >
        <FontAwesomeIcon icon={faEnvelope} size="sm" />
      </a>
    ),
    isValidLink(socials?.twitter) && (
      <a
        key="twitter"
        href={getSocialProfileUrl('twitter', socials?.twitter ?? '')}
        title="X (Twitter)"
        aria-label={`${name} on X (Twitter)`}
        target="_blank"
        rel="noopener noreferrer"
        className={linkClassName}
      >
        <FontAwesomeIcon icon={faXTwitter} size="sm" />
      </a>
    ),
    isValidLink(socials?.discord) && (
      <a
        key="discord"
        href={getSocialProfileUrl('discord', socials?.discord ?? '')}
        title="Discord"
        aria-label={`${name} on Discord`}
        target="_blank"
        rel="noopener noreferrer"
        className={linkClassName}
      >
        <FontAwesomeIcon icon={faDiscord} size="sm" />
      </a>
    ),
    isValidLink(socials?.linkedin) && (
      <a
        key="linkedin"
        href={getSocialProfileUrl('linkedin', socials?.linkedin ?? '')}
        title="LinkedIn"
        aria-label={`${name} on LinkedIn`}
        target="_blank"
        rel="noopener noreferrer"
        className={linkClassName}
      >
        <FontAwesomeIcon icon={faLinkedinIn} size="sm" />
      </a>
    ),
    isValidLink(socials?.tiktok) && (
      <a
        key="tiktok"
        href={getSocialProfileUrl('tiktok', socials?.tiktok ?? '')}
        title="TikTok"
        aria-label={`${name} on TikTok`}
        target="_blank"
        rel="noopener noreferrer"
        className={linkClassName}
      >
        <FontAwesomeIcon icon={faTiktok} size="sm" />
      </a>
    ),
    isValidLink(socials?.instagram) && (
      <a
        key="instagram"
        href={getSocialProfileUrl('instagram', socials?.instagram ?? '')}
        title="Instagram"
        aria-label={`${name} on Instagram`}
        target="_blank"
        rel="noopener noreferrer"
        className={linkClassName}
      >
        <FontAwesomeIcon icon={faInstagram} size="sm" />
      </a>
    ),
    isValidLink(socials?.telegram) && (
      <a
        key="telegram"
        href={getSocialProfileUrl('telegram', socials?.telegram ?? '')}
        title="Telegram"
        aria-label={`${name} on Telegram`}
        target="_blank"
        rel="noopener noreferrer"
        className={linkClassName}
      >
        <FontAwesomeIcon icon={faTelegram} size="sm" />
      </a>
    ),
  ].filter(Boolean);

  if (links.length === 0) {
    return null;
  }

  return (
    <GsapSocialLinks className={className}>
      {links}
    </GsapSocialLinks>
  );
}

export default TeamMemberSocialLinks;
