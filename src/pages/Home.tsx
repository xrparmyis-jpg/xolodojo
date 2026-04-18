import { useEffect, useRef, useState, type ReactNode } from 'react';

import GsapPageContent from '../components/GsapPageContent';
import GsapPageHeading from '../components/GsapPageHeading';
import SectionParallaxBlobs from '../components/SectionParallaxBlobs';
import CounterSection from '../components/CounterSection';
import XoloitzquintleSlideshow from '../components/XoloitzquintleSlideshow';

import { useSectionParallaxOffsets } from '../hooks/useSectionParallaxOffsets';
import MintCountdownSection from '../components/MintCountdownSection';

type LegacyStoryRow = {
  id: string;
  imageAtLg: 'left' | 'right';
  imageSrc: string;
  imageAlt: string;
  /** Tailwind border-color utility (include the `border-` prefix), e.g. `border-cyan-400` or `border-[#b7e9f7]`. */
  borderColor: string;
  /** Tailwind text-color utility for the section title (e.g. `text-cyan-400`) — pair with `borderColor`. */
  titleColor: string;
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
    titleColor: 'text-cyan-400',
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
    borderColor: 'border-orange-400',
    titleColor: 'text-orange-400',
    eyebrow: 'Cryptonite Labs is Team Fire',
    title: <>Cryptonite, Code &amp; RedShadow</>,
    body: (
      <>
        <p className="mb-4">
          Meet the XoloDojo Team — A team of three building the Xoloitzquintli
          NFT Collection & Xglobe inside the XoloDojo, who are determined and
          dedicated to building and sharing a global dream of uniting people
          together in todays fragmented world.
        </p>
        <p className="mb-4">
          Cryptonite, the project visionary, is the Alaskan spark that ignited
          the flame. Turning bold, raw ideas and a vision into fruition, driven
          by the relentless pursuit of building a community established on a
          network of trusted, real world connections.
        </p>
        <p className="mb-4">
          Code, the battle-hardened California coding wizard based in the
          Silicon Valley, has been writing code since the Commodore 64 days, the
          floppy disk, and the turtle. The github guru is the technical
          architect powering the XoloDojo & Xglobe community ecosystem.
        </p>
        <p className="mb-4">
          RedShadow is the loyal, cultural artist hailing from Pakistan. The
          Pakistani Alchemist is rich in tradition, and the talent behind each
          hand drawn trait that is the Xoloitzquintle NFT Collection, crafting
          the visual heartbeat of each and every Xolo.
        </p>
        <p className="mb-4">
          This unstoppable trio — united in friendship, loyalty, and mutual
          respect, are forever bonded by an eternal flame, with the creation of
          XoloDojo, the stuff of legends, forever on-chain.
        </p>
      </>
    ),
  },
  {
    id: 'utility-vision',
    imageAtLg: 'left',
    imageSrc: '/home/AbstractXoloBlue.jpg',
    imageAlt: 'Abstract Xolo Blue',
    borderColor: 'border-sky-400',
    titleColor: 'text-sky-400',
    eyebrow: 'Pin your presence',
    title: <>Seen on Xglobe. Shared with the world.</>,
    body: (
      <>
        <p className="mb-4">
          Your Xolo gets you seen on Xglobe. The Pinbox is where that presence
          becomes real. Add your name, a brief bio, links and socials,along with
          what you offer or are seeking--drop your pin on the map and let the
          world know where you stand.
        </p>
        <p className="mb-4">
          Pin your location, where you're headed, what you're building, in need
          of, or perhaps you have a service/skill to exchange. A meetup over
          coffee for an oppurtunity you want to spark. It can be your intro,
          your signal, your invition, or your shot at finding like-minded people
          who move with purpose, curiosity, positive vibes and good energy.
        </p>
        <p className="mb-4">
          Each Xolo minted gets you a pin and pinbox, with built-in local date
          and time, making every connection immediate, human, and real. Inside
          the XoloDojo, community is just a pin away.
        </p>
        <p>One Pin. One Bond. One Heartbeat.</p>
      </>
    ),
  },
  {
    id: 'utility-mint',
    imageAtLg: 'right',
    imageSrc: '/home/StaindGlassXoloSkiGoggles.jpg',
    imageAlt: 'Staind Glass Xolo',
    borderColor: 'border-fuchsia-400',
    titleColor: 'text-fuchsia-400',
    eyebrow: 'The Collection',
    title: <>The Xoloitzquintle NFT Collection</>,
    body: (
      <>
        <p className="mb-4">
          10,001 Xolos. Clean traits. Straight fire. Built different. Built on
          the XRPL for its eco-friendly design, fast payments, and low fees, the
          collection draws from 11 distinct traits and 311 sub-traits, all
          hand-drawn by the teams talented artist, RedShadow.{' '}
        </p>
        <p className="mb-4">
          Every Xolo carries its own energy--from sacred, sharp, chaotic, and
          calm, to dripped out or quietly legendary. Some have attitude like
          they know they're gonna get minted first! This is not filler. This is
          the hunt for your Xolo.
        </p>
        <p className="mb-4">
          Inside XoloDojo, your Xolo unlocks Xglobe, so when you arrive, your
          loyal guide and companion will be right there by your side.{' '}
        </p>
        <p>
          Looks like alpha, feels like legacy, sprinkled with a lil degen and
          prepared with a whole lot of heart.
        </p>
      </>
    ),
  },
  {
    id: 'utility-xglobe',
    imageAtLg: 'left',
    imageSrc: '/home/SpacesuitXoloRed.jpg',
    imageAlt: 'Spacesuit Xolo',
    borderColor: 'border-amber-400',
    titleColor: 'text-amber-400',
    eyebrow: 'Unlock Xglobe',
    title: <>Connect on Xglobe</>,
    body: (
      <>
        <p className="mb-4">
          Xgolobe is where the XoloDojo comes alive at full scale--a live
          token-gated world built for movement, connection, exchange, and
          adventure. Holders can meet up, share culture, trade skills, promote
          what they offer, and create real experiences across multiple cities,
          countries, and time zones.
        </p>

        <p className="mb-4">
          This is where the collection stops standing still and becomes not just
          a collectible held in a crypto wallet, but rather a key for a living
          network with energy, reach, and real human upside.
        </p>

        <p className="mb-4">
          Your Xolo gives you a place to land your plane, dock your boat, and
          park your car, with an agenda to turn travelers into locals, strangers
          into allies, and foster global connection through person to person
          networking, utilizing wallet to wallet transactions with XRP on the
          XRPL.
        </p>

        <p>One Pin. One Pinbox. One Xglobe.</p>
      </>
    ),
  },
  {
    id: 'utility-xglobe',
    imageAtLg: 'right',
    imageSrc: '/home/SpacesuitXoloRed.jpg',
    imageAlt: 'Spacesuit Xolo',
    borderColor: 'border-amber-400',
    titleColor: 'text-amber-400',
    eyebrow: 'A Vision of Global Connection',
    title: <>Built for the long game</>,
    body: (
      <>
        <p className="mb-4">
          The mint is the beginning, not the just the finish line. XoloDojo is
          being built as a living ecosystem fostering collection, collaboration,
          travel, culture, and community, expanding across time zones and time
          itself.
        </p>

        <p className="mb-4">
          The Xolos open the door. Xglobe gives the world a stage. The PinBox
          provides the presence. What brings it all to life is the networking
          collaborations that grow from there; the movement, the people, the
          stories, and the journey back home.
        </p>

        <p className="mb-4">
          The Xoloitzquintle collection is for the community to bond with, build
          with, grow with, and thrive.
        </p>

        <p>One Xglobe. One Pin. One Pinbox.</p>
      </>
    ),
  },

  {
    id: 'utility-xglobe',
    imageAtLg: 'left',
    imageSrc: '/home/SpacesuitXoloRed.jpg',
    imageAlt: 'Spacesuit Xolo',
    borderColor: 'border-amber-400',
    titleColor: 'text-amber-400',
    eyebrow: 'A Vision of Global Connection',
    title: <>Built for the long game</>,
    body: (
      <>
        <p className="mb-4">
          The mint is the beginning, not the just the finish line. XoloDojo is
          being built as a living ecosystem fostering collection, collaboration,
          travel, culture, and community, expanding across time zones and time
          itself.
        </p>

        <p className="mb-4">
          The Xolos open the door. Xglobe gives the world a stage. The PinBox
          provides the presence. What brings it all to life is the networking
          collaborations that grow from there; the movement, the people, the
          stories, and the journey back home.
        </p>

        <p className="mb-4">
          The Xoloitzquintle collection is for the community to bond with, build
          with, grow with, and thrive.
        </p>

        <p>One Xglobe. One Pin. One Pinbox.</p>
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
          <GsapPageContent className="mx-auto w-full max-w-4xl">
            <>
              <p>
                The website is live. The mint comes next. The Xglobe awaits.
                This starts with a mint, but the alpha lives in your Pinbox,
                lock in and be ready when we flip the switch. When the countdown
                hits zero, the timer morphs into the mint button and sends you
                straight to the mint in the xrp.cafe. Your Xolo awaits!! After
                mint, return to the Dojo, connect your wallet, fill out your
                Pinbox, and get scene on Xglobe. Built on the XRP Ledger (XRPL)
                for its high speed payments, low-cost transactions,
                decentralized and eco-friendly design, this collection is
                straight fire and bringing the heat, and a whole lot of heart.
                One Xolo. One Pin. One Love.
              </p>
            </>
          </GsapPageContent>
          <GsapPageContent className="mt-12 flex justify-center" delay={0.72}>
            <XoloitzquintleSlideshow />
          </GsapPageContent>
          <GsapPageContent className="mx-auto w-full max-w-4xl">
            <h3 className="text-center text-xl font-bold md:text-2xl mt-8">
              Launch Alert: The Final Countdown
            </h3>
          </GsapPageContent>
          <MintCountdownSection />
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
                      <span
                        className={`mb-5 inline-block w-fit max-w-full self-center rounded-2xl border ${row.borderColor} px-8 py-2 text-center text-[15px] font-bold leading-none`}
                      >
                        {row.eyebrow}
                      </span>
                      <h3
                        className={`text-center my-2 lg:mb-6 text-2xl font-bold md:text-3xl lg:text-4xl ${row.titleColor}`}
                      >
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
