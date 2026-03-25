import { useEffect, useRef, useState, type ReactNode } from "react";
import GsapPageHeading from "../components/GsapPageHeading";
import { useSectionParallaxOffsets } from "../hooks/useSectionParallaxOffsets";
import SectionParallaxBlobs from "../components/SectionParallaxBlobs";
import CounterSection from "../components/CounterSection";

const SERVICE_ROW =
  "mt-[30px] flex flex-col items-center justify-center gap-4 md:flex-row md:items-start md:gap-6";
const SERVICE_CONTENT =
  "flex min-w-0 flex-1 flex-col rounded-[25px] border border-[rgba(207,208,212,0.2)] bg-[#1d1d21] p-[50px] text-center max-w-full w-full md:text-left [&_p]:mb-5 [&_p:last-child]:mb-0";

/** Mobile: always image → copy. At `lg`, alternate columns using `imageAtLg`. Append rows here (up to ~5). */
type LegacyStoryRow = {
  id: string;
  imageAtLg: "left" | "right";
  imageSrc: string;
  imageAlt: string;
  eyebrow: string;
  title: ReactNode;
  body: ReactNode;
};

const LEGACY_STORY_ROWS: LegacyStoryRow[] = [
  {
    id: "ancient",
    imageAtLg: "left",
    imageSrc: "/01.jpg",
    imageAlt: "Ancient Xolo Sculpture",
    eyebrow: "Ancient Mesoamerica",
    title: (
      <>
        A Sacred Heritage
      </>
    ),
    body: (
      <>
        Dating back over 3,000 years, the Xoloitzquintle (Show Low eats queentlee) is a living symbol
        of Mesoamerican heritage, revered as a spiritual guide to
        Mictlan, the Aztec afterlife.
      </>
    ),
  },
  {
    id: "team",
    imageAtLg: "right",
    imageSrc: "/02.jpg",
    imageAlt: "Artist and Creator",
    eyebrow: "The Team",
    title: (
      <>
        RedShadow, Cryptonite &amp; Code
      </>
    ),
    body: (
      <>
        Cryptonite, the global explorer and XRPL enthusiast,
        partnered with RedShadow, the talented artist,and Code, the skilled developer, to bring
        to bring the 10,001 Xolo NFTs and XoloGlobe into reality, blending art, culture, and blockchain innovation.
      </>
    ),
  },
  {
    id: "utility",
    imageAtLg: "left",
    imageSrc: "/03.jpg",
    imageAlt: "Map and travel icons",
    eyebrow: "Future Utility",
    title: (
      <>
        Fostering Global Travel &amp; Connection
      </>
    ),
    body: (
      <>
        The collection&apos;s long-term vision is to build a decentralized
        platform for Xolo NFT holders to network and share travel experiences, fostering global connection through
        wallet-to-wallet networking and person to person experiences on the XRPL.
      </>
    ),
  },
];

const LEGACY_ROW_ANIM: readonly string[] = [
  "opacity-0 animate-[fadeInUp_0.6s_ease-out_0.28s_forwards]",
  "opacity-0 animate-[fadeInUp_0.6s_ease-out_0.32s_forwards]",
  "opacity-0 animate-[fadeInUp_0.6s_ease-out_0.36s_forwards]",
  "opacity-0 animate-[fadeInUp_0.6s_ease-out_0.4s_forwards]",
  "opacity-0 animate-[fadeInUp_0.6s_ease-out_0.44s_forwards]",
];

const LEGACY_IMAGE_WRAP =
  "w-full transition-transform duration-300 ease-in-out hover:rotate-[10deg]";
const LEGACY_IMAGE_IMG =
  "h-auto w-full rounded-[50px] object-cover max-w-[480px] lg:max-w-full mx-auto";
const LEGACY_CONTENT_WRAP = "flex min-w-0 flex-col text-left mt-4 lg:mt-0";
const LEGACY_EYEBROW =
  "mb-5 inline-block rounded-2xl border border-[rgba(207,208,212,0.2)] px-5 py-2 text-[15px] font-bold leading-none";

function Home() {
  // const parallaxRef = useRef<HTMLDivElement>(null);
  // const parallaxSectionRef = useRef<HTMLDivElement>(null);
  const projectSectionRef = useRef<HTMLElement>(null);
  const projectColorBgRef = useRef<HTMLDivElement>(null);
  // const [parallaxOffset, setParallaxOffset] = useState(0);
  const [projectBlobOffset, setProjectBlobOffset] = useState(0);
  // const lastScrollY = useRef(0);

  const { sectionRef, bgShapeOffset, colorBgOffset, colorBg2Offset } = useSectionParallaxOffsets();

  // useEffect(() => {
  //   const handleScroll = () => {
  //     if (!parallaxSectionRef.current) return;

  //     const rect = parallaxSectionRef.current.getBoundingClientRect();
  //     const windowHeight = window.innerHeight;
  //     const currentScrollY = window.scrollY;

  //     lastScrollY.current = currentScrollY;

  //     if (rect.top <= windowHeight && rect.bottom >= 0) {
  //       const sectionTop = rect.top;
  //       const sectionHeight = rect.height;

  //       const scrollProgress = Math.max(0, (windowHeight - sectionTop) / (windowHeight + sectionHeight));
  //       const offset = -scrollProgress * sectionHeight * 0.5;
  //       setParallaxOffset(offset);
  //     } else {
  //       setParallaxOffset(0);
  //     }
  //   };

  //   window.addEventListener('scroll', handleScroll, { passive: true });
  //   handleScroll();

  //   return () => window.removeEventListener('scroll', handleScroll);
  // }, []);

  useEffect(() => {
    const handleProjectScroll = () => {
      if (!projectSectionRef.current) return;

      const rect = projectSectionRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      if (rect.top <= windowHeight && rect.bottom >= 0) {
        const sectionTop = rect.top;
        const sectionHeight = rect.height;

        const scrollProgress = Math.max(0, (windowHeight - sectionTop) / (windowHeight + sectionHeight));
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
        <div
          className="mt-[150px] h-[320px] w-full max-[1199px]:mt-[50px] max-[1199px]:h-[150px] max-[575px]:h-20 bg-cover bg-center bg-no-repeat opacity-0 animate-[heroImgLeft_1.3s_cubic-bezier(0.645,0.045,0.355,1)_0.4s_forwards]"
          style={{ backgroundImage: "url('/hero-1.png')" }}
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
          <div className="mt-8 flex flex-col items-center gap-6">
            <div className="mx-auto w-full max-w-4xl opacity-0 animate-[fadeInUp_0.6s_ease-out_0.2s_forwards]">
              <div className={SERVICE_ROW}>
                <div className="max-w-75 shrink-0">
                  <img
                    src="/xolo-art.png"
                    alt="Xolo NFT Art"
                    className="min-w-25 w-65 rounded-[20px] object-cover md:w-[320px] lg:w-95"
                  />
                </div>
                <div className={SERVICE_CONTENT}>
                  <h3 className="text-xl font-bold md:text-2xl mb-[15px]">
                    10,001 Unique NFT Masterpieces
                  </h3>
                  <p>
                    A meaningful collection featuring 10,001 unique Xolo
                    NFTs with a combination of 11 distinct traits and 311 sub traits, hand-drawn by RedShadow.
                  </p>
                </div>
              </div>
            </div>
            <div className="mx-auto w-full max-w-4xl opacity-0 animate-[fadeInUp_0.6s_ease-out_0.4s_forwards]">
              <div className={SERVICE_ROW}>
                <div className="max-w-75 shrink-0">
                  <img
                    src="/xrpl-blockchain.png"
                    alt="XRPL Blockchain"
                    className="min-w-25 w-65 rounded-[20px] object-cover md:w-[320px] lg:w-95"
                  />
                </div>
                <div className={SERVICE_CONTENT}>
                  <h3 className="text-xl font-bold md:text-2xl mb-[15px]">
                    Built on the XRP Ledger (XRPL)
                  </h3>
                  <p>
                    Hosted on the XRPL for its high speed payments, low-cost
                    transactions, and eco-friendly design.
                  </p>
                </div>
              </div>
            </div>
            <div className="mx-auto w-full max-w-4xl opacity-0 animate-[fadeInUp_0.6s_ease-out_0.6s_forwards]">
              <div className={SERVICE_ROW}>
                <div className="max-w-75 shrink-0">
                  <img
                    src="/xolo-travel.png"
                    alt="Xolo Travel Vision"
                    className="min-w-25 w-65 rounded-[20px] object-cover md:w-[320px] lg:w-95"
                  />
                </div>
                <div className={SERVICE_CONTENT}>
                  <h3 className="text-xl font-bold md:text-2xl mb-[15px]">
                    Decentralized Travel Vision
                  </h3>
                  <p>
                    Our long-term goal: a platform for holders to network, share skills, and explore the
                    world person to person, interacting wallet-to-wallet to foster global connection through travel
                    experiences on the XRPL.
                  </p>
                </div>
              </div>
            </div>
            <div className="mx-auto w-full max-w-4xl opacity-0 animate-[fadeInUp_0.6s_ease-out_0.8s_forwards]">
              <div className={SERVICE_ROW}>
                <div className="max-w-75 shrink-0">
                  <img
                    src="/xrp-cafe-mint.png"
                    alt="XRP Cafe Mint"
                    className="min-w-25 w-65 rounded-[20px] object-cover md:w-[320px] lg:w-95"
                  />
                </div>
                <div className={SERVICE_CONTENT}>
                  <h3 className="text-xl font-bold md:text-2xl mb-[15px]">
                    Upcoming Mint in the xrp.cafe
                  </h3>
                  <p>
                    Prepare your Xaman or Joey wallet with recommended 20 XRP minimum reserve
                    for the Xoloitzquintle mint on the XRPL.
                  </p>
                </div>
              </div>
            </div>
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
            top: "-12%",
            right: "-50px",
            transform: `translateY(${projectBlobOffset}px)`,
            willChange: "transform",
            transition: "transform 0.1s ease-out",
            filter: "brightness(1.2)",
          }}
        >
          <img src="/color-bg-shape-2.png" alt="" aria-hidden />
        </div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6 text-center lg:mb-8">
            <h2 className="text-3xl font-bold opacity-0 animate-[fadeInUp_0.6s_ease-out_0.3s_forwards] md:text-4xl lg:text-5xl">
              The Xolo&apos;s <br />
              <img
                src="/has.png"
                alt="asterisk"
                className="mx-1 inline-block h-5 w-5 align-middle md:h-6 md:w-6"
              />{" "}
              Legacy
            </h2>
          </div>

          <div className="flex flex-col gap-12 lg:gap-16">
            {LEGACY_STORY_ROWS.map((row, index) => {
              const imageLeft = row.imageAtLg === "left";
              return (
                <div
                  key={row.id}
                  className={`flex w-full flex-col gap-3 sm:gap-4 lg:flex-row lg:items-center lg:gap-5 ${LEGACY_ROW_ANIM[index] ?? LEGACY_ROW_ANIM[4]
                    }`}
                >
                  <div
                    className={`min-w-0 w-full lg:w-1/2 order-1 ${imageLeft ? "lg:order-1" : "lg:order-2"
                      }`}
                  >
                    <div className={LEGACY_IMAGE_WRAP}>
                      <img
                        src={row.imageSrc}
                        alt={row.imageAlt}
                        className={LEGACY_IMAGE_IMG}
                      />
                    </div>
                  </div>
                  <div
                    className={`min-w-0 w-full lg:w-1/2 order-2 ${imageLeft ? "lg:order-2" : "lg:order-1"
                      }`}
                  >
                    <div className={LEGACY_CONTENT_WRAP}>
                      <span className={LEGACY_EYEBROW}>{row.eyebrow}</span>
                      <h3 className="my-2 lg:mb-6 text-2xl font-bold md:text-3xl lg:text-4xl">
                        {row.title}
                      </h3>
                      <div className="max-w-[350px] leading-relaxed">
                        {row.body}
                      </div>
                    </div>
                  </div>
                </div>
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
