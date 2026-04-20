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
    id: 'Ghost-Xolo-Gecko',
    imageAtLg: 'left',
    imageSrc: '/home/GhostXoloGecko.jpg',
    imageAlt: 'Ghost Xolo Gecko',
    borderColor: 'border-green-500',
    titleColor: 'text-green-500',
    eyebrow: 'The XoloDojo',
    title: (
      <>
        The XoloDojo: Xolo (ShoLo) meaning "Guardian" 道 (Dō), meaning "path" or "way," and 場 (Jō), meaning "place"
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
          future growth. 
          
         <p></p> Own your Xolo. Own your Journey. Own your Destination.
        </p>
      </>
    ),
  },
  {
    id: 'Stained-Glass-Xolo',
    imageAtLg: 'right',
    imageSrc: '/home/StaindGlassXoloSkiGoggles.jpg',
    imageAlt: 'Stained Glass Xolo',
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
    id: 'Unlock-Xglobe',
    imageAtLg: 'left',
    imageSrc: '/home/PostalXolo.jpg',
    imageAlt: 'Postal Xolo',
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
    id: 'Pin Your Presence',
    imageAtLg: 'right',
    imageSrc: '/home/XoloMarvinMartian.jpg',
    imageAlt: 'Wet Paint Xolo',
    borderColor: 'border-sky-400',
    titleColor: 'text-sky-400',
    eyebrow: 'Pin your presence',
    title: <>Seen on Xglobe. Shared with the world.</>,
    body: (
      <>
        <p className="mb-4">
          Your Xolo gets you seen on Xglobe. The Pinbox is where that presence
          becomes real. Add your name, a brief bio, links and socials, along with what you offer or are seeking--drop your pin on the map and let the world know where you stand.
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
          and time, making every connection genuine, human, and real. Inside
          the XoloDojo, community collaboration is just a pin away.
        </p>
        <p>One Pin. One Bond. One Heartbeat.</p>
      </>
    ),
  },
  {
    id: 'TheXoloitzquintleLegacy',
    imageAtLg: 'left',
    imageSrc: '/home/WetPaintXolo.jpg',
    imageAlt: 'Wet Paint Xolo',
    borderColor: 'border-amber-400',
    titleColor: 'text-amber-400',
    eyebrow: 'The Xoloitzquintle: A breed of Legacy',
    title: <>Sacred Legacy, Living Presence</>,
    body: (
      <>
        <p className="mb-4">
          The Xoloitzquintli is an ancient breed rooted in history and tradition. One of the oldest dog breeds in the Americas with a history dating back at least 3,500 years. The Xoloitzquintli was molded and shaped by ancient Mexico, passed from generation to generation, woven through the history, tradition, and symbolism of Aztec and Mayan cultures. Xolos legacy carries centuries of meaning.
        </p>

        <p className="mb-4">
          Long regarded as more than a companion, the Xolo came to be seen as a guardian, healer, and guide - a symbol of loyalty, protection, and enduring connection. Behind that history lies a deeper quest - the path of the mystical Xolo through the 9 perilous paths of Mictlan. Symbolising the journey of the soul through the afterlife, and the Xolo's role as guide and protector on that journey.

        </p>The XoloDojo is built on the foundation of that legacy, with the Xoloitzquintle collection and Xglobe community ecosystem designed to embody those values and bring them to life in a modern, global context.

        <p className="mb-4">
      
        </p>

        <p></p>
      </>
    ),
  },
  {
    id: 'The Vision',
    imageAtLg: 'right',
    imageSrc: '/home/AbstractXoloBlue.jpg',
    imageAlt: 'Postal Xolo',
    borderColor: 'border-amber-400',
    titleColor: 'text-amber-400',
    eyebrow: 'A vision',
    title: <>Built for the long game</>,
    body: (
      <>
        <p className="mb-4">
          The vision is to provide the tools needed to build a global community rooted in trust, loyalty, and collaboration - helping people see where we are and discover each other without the restrictions of borders and time zones.
        </p>

        <p className="mb-4">
          From shared skills and services to products, projects, meetups and exchanges, XoloDojo is being built to make community more visible, more accessible and connected through real presence.
        </p>

        <p className="mb-4">
            XoloDojo is being built as a living ecosystem fostering community, collaboration, and culture. The Xolos open the door, Xglobe provides the stage, the Pinbox represents your presence of a shared movement, the friendships made along the way, and the mystical journey back home. The mint is just the beginning, not just the finish line.
        </p>

        <p>.</p>
      </>
    ),
  },
  {
    id: 'The Team',
    imageAtLg: 'left',
    imageSrc: '/home/TeamFireXolo.jpg',
    imageAlt: 'Team Fire Xolo',
    borderColor: 'border-orange-400',
    titleColor: 'text-orange-400',
    eyebrow: 'Cryptonite Labs is Team Fire',
    title: <>Cryptonite, Code &amp; RedShadow</>,
    body: (
      <>
        <p className="mb-4">
          An unstoppable trio united by freindship, loyalty, and mutual respect perservering together to deliver the XoloDojo Xoloitzquintli NFT Collection -  featuring Xglobe.  Team fire is dedicated to building an inclusive, collobaritive, and vibrant community where people can connect, share, and grow.
        </p>
        <p className="mb-4">
          Cryptonite, the project visionary, is the Alaskan spark that ignited
          the flame. Turning bold, raw ideas and a vision into reality -  driven
          by the relentless pursuit of building a global community examplifying the exercise of mind, body, and soul. 
        </p>
        <p className="mb-4">
          Code, the California kid based in the Silicon Valley area, has been writing code since the Commodore 64 days. The github guru is the technical backbone and architec coding the XoloDojo ecosystem.
        </p>
        <p className="mb-4">
          RedShadow is the talented artist hailing from Pakistan. The Pakistani Alchemist is the heartbeat behind each hand drawn trait that is the heartbeat of the Xoloitzquintle NFT Collection.
        </p>
        <p className="mb-4">
          
        </p>
      </>
    ),
  },
];

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
                The website is built. The mint comes next. The Xglobe is live.
                This starts with a mint, but the alpha lives in your Pinbox,
                lock in and be ready when we flip the switch. When the countdown
                hits zero, the timer morphs into the mint button and sends you
                straight to the mint in the xrp.cafe. Your Xolo awaits!! After
                mint, return to the Dojo, connect your wallet, fill out your
                Pinbox, and get scene on Xglobe. The collection is straight fire, bringing the heat, and a whole lotta heart.
              </p>
            </>
          </GsapPageContent>
          <GsapPageContent className="mt-12 flex justify-center" delay={0.72}>
            <XoloitzquintleSlideshow />
          </GsapPageContent>
          <GsapPageContent className="mx-auto w-full max-w-4xl">
            <h3 className="text-center text-xl font-bold md:text-2xl mt-12">
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
