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

import GsapPageContent from '../components/GsapPageContent';
import GsapPageHeading from '../components/GsapPageHeading';
import GsapSocialLinks from '../components/GsapSocialLinks';
import GsapPageSubHeading from '../components/GsapPageSubHeading';
import { getSocialProfileUrl } from '../common/getSocialProfileUrl';

interface Owner {
  id: number;
  name: string;
  title: string;
  image: string;
  email?: string;
  socials?: {
    twitter?: string;
    discord?: string;
    linkedin?: string;
    tiktok?: string;
    instagram?: string;
    telegram?: string;
  };
}

const owners: Owner[] = [
  {
    id: 1,
    name: 'Cryptonite',
    title: 'Founder & Visionary Explorer',
    image: '/team/Cryptonite.jpg',
    email: 'xrparmyis@gmail.com',
    socials: {
      twitter: 'XoloDojo',
      discord: 'XoloDojo',
      linkedin: '#',
      tiktok: 'XoloDojo',
      instagram: 'XoloDojo',
      telegram: 'XoloDojo',
    },
  },
  {
    id: 2,
    name: 'RedShadow',
    title: 'Visionary Artist & Cultural Alchemist',
    image: '/team/RedShadow.jpg',
    email: 'redshadow@xolodojo.com',
    socials: {
      twitter: '#',
      discord: '#',
      linkedin: '#',
      tiktok: '#',
      instagram: '#',
      telegram: '#',
    },
  },
  {
    id: 3,
    name: 'Code',
    title: 'Lead Builder & Degen Architect',
    image: '/team/Code2.jpg',
    email: 'code@xolodojo.com',
    socials: {
      twitter: '#',
      discord: '#',
      linkedin: '#',
      tiktok: '#',
      instagram: '#',
      telegram: '#',
    },
  },
];

function OwnerCard({ owner }: { owner: Owner }) {
  const isValidLink = (s?: string) => !!s && s !== '#' && s.trim() !== '';
  return (
    <div className="flex flex-col items-center text-center">
      <div className="mb-4 overflow-hidden rounded-lg w-full max-w-xs">
        <img
          src={owner.image}
          alt={owner.name}
          className="w-full h-auto object-cover"
        />
      </div>
      <h3 className="text-xl md:text-2xl font-bold text-[#ad3dab] mb-1">
        {owner.name}
      </h3>
      <p className="text-sm md:text-base mb-4">{owner.title}</p>
      <GsapSocialLinks>
        {isValidLink(owner.email) && (
          <a
            href={`mailto:${owner.email}`}
            title="Email"
            aria-label={`Email ${owner.name}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-[#b7e9f7] text-[#cdcdcd] hover:text-white hover:bg-[#b7e9f7]/80 transition-all duration-300 ease-in-out"
          >
            <FontAwesomeIcon icon={faEnvelope} size="sm" />
          </a>
        )}
        {isValidLink(owner.socials?.twitter) && (
          <a
            href={getSocialProfileUrl('twitter', owner.socials?.twitter ?? '')}
            title="X (Twitter)"
            aria-label={`${owner.name} on X (Twitter)`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-[#b7e9f7] text-[#cdcdcd] hover:text-white hover:bg-[#b7e9f7]/80 transition-all duration-300 ease-in-out"
          >
            <FontAwesomeIcon icon={faXTwitter} size="sm" />
          </a>
        )}
        {isValidLink(owner.socials?.discord) && (
          <a
            href={getSocialProfileUrl('discord', owner.socials?.discord ?? '')}
            title="Discord"
            aria-label={`${owner.name} on Discord`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-[#b7e9f7] text-[#cdcdcd] hover:text-white hover:bg-[#b7e9f7]/80 transition-all duration-300 ease-in-out"
          >
            <FontAwesomeIcon icon={faDiscord} size="sm" />
          </a>
        )}
        {isValidLink(owner.socials?.linkedin) && (
          <a
            href={getSocialProfileUrl(
              'linkedin',
              owner.socials?.linkedin ?? ''
            )}
            title="LinkedIn"
            aria-label={`${owner.name} on LinkedIn`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-[#b7e9f7] text-[#cdcdcd] hover:text-white hover:bg-[#b7e9f7]/80 transition-all duration-300 ease-in-out"
          >
            <FontAwesomeIcon icon={faLinkedinIn} size="sm" />
          </a>
        )}
        {isValidLink(owner.socials?.tiktok) && (
          <a
            href={getSocialProfileUrl('tiktok', owner.socials?.tiktok ?? '')}
            title="TikTok"
            aria-label={`${owner.name} on TikTok`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-[#b7e9f7] text-[#cdcdcd] hover:text-white hover:bg-[#b7e9f7]/80 transition-all duration-300 ease-in-out"
          >
            <FontAwesomeIcon icon={faTiktok} size="sm" />
          </a>
        )}
        {isValidLink(owner.socials?.instagram) && (
          <a
            href={getSocialProfileUrl(
              'instagram',
              owner.socials?.instagram ?? ''
            )}
            title="Instagram"
            aria-label={`${owner.name} on Instagram`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-[#b7e9f7] text-[#cdcdcd] hover:text-white hover:bg-[#b7e9f7]/80 transition-all duration-300 ease-in-out"
          >
            <FontAwesomeIcon icon={faInstagram} size="sm" />
          </a>
        )}
        {isValidLink(owner.socials?.telegram) && (
          <a
            href={getSocialProfileUrl(
              'telegram',
              owner.socials?.telegram ?? ''
            )}
            title="Telegram"
            aria-label={`${owner.name} on Telegram`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-[#b7e9f7] text-[#cdcdcd] hover:text-white hover:bg-[#b7e9f7]/80 transition-all duration-300 ease-in-out"
          >
            <FontAwesomeIcon icon={faTelegram} size="sm" />
          </a>
        )}
      </GsapSocialLinks>
    </div>
  );
}

function Team() {
  return (
    <div className="[&_p]:text-[#decee9] [&_ul]:text-[#decee9] [&_li]:text-[#decee9] [&_li>span]:text-[#decee9]">
      <section className="relative bg-[url('/Pattern.png')] bg-cover bg-center bg-no-repeat pt-16 pb-4 md:pt-30 border-b border-[#36e9e424]">
        <div className="max-w-4xl mx-auto [&_p]:text-[#decee9] [&_ul]:text-[#decee9] [&_li]:text-[#decee9] [&_li>span]:text-[#decee9]">
          <GsapPageHeading
            eyebrow="Meet the XoloDojo Team"
            heading="A Sacred Legacy of"
            accent="Friendship, Grind, & Perseverance"
            iconType="star"
            iconCount={1}
            centered
          />
          <GsapPageContent as="p" className="mb-4">
            United by culture, art, and crypto, we're forging XoloDojo and
            Xglobe: a token-gated global tribe for trust, travel, skill-sharing,
            and real-world adventures. Together, we're not just minting NFTs —
            we're building a network of passionate individuals ready to connect,
            collaborate, and build the future.
          </GsapPageContent>
        </div>
        <div className="container mx-auto max-w-7xl px-4">
          <GsapPageContent
            className="my-8 flex flex-col items-center text-center"
            delay={0}
          >
            <div className="mt-4 grid grid-cols-1 gap-8 md:gap-10 lg:grid-cols-3">
              {owners.map(owner => (
                <OwnerCard key={owner.id} owner={owner} />
              ))}
            </div>
          </GsapPageContent>
        </div>
      </section>

      <section className="relative overflow-hidden py-8 lg:py-12 bg-(--bg)">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <GsapPageSubHeading heading="Meet the XoloDojo Team" />

            <GsapPageContent className="mt-8" delay={0.12}>
              <h3 className="text-2xl text-center md:text-left md:text-3xl font-bold text-[#28aae4]">
                Cryptonite
              </h3>
              <h4 className="text-lg text-center md:text-left md:text-xl font-semibold text-[#642ff8] mb-4">
                Founder & Visionary Explorer
              </h4>
              <div>
                <img
                  src="/xolo-nft-showcase-01.png"
                  alt="Cryptonite"
                  className="float-left mr-6 mb-3 mt-2 w-[148px] max-w-[45vw] rounded-md"
                />
                <p className="text-justify">
                  Cryptonite is a nomadic, blockchain-agnostic digital pirate
                  who's been sailing the Cryptocurrenseas since 2016, with
                  footprints in 34 countries that have shaped a deep
                  appreciation for diverse cultures and meaningful connections.
                  A proud XRP Army member marching forward with bullish
                  conviction, he's the creator behind The Xoloitzquintle
                  Collection on the XRPL — fusing ancient Mesoamerican reverence
                  for the sacred Xoloitzquintle with modern innovation and
                  genuine shared experiences. He's laying the foundation for
                  Xglobe: a global, member-built dojo for trust, travel,
                  skill-sharing, and soul-guided adventures — all powered by
                  XoloDojo. Own a XoloNFT and join the voyage. If you ain't
                  bullish, you're walking the plank.
                </p>
              </div>
            </GsapPageContent>

            <GsapPageContent className="mt-8" delay={0.2}>
              <h3 className="text-2xl text-center md:text-left md:text-3xl font-bold text-[#28aae4]">
                RedShadow
              </h3>
              <h4 className="text-lg text-center md:text-left md:text-xl font-semibold text-[#642ff8] mb-4">
                Artist & Cultural Alchemist
              </h4>
              <div>
                <img
                  src="/xolo-nft-showcase-01.png"
                  alt="RedShadow"
                  className="float-left mr-6 mb-3 mt-2 w-[148px] max-w-[45vw] rounded-md"
                />
                <p className="text-justify">
                  RedShadow is the visionary artist breathing life into The
                  Xoloitzquintle Collection. With a masterful eye for detail and
                  deep respect for Mesoamerican heritage, RedShadow crafts each
                  of the 10,001 unique XoloNFTs as sacred digital guardians —
                  blending timeless cultural symbolism with striking, evocative
                  designs that honor the Xoloitzquintle's role as a spiritual
                  companion and soul guide. Teaming with Cryptonite, RedShadow's
                  artistry forms the visual heart of XoloDojo and Xglobe,
                  inviting holders into a world where ancient legacy meets
                  modern community and real-world reciprocity.
                </p>
              </div>
            </GsapPageContent>

            <GsapPageContent className="mt-8" delay={0.28}>
              <h3 className="text-2xl text-center md:text-left md:text-3xl font-bold text-[#28aae4]">
                Code
              </h3>
              <h4 className="text-lg text-center md:text-left md:text-xl font-semibold text-[#642ff8] mb-4">
                Lead Builder & Degen Architect
              </h4>
              <div>
                <img
                  src="/xolo-nft-showcase-01.png"
                  alt="Code"
                  className="float-left mr-6 mb-3 mt-2 w-[148px] max-w-[45vw] rounded-md"
                />
                <p className="text-justify">
                  Code is a battle-hardened degen from the golden Clubhouse days
                  on Ethereum, a seasoned crypto trader with razor-sharp market
                  instincts and hands-on building experience. Fluid in React.js
                  and battle-tested in high-stakes web development, he's shipped
                  name-brand websites (under NDA) for top players in the space.
                  Now building with the Xolo pack on XRPL, Code delivers the
                  technical backbone for XoloDojo and Xglobe — turning visionary
                  ideas into seamless, secure, token-gated experiences. From
                  smart community tools to immersive interfaces, he ensures the
                  dojo runs smoothly, the globe connects flawlessly, and the
                  pack thrives in Web3. Degen roots. Builder soul. Xolo loyalty.
                </p>
              </div>
            </GsapPageContent>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Team;
