import { useEffect, useRef, useState, type ReactNode } from 'react';

import GsapPageContent from '../components/GsapPageContent';
import GsapPageHeading from '../components/GsapPageHeading';
import SectionParallaxBlobs from '../components/SectionParallaxBlobs';
import CounterSection from '../components/CounterSection';

import { useSectionParallaxOffsets } from '../hooks/useSectionParallaxOffsets';
import MintCountdownSection from '../components/MintCountdownSection';

type LegacyStoryRow = {
  id: string;
  imageAtLg: 'left' | 'right';
  imageSrc: string;
  imageAlt: string;
  /** Tailwind border-color utility (include the `border-` prefix), e.g. `border-cyan-400` or `border-[#b7e9f7]`. */
  borderColor: string;
  eyebrow: string;
  title: ReactNode;
  body: ReactNode;
};

const LEGACY_STORY_ROWS: LegacyStoryRow[] = [
  {
    id: 'ancient',
    imageAtLg: 'left',
    imageSrc: '/home/GhostXoloGecko.jpg',
    imageAlt: 'Ghost Xolo Gecko',
    borderColor: 'border-cyan-400',
    eyebrow: 'The XoloDojo',
    title: (
      <>
        The XoloDojo: 道 (Dō), meaning "path" or "way," and 場 (Jō), meaning
        "place."
      </>
    ),
    body: (
      <>
        <p className="mb-4">
          Welcome to the XoloDojo — a sacred digital sanctuary rooted in the
          Xoloitzquintli’s timeless values of unwavering loyalty, transformative
          guardianship, deep respect, humility, resilience, and shared
          reverence.{' '}
        </p>
        <p className="mb-4">
          These principles form the ethical heart of our community — a space of
          trust, honor, and genuine harmony where every holder is welcomed as
          family. At the living heart of the XoloDojo is Xglobe, a token-gated
          global platform where you network wallet-to-wallet, share skills and
          cultures, and forge real person-to-person adventures across the
          planet.
        </p>
        <p>
          XoloDojo members are represented by their XoloNFT pinned on the
          Xglobe, symbolising a personal talisman and lifelong companion
          inviting you to step into a growing circle of aligned souls, pin your
          place in history, and co-create a legacy of connection, community, and
          future growth. LfG!!! Own your Xolo. Own your Adventure. Own your
          Journey.
        </p>
      </>
    ),
  },
  {
    id: 'team',
    imageAtLg: 'right',
    imageSrc: '/home/TeamFireXolo.jpg',
    imageAlt: 'Team Fire Xolo',
    borderColor: 'border-emerald-400',
    eyebrow: 'Introducing Team Fire',
    title: <>Cryptonite, Code &amp; RedShadow</>,
    body: (
      <>
        <p className="mb-4">
          Meet the XoloDojo Team — a driven global crew of three grinding hard,
          dreaming big, and shooting for the moon together.
        </p>
        <p className="mb-4">
          Cryptonite, the degen founder and networking visionary currently
          residing in Anchorage, Alaska, is the spark who turned raw ideas into
          a living vision of trust and real-world connection.
        </p>
        <p className="mb-4">
          Code, the battle-hardened coding wizard based in the Silicon Valley of
          California, has been building since the Commodore 64 days and now
          serves as the github guru and technical architect powering the
          XoloDojo & Xglobe community ecosystem.
        </p>
        <p className="mb-4">
          RedShadow, the passionate artist and loyal hired gun from Pakistan,
          pours his soul the passionate artist and loyal hired gun from
          Pakistan, pours his soul into every hand-drawn trait on the iPad,
          crafting the visual heartbeat of the collection.
        </p>
        <p className="mb-4">
          This unstoppable trio — united by grit, loyalty, and relentless drive
          — is forging the XoloDojo and Xglobe from the ground up. Men of few
          words, dive a bit more into their stories, passions, and journeys on
          the Team page and see how their combined fire is building a community
          where every holder truly belongs. If you ain't bullish, you're
          foolish!!! Own a Xolo. Own the Adventure. Own your Journey.
        </p>
      </>
    ),
  },
  {
    id: 'utility',
    imageAtLg: 'left',
    imageSrc: '/home/AbstractXoloBlue.jpg',
    imageAlt: 'Abstract Xolo Blue',
    borderColor: 'border-sky-400',
    eyebrow: 'A Vision of Unity &amp; Connection',
    title: <>Fostering Global Travel &amp; Connection</>,
    body: (
      <>
        The collection&apos;s long-term vision is to build a decentralized
        platform for Xolo NFT holders to network and share travel experiences,
        fostering global connection through wallet-to-wallet networking and
        person to person experiences on the XRPL.
      </>
    ),
  },
  {
    id: 'utility',
    imageAtLg: 'right',
    imageSrc: '/home/StaindGlassXoloSkiGoggles.jpg',
    imageAlt: 'Staind Glass Xolo',
    borderColor: 'border-fuchsia-400',
    eyebrow: 'Mint',
    title: <>Fostering Global Travel &amp; Connection</>,
    body: (
      <>
        The collection&apos;s long-term vision is to build a decentralized
        platform for Xolo NFT holders to network and share travel experiences,
        fostering global connection through wallet-to-wallet networking and
        person to person experiences on the XRPL.
      </>
    ),
  },
  {
    id: 'utility',
    imageAtLg: 'left',
    imageSrc: '/home/SpacesuitXoloRed.jpg',
    imageAlt: 'Spacesuit Xolo',
    borderColor: 'border-amber-400',
    eyebrow: 'Xglobe',
    title: <>Fostering Global Travel &amp; Connection</>,
    body: (
      <>
        The collection&apos;s long-term vision is to build a decentralized
        platform for Xolo NFT holders to network and share travel experiences,
        fostering global connection through wallet-to-wallet networking and
        person to person experiences on the XRPL.
      </>
    ),
  },
];

/** Stagger for welcome section service rows (GsapPageContent `delay`). */
const SERVICE_ROW_DELAY = [0, 0.06, 0.12, 0.18] as const;

function Home() {
  const projectSectionRef = useRef<HTMLElement>(null);
  const projectColorBgRef = useRef<HTMLDivElement>(null);

  const [projectBlobOffset, setProjectBlobOffset] = useState(0);

  const { sectionRef, bgShapeOffset, colorBgOffset, colorBg2Offset } =
    useSectionParallaxOffsets();

  useEffect(() => {
    const handleProjectScroll = () => {
      if (!projectSectionRef.current) return;

      const rect = projectSectionRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      if (rect.top <= windowHeight && rect.bottom >= 0) {
        const sectionTop = rect.top;
        const sectionHeight = rect.height;

        const scrollProgress = Math.max(
          0,
          (windowHeight - sectionTop) / (windowHeight + sectionHeight)
        );
        const offset = scrollProgress * sectionHeight * 0.4;

        setProjectBlobOffset(offset);
      } else {
        setProjectBlobOffset(0);
      }
    };

    window.addEventListener('scroll', handleProjectScroll, { passive: true });
    handleProjectScroll();

    return () => window.removeEventListener('scroll', handleProjectScroll);
  }, []);

  return (
    <>
      <section
        className="relative z-[9] overflow-hidden border-b border-[#36e9e424] bg-cover bg-center bg-no-repeat pt-[210px] pb-0 max-[1199px]:pt-[170px] max-[1199px]:pb-[100px] max-[991px]:pb-20"
        style={{ backgroundImage: "url('/hero-bg-3.png')" }}
      >
        <GsapPageContent
          className="mt-[150px] h-[320px] w-full max-[1199px]:mt-[50px] max-[1199px]:h-[150px] max-[575px]:h-20 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/hero-1.png')" }}
          delay={0}
        />
      </section>

      <section
        ref={sectionRef}
        className="relative overflow-hidden py-4 lg:py-12"
      >
        <SectionParallaxBlobs
          bgShapeOffset={bgShapeOffset}
          colorBgOffset={colorBgOffset}
          colorBg2Offset={colorBg2Offset}
        />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <GsapPageHeading
            eyebrow="Welcome to the XoloDojo"
            heading="A Sacred Legacy of"
            accent="Art, Culture, & XRPL"
            iconType="star"
            iconCount={1}
            centered
          />
          <MintCountdownSection />
          <div className="mt-8 flex flex-col items-center gap-6">
            <GsapPageContent
              className="mx-auto w-full max-w-4xl"
              delay={SERVICE_ROW_DELAY[0]}
            >
              <div className="mt-[30px] flex flex-col items-center justify-center gap-4 md:flex-row md:items-start md:gap-6">
                <div className="max-w-75 shrink-0">
                  <img
                    src="/xolo-art.png"
                    alt="Xolo NFT Art"
                    className="min-w-25 w-65 rounded-[20px] object-cover md:w-[320px] lg:w-95"
                  />
                </div>
                <div className="flex min-w-0 flex-1 flex-col rounded-[25px] border border-[rgba(207,208,212,0.2)] bg-[#1d1d21] p-[50px] text-center max-w-full w-full md:text-left [&_p]:mb-5 [&_p:last-child]:mb-0">
                  <h3 className="text-xl font-bold md:text-2xl mb-[15px]">
                    10,001 Unique NFT Masterpieces
                  </h3>
                  <p>
                    A meaningful collection featuring 10,001 unique Xolo NFTs
                    with a combination of 11 distinct traits and 311 sub traits,
                    hand-drawn by RedShadow.
                  </p>
                </div>
              </div>
            </GsapPageContent>
            <GsapPageContent
              className="mx-auto w-full max-w-4xl"
              delay={SERVICE_ROW_DELAY[1]}
            >
              <div className="mt-[30px] flex flex-col items-center justify-center gap-4 md:flex-row md:items-start md:gap-6">
                <div className="max-w-75 shrink-0">
                  <img
                    src="/xrpl-blockchain.png"
                    alt="XRPL Blockchain"
                    className="min-w-25 w-65 rounded-[20px] object-cover md:w-[320px] lg:w-95"
                  />
                </div>
                <div className="flex min-w-0 flex-1 flex-col rounded-[25px] border border-[rgba(207,208,212,0.2)] bg-[#1d1d21] p-[50px] text-center max-w-full w-full md:text-left [&_p]:mb-5 [&_p:last-child]:mb-0">
                  <h3 className="text-xl font-bold md:text-2xl mb-[15px]">
                    Built on the XRP Ledger (XRPL)
                  </h3>
                  <p>
                    Hosted on the XRPL for its high speed payments, low-cost
                    transactions, and eco-friendly design.
                  </p>
                </div>
              </div>
            </GsapPageContent>
            <GsapPageContent
              className="mx-auto w-full max-w-4xl"
              delay={SERVICE_ROW_DELAY[2]}
            >
              <div className="mt-[30px] flex flex-col items-center justify-center gap-4 md:flex-row md:items-start md:gap-6">
                <div className="max-w-75 shrink-0">
                  <img
                    src="/xolo-travel.png"
                    alt="Xolo Travel Vision"
                    className="min-w-25 w-65 rounded-[20px] object-cover md:w-[320px] lg:w-95"
                  />
                </div>
                <div className="flex min-w-0 flex-1 flex-col rounded-[25px] border border-[rgba(207,208,212,0.2)] bg-[#1d1d21] p-[50px] text-center max-w-full w-full md:text-left [&_p]:mb-5 [&_p:last-child]:mb-0">
                  <h3 className="text-xl font-bold md:text-2xl mb-[15px]">
                    Decentralized Travel Vision
                  </h3>
                  <p>
                    Our long-term goal: a platform for holders to network, share
                    skills, and explore the world person to person, interacting
                    wallet-to-wallet to foster global connection through travel
                    experiences on the XRPL.
                  </p>
                </div>
              </div>
            </GsapPageContent>
            <GsapPageContent
              className="mx-auto w-full max-w-4xl"
              delay={SERVICE_ROW_DELAY[3]}
            >
              <div className="mt-[30px] flex flex-col items-center justify-center gap-4 md:flex-row md:items-start md:gap-6">
                <div className="max-w-75 shrink-0">
                  <img
                    src="/xrp-cafe-mint.png"
                    alt="XRP Cafe Mint"
                    className="min-w-25 w-65 rounded-[20px] object-cover md:w-[320px] lg:w-95"
                  />
                </div>
                <div className="flex min-w-0 flex-1 flex-col rounded-[25px] border border-[rgba(207,208,212,0.2)] bg-[#1d1d21] p-[50px] text-center max-w-full w-full md:text-left [&_p]:mb-5 [&_p:last-child]:mb-0">
                  <h3 className="text-xl font-bold md:text-2xl mb-[15px]">
                    Upcoming Mint in the xrp.cafe
                  </h3>
                  <p>
                    Prepare your Xaman or Joey wallet with recommended 20 XRP
                    minimum reserve for the Xoloitzquintle mint on the XRPL.
                  </p>
                </div>
              </div>
            </GsapPageContent>
          </div>
        </div>
      </section>

      <section
        ref={projectSectionRef}
        className="relative overflow-visible border-t border-[#36e9e424] bg-[var(--bg)] bg-cover py-8"
        style={{ backgroundImage: "url('/line-shape.png')" }}
      >
        <div
          ref={projectColorBgRef}
          className="pointer-events-none absolute -z-10"
          style={{
            top: '-12%',
            right: '-50px',
            transform: `translateY(${projectBlobOffset}px)`,
            willChange: 'transform',
            transition: 'transform 0.1s ease-out',
            filter: 'brightness(1.2)',
          }}
        >
          <img src="/color-bg-shape-2.png" alt="" aria-hidden />
        </div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col gap-12 lg:gap-16">
            {LEGACY_STORY_ROWS.map((row, index) => {
              const imageLeft = row.imageAtLg === 'left';
              return (
                <GsapPageContent
                  key={row.id}
                  className="flex w-full flex-col gap-3 sm:gap-4 lg:flex-row lg:items-center lg:gap-5"
                  delay={index * 0.06}
                >
                  <div
                    className={`min-w-0 w-full lg:w-1/2 order-1 ${
                      imageLeft ? 'lg:order-1' : 'lg:order-2'
                    }`}
                  >
                    <div
                      className={`w-full transition-transform duration-300 ease-in-out ${
                        imageLeft
                          ? 'hover:rotate-[10deg]'
                          : 'hover:-rotate-[10deg]'
                      }`}
                    >
                      <img
                        src={row.imageSrc}
                        alt={row.imageAlt}
                        className={`h-auto w-full rounded-[50px] object-cover max-w-[480px] border-2 lg:max-w-full mx-auto ${row.borderColor}`}
                      />
                    </div>
                  </div>
                  <div
                    className={`min-w-0 w-full lg:w-1/2 order-2 ${
                      imageLeft ? 'lg:order-2' : 'lg:order-1'
                    }`}
                  >
                    <div className="flex min-w-0 flex-col text-left mt-4 lg:mt-0">
                      <span className="mb-5 inline-block rounded-2xl border border-[rgba(207,208,212,0.2)] px-5 py-2 text-[15px] font-bold leading-none">
                        {row.eyebrow}
                      </span>
                      <h3 className="my-2 lg:mb-6 text-2xl font-bold md:text-3xl lg:text-4xl">
                        {row.title}
                      </h3>
                      <div className="w-full max-w-none leading-relaxed">
                        {row.body}
                      </div>
                    </div>
                  </div>
                </GsapPageContent>
              );
            })}
          </div>
        </div>
      </section>
      <CounterSection />
    </>
  );
}

export default Home;
