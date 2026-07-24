import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';

import GsapPageContent from '../components/GsapPageContent';
import GsapPageHeading from '../components/GsapPageHeading';
import SectionParallaxBlobs from '../components/SectionParallaxBlobs';
import CounterSection from '../components/CounterSection';
import XoloitzquintleSlideshow from '../components/XoloitzquintleSlideshow';

import { useSectionParallaxOffsets } from '../hooks/useSectionParallaxOffsets';
import MintCountdownSection from '../components/MintCountdownSection';
import GsapPageSubHeading from '../components/GsapPageSubHeading';

type LegacyStoryRow = {
  id: string;
  imageAtLg: 'left' | 'right';
  imageSrc: string;
  imageAlt: string;
  /** Tailwind border-color utility (include the `border-` prefix), e.g. `border-cyan-400` or `border-[#b7e9f7]`. */
  borderColor: string;
  /** Tailwind text-color utility for the section title (e.g. `text-cyan-400`) — pair with `borderColor`. */
  titleColor: string;
  /** Tailwind text-color utility for the eyebrow pill (defaults to `titleColor` when omitted). */
  eyebrowTextColor?: string;
  eyebrow: string;
  title: ReactNode;
  body: ReactNode;
  /** When set, a CTA link is rendered below the section body (use in-app paths like `/team`). */
  sectionCta?: { to: string; label: string };
};

const LEGACY_STORY_ROWS: LegacyStoryRow[] = [
  {
    id: 'XoloPuzzleSkin',
    imageAtLg: 'left',
    imageSrc: '/home/XoloPuzzleSkin.jpg',
    imageAlt: 'XoloPuzzleSkin',
    borderColor: 'border-[#68ed77]',
    titleColor: 'text-[#68ed77]',
    eyebrowTextColor: 'text-[#68ed77]',
    eyebrow: 'Welcome to the Community',
    title: 'A Global Network of Family. A Piece of the Puzzle.',
    body: (
      <>
        <p className="mb-4">
          A sacred digital sanctuary rooted in the Xoloitzquintli’s timeless
          values of unwavering loyalty, transformative guardianship, deep
          respect, humility, resilience, and shared reverence.{' '}
        </p>
        <p className="mb-4">
          These principles form the ethical heart of our community - a space of
          trust, honor, and genuine harmony where every holder is welcomed as
          family. At the living heart of the XoloDojo is Xglobe, a
          Xoloitzquintli NFT token-gated global community offering a space to
          share skills, cultures, and collaborations - forging person-to-person
          exchanges and adventures across the planet.
        </p>
        <p>
          XoloDojo community members are represented by their sharable Xglobe
          Xpins and the alpha that resides within it. On Xglobe, simply click an
          Xpin to view that alpha, reach out, bookmark it, and/or share it with
          others. More than a collection, more than a movement, the XoloDojo is
          legacy in motion.
          <br />
          <br /> Own the Xolo. Own the Journey. Own the Destination.
        </p>
      </>
    ),
  },
  {
    id: 'Stained-Glass-Xolo',
    imageAtLg: 'right',
    imageSrc: '/home/StaindGlassXoloSkiGoggles.jpg',
    imageAlt: 'Stained Glass Xolo',
    borderColor: 'border-[#e661a8]',
    titleColor: 'text-[#e661a8]',
    eyebrowTextColor: 'text-[#e661a8]',
    eyebrow: 'The Xoloitzquintli NFT Collection',
    title: <>Clean traits. Straight fire. Built different. </>,
    body: (
      <>
        <p className="mb-4">
          10,001 Xolos. Built on
          the XRPL for its eco-friendly design, fast payments, and low fees, the
          collection draws from 11 distinct traits and 311 sub-traits, all
          hand-drawn by the teams talented artist, RedShadow.{' '}
        </p>
        <p className="mb-4">
          Every Xolo carries its own energy--from sacred, sharp, chaotic, and
          calm, to dripped out or quietly legendary. Some have attitude like
          they know they're gonna get minted first!
        </p>
        <p className="mb-4">
          This is the hunt for your Xolo, your guide and companion unlocking
          Xglobe. Looks like alpha, feels like legacy - sprinkled with a lil
          degen and prepared with a whole lotta heart.{' '}
        </p>
      </>
    ),
  },
  {
    id: 'Unlock-Xglobe',
    imageAtLg: 'left',
    imageSrc: '/home/PostalXolo.jpg',
    imageAlt: 'Postal Xolo',
    borderColor: 'border-[#3bbee6]',
    titleColor: 'text-[#3bbee6]',
    eyebrowTextColor: 'text-[#3bbee6]',
    eyebrow: 'Powered by Xglobe',
    title: <>Connecting Xoloitzquintli NFT holders across the Globe</>,
    body: (
      <>
        <p className="mb-4">
          Xglobe is where the XoloDojo comes alive at full scale--a live
          token-gated world built for networking, connection, exchange, and
          adventure. Holders share skills and culture, organize meetups, create
          person-to-person adventures, offer products or services, and build a
          growing network of like minded individuals across the planet.
        </p>

        <p className="mb-4">
          Users can connect directly, organize collaborations, work out costs
          amongst themselves, and turn introductions into opportunities, built
          on trust, shared values, and mutual respect.
        </p>

        <p className="mb-4">
          Xglobe is where community starts to stretch across borders and time
          zones, with an agenda to turn travelers into locals, strangers into
          allies, and ideas into collaborations.
        </p>
        <p>Xglobe is the Omega.</p>
      </>
    ),
    sectionCta: { to: '/xglobe', label: 'Open Xglobe' },
  },
  {
    id: 'Pin Your Presence',
    imageAtLg: 'right',
    imageSrc: '/home/XoloBrickSkin.jpg',
    imageAlt: 'Xolo Brick Skin ',
    borderColor: 'border-[#b1b1a7]',
    titleColor: 'text-[#b1b1a7]',
    eyebrowTextColor: 'text-[#b1b1a7]',
    eyebrow: 'Pin your presence',
    title: <>Seen on Xglobe. Shared with the world.</>,
    body: (
      <>
        <p className="mb-4">
          Your Xpin shares your presence with the world. Think of it as your
          digital business card - a snapshot of who you are, what you do, what
          you offer, and what you're seeking.
        </p>
        <p className="mb-4">
          Add your name, bio, links, and socials. Your Xpin shows the location
          you choose, what you're building, in need of, or the kind of people
          and opportunities you want to connect with. It can be your intro, your
          signal, your invitation, or your shot at finding like-minded people
          who move with purpose, curiosity, positive vibes and good energy.
        </p>
        <p className="mb-4">
          Xpins display local date and time and can be shared and bookmarked,
          making it easier for people to stay connected and revisit the
          profiles, offers, and opportunities that matter to them most. Each
          Xolo minted gets an Xpin and a unique networking opportunity. Inside
          the XoloDojo, powered by Xglobe, community collaboration is just an
          Xpin away.
        </p>
        <p className="mb-4">Xpin is the Alpha.</p>
      </>
    ),
  },
  {
    id: 'TheXoloitzquintliLegacy',
    imageAtLg: 'left',
    imageSrc: '/home/WetPaintXolo.jpg',
    imageAlt: 'Wet Paint Xolo',
    borderColor: 'border-[#d400ff] ',
    titleColor: 'text-[#d400ff]',
    eyebrowTextColor: 'text-[#d400ff]',
    eyebrow: 'The Xoloitzquintli: A breed of Legacy',
    title: <>A legendary history, A living presence</>,
    body: (
      <>
        <p className="mb-4">
          The Xoloitzquintli is an ancient breed rooted in history and
          tradition. One of the oldest dog breeds in the Americas with a history
          dating back at least 3,500 years. The Xoloitzquintli was molded and
          shaped by ancient Mexico, passed from generation to generation, woven
          through history, tradition, and the symbolism of Aztec and Mayan
          cultures. Xolos legacy carries centuries of meaning.
        </p>
        <p className="mb-4">
          Long regarded as more than a companion, the Xolo came to be seen as a
          guardian, healer, and guide - a symbol of loyalty, protection, and
          enduring connection. Behind that history lies a deeper quest - the
          path of the mystical Xolo through the 9 perilous paths of Mictlan.
          Symbolising the journey of the soul through the afterlife, and the
          Xolo's role as guide and protector on that journey.
        </p>

        <p className="mb-4">
          The XoloDojo is built on the foundation of that legacy, with the
          Xoloitzquintli collection and Xglobe community ecosystem designed to
          embody those values and bring them to life in a modern, global
          context.
        </p>

        <p></p>
      </>
    ),
    sectionCta: { to: '/xoloitzquintli', label: 'The Xoloitzquintli page' },
  },
  {
    id: 'The Vision',
    imageAtLg: 'right',
    imageSrc: '/home/AbstractXoloBlue.jpg',
    imageAlt: 'Postal Xolo',
    borderColor: 'border-[#f0f896]',
    titleColor: 'text-[#f0f896]',
    eyebrowTextColor: 'text-[#f0f896]',
    eyebrow: 'The vision',
    title: <>Built for the long game</>,
    body: (
      <>
        <p className="mb-4">
          The vision is to provide the tools needed to build a global community
          rooted in trust, loyalty, and collaboration - helping each other to
          see where we all are, and connect without the restrictions of borders
          and time zones.
        </p>

        <p className="mb-4">
          Networking shared skills and services to products, projects, meetups
          and exchanges that lead to conversation. Conversation that leads to
          collaboration. Collaboration that leads to building, putting community
          first, connected through real presence.
        </p>

        <p className="mb-4">
          XoloDojo was built as a living ecosystem fostering community,
          collaboration, and culture. The Xolos open the door, Xglobe provides
          the stage, the Xpin represents your presence of a shared movement, the
          friendships made along the way, and the mystical journey back home.
        </p>
        <p className="mb-4">
          The mint is just the beginning, not the finish line.
        </p>
      </>
    ),
    sectionCta: { to: '/vision', label: 'Read the full vision' },
  },
  {
    id: 'The Team',
    imageAtLg: 'left',
    imageSrc: '/home/TeamFireXolo.jpg',
    imageAlt: 'Team Fire Xolo',
    borderColor: 'border-orange-400',
    titleColor: 'text-orange-400',
    eyebrowTextColor: 'text-orange-400',
    eyebrow: 'Cryptonite Labs is Team Fire',
    title: <>Cryptonite, Code &amp; RedShadow</>,
    body: (
      <>
        <p className="mb-4">
          An unstoppable trio united by friendship, loyalty, and mutual respect
          persevering together to deliver the XoloDojo Xoloitzquintli NFT
          Collection - featuring Xglobe. Team fire is dedicated to building an
          inclusive, collaborative, and vibrant community where people can
          connect, share, and grow.
        </p>
        <p className="mb-4">
          Cryptonite, the project visionary, is the Alaskan spark that ignited
          the flame. Turning bold, raw ideas and a vision into reality - driven
          by the relentless pursuit of building a global community exemplifying
          the exercise of mind, body, and soul.
        </p>
        <p className="mb-4">
          Code, the California kid based in the Silicon Valley area, has been
          writing code since the Commodore 64 days. The github guru is the
          technical backbone and architect coding the XoloDojo ecosystem.
        </p>
        <p className="mb-4">
          RedShadow is the talented artist hailing from Pakistan. The Pakistani
          Alchemist is the talent behind each hand drawn trait that is the
          heartbeat of the Xoloitzquintli NFT Collection.
        </p>
        <p className="mb-4"></p>
      </>
    ),
    sectionCta: { to: '/team', label: 'Meet the team' },
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
                10,001 unique Xoloitzquintli NFTs on the XRPL. Each one unlocks Xglobe — a live, token-gated world map where holders connect, collaborate, and build real relationships across the planet. Fused with degen pride and the spirit of community, the mint is next. Lock in and be ready when we flip the switch.
              </p>
            </>
          </GsapPageContent>
          <GsapPageContent
            className="mt-12 flex justify-center max-sm:px-2"
            delay={0.72}
          >
            <XoloitzquintleSlideshow />
          </GsapPageContent>
          <MintCountdownSection />
        </div>
      </section>

      <section
        ref={projectSectionRef}
        className="relative overflow-x-hidden border-t border-[#36e9e424] bg-[var(--bg)] bg-cover py-8"
        style={{ backgroundImage: "url('/line-shape.png')" }}
      >
        <div
          ref={projectColorBgRef}
          className="pointer-events-none absolute -z-10 brightness-[0.56] saturate-[0.82] md:brightness-[0.68] md:saturate-[0.88] lg:brightness-[1.2] lg:saturate-100"
          style={{
            top: '-12%',
            right: '-50px',
            transform: `translateY(${projectBlobOffset}px)`,
            willChange: 'transform',
            transition: 'transform 0.1s ease-out',
          }}
        >
          <img src="/color-bg-shape-2.png" alt="" aria-hidden />
        </div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <GsapPageContent delay={0}>
            <GsapPageSubHeading
              headingColor="#794bd0"
              iconColor="#02abfa"
              heading={`Xolo (ShōLō) "The Guardian", 道 (Dō) "The Pathway",\n\n and 場 (Jō) "The Destination"`}
            />
          </GsapPageContent>
          <div className="mt-8 flex flex-col gap-12 lg:gap-16">
            {LEGACY_STORY_ROWS.map((row, index) => {
              const imageLeft = row.imageAtLg === 'left';
              return (
                <GsapPageContent
                  key={row.id}
                  className="flex w-full flex-col gap-3 sm:gap-4 lg:flex-row lg:items-center lg:gap-5"
                  delay={index * 0.06}
                >
                  <div
                    className={`min-w-0 w-full lg:w-1/2 order-1 ${imageLeft ? 'lg:order-1' : 'lg:order-2'
                      }`}
                  >
                    <div
                      className={`w-full transition-transform duration-300 ease-in-out ${imageLeft
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
                    className={`min-w-0 w-full lg:w-1/2 order-2 ${imageLeft ? 'lg:order-2' : 'lg:order-1'
                      }`}
                  >
                    <div className="flex min-w-0 flex-col text-left mt-8 lg:mt-0">
                      <span
                        className={`mb-5 inline-block w-fit max-w-full self-center rounded-2xl border ${row.borderColor
                          } px-8 py-2 text-center text-[15px] font-bold leading-none ${row.eyebrowTextColor || row.titleColor
                          }`}
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
                      {row.sectionCta ? (
                        <div className="mt-6 flex justify-start">
                          <Link
                            to={row.sectionCta.to}
                            className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition hover:bg-white/5 ${row.borderColor} ${row.titleColor}`}
                          >
                            {row.sectionCta.label}
                            <span aria-hidden className="opacity-80">
                              →
                            </span>
                          </Link>
                        </div>
                      ) : null}
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
