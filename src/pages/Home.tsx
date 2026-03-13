import { useEffect, useRef, useState } from "react";
import GsapPageHeading from "../components/GsapPageHeading";
import { useSectionParallaxOffsets } from "../hooks/useSectionParallaxOffsets";
import SectionParallaxBlobs from "../components/SectionParallaxBlobs";
import CounterSection from "../components/CounterSection";

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
        className="hero-secton hero-1 bg-cover border-b border-[#36e9e424]"
        style={{ backgroundImage: "url('/hero-bg-3.png')" }}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap -mx-4">
            <div className="w-full px-4">
              <div className="hero-content">
                {/* <div className="color-bg">
                  <img src="/color-bg.png" alt="img" />
                </div> */}
              </div>
            </div>
          </div>
        </div>
        <div
          className="hero-image img-custom-anim-left bg-cover"
          style={{ backgroundImage: "url('/hero-1.png')" }}
        ></div>
      </section>

      <section
        ref={sectionRef} className="relative overflow-hidden fix py-4 lg:py-12">
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
          <div className="flex flex-col items-center gap-6 mt-8">
            <div className="w-full max-w-4xl mx-auto opacity-0 animate-[fadeInUp_0.6s_ease-out_0.2s_forwards]">
              <div className="service-box-items flex flex-col md:flex-row items-center md:items-start justify-center gap-4 md:gap-6">
                <div className="service-image shrink-0 max-w-75">
                  <img src="/xolo-art.png" alt="Xolo NFT Art" className="min-w-25 w-65 md:w-[320px] lg:w-95" />
                </div>
                <div className="service-content text-center md:text-left">
                  <h3 className="h3-default">10,001 Unique NFT Masterpieces</h3>
                  <p>
                    A meaningful collection featuring 10,001 unique Xolo
                    NFTs with a combination of 11 distinct traits, capturing
                    the sacred canine's spirit.
                  </p>
                </div>
              </div>
            </div>
            <div className="w-full max-w-4xl mx-auto opacity-0 animate-[fadeInUp_0.6s_ease-out_0.4s_forwards]">
              <div className="service-box-items flex flex-col md:flex-row items-center md:items-start justify-center gap-4 md:gap-6">
                <div className="service-image shrink-0 max-w-75">
                  <img src="/xrpl-blockchain.png" alt="XRPL Blockchain" className="min-w-25 w-65 md:w-[320px] lg:w-95" />
                </div>
                <div className="service-content text-center md:text-left">
                  <h3 className="h3-default">Built on the XRP Ledger (XRPL)</h3>
                  <p>
                    Hosted on the XRPL for its high speed payments, low-cost
                    transactions, and eco-friendly design. The artist RedShadow
                    bringing the 10,001 Xolo NFT's to life.
                  </p>
                </div>
              </div>
            </div>
            <div className="w-full max-w-4xl mx-auto opacity-0 animate-[fadeInUp_0.6s_ease-out_0.6s_forwards]">
              <div className="service-box-items flex flex-col md:flex-row items-center md:items-start justify-center gap-4 md:gap-6">
                <div className="service-image shrink-0 max-w-75">
                  <img src="/xolo-travel.png" alt="Xolo Travel Vision" className="min-w-25 w-65 md:w-[320px] lg:w-95" />
                </div>
                <div className="service-content text-center md:text-left">
                  <h3 className="h3-default">Decentralized Travel Vision</h3>
                  <p>
                    Our long-term goal: a platform for holders to explore the
                    world through unique, wallet-to-wallet travel
                    experiences on the XRPL.
                  </p>
                </div>
              </div>
            </div>
            <div className="w-full max-w-4xl mx-auto opacity-0 animate-[fadeInUp_0.6s_ease-out_0.8s_forwards]">
              <div className="service-box-items flex flex-col md:flex-row items-center md:items-start justify-center gap-4 md:gap-6 mb-0">
                <div className="service-image shrink-0 max-w-75">
                  <img src="/xrp-cafe-mint.png" alt="XRP Cafe Mint" className="min-w-25 w-65 md:w-[320px] lg:w-95" />
                </div>
                <div className="service-content text-center md:text-left">
                  <h3 className="h3-default">
                    Upcoming Mint in the xrp.cafe
                  </h3>
                  <p>
                    Prepare your Xaman wallet with recommended 20 XRP minimum reserve
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
        className="project-section fix py-8 section-bg bg-cover relative overflow-visible border-t border-[#36e9e424]"
        style={{ backgroundImage: "url('/line-shape.png')" }}
      >
        <div
          ref={projectColorBgRef}
          className="color-bg-2 absolute pointer-events-none"
          style={{
            top: '-12%',
            right: '-50px',
            transform: `translateY(${projectBlobOffset}px)`,
            willChange: 'transform',
            transition: 'transform 0.1s ease-out',
            zIndex: -1,
            filter: 'brightness(1.2)',
          }}
        >
          <img src="/color-bg-shape-2.png" alt="Orange blob" />
        </div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="project-wrapper">
            <div className="text-center mb-4">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold opacity-0 animate-[fadeInUp_0.6s_ease-out_0.3s_forwards]">
                The Xolo's <br /><img src="/has.png" alt="asterisk" className="inline-block w-5 h-5 md:w-6 md:h-6 mx-1 align-middle" /> Legacy
              </h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center justify-items-center">
              <div className="w-full opacity-0 animate-[fadeInUp_0.6s_ease-out_0.3s_forwards]">
                <div className="project-image">
                  <img src="/01.jpg" alt="Ancient Xolo Sculpture" />
                </div>
              </div>
              <div className="w-full opacity-0 animate-[fadeInUp_0.6s_ease-out_0.5s_forwards]">
                <div className="project-content">
                  <span>Ancient Mesoamerica</span>
                  <h3 className="text-2xl md:text-3xl font-bold mb-3">
                    A Sacred <br />
                    Heritage
                  </h3>
                  <p>
                    Dating back over 3,000 years, the Xolo is a living symbol
                    of Mesoamerican heritage, revered as a spiritual guide to
                    Mictlan, the Aztec afterlife.
                  </p>
                </div>
              </div>

              <div className="w-full opacity-0 animate-[fadeInUp_0.6s_ease-out_0.3s_forwards]">
                <div className="project-content">
                  <span>The Team</span>
                  <h3 className="text-2xl md:text-3xl font-bold mb-3">
                    RedShadow &amp; <br />
                    Cryptonite
                  </h3>
                  <p>
                    Cryptonite, the global explorer and XRPL enthusiast,
                    partnered with RedShadow, the visionary artist, to bring
                    the 10,001 Xolo NFTs to life.
                  </p>
                </div>
              </div>
              <div className="w-full opacity-0 animate-[fadeInUp_0.6s_ease-out_0.5s_forwards]">
                <div className="project-image style-2">
                  <img src="/02.jpg" alt="Artist and Creator" />
                </div>
              </div>
              <div className="w-full opacity-0 animate-[fadeInUp_0.6s_ease-out_0.3s_forwards]">
                <div className="project-image">
                  <img src="/03.jpg" alt="Map and travel icons" />
                </div>
              </div>
              <div className="w-full opacity-0 animate-[fadeInUp_0.6s_ease-out_0.5s_forwards]">
                <div className="project-content">
                  <span>Future Utility</span>
                  <h3 className="text-2xl md:text-3xl font-bold mb-3">
                    Fostering Global <br />
                    Travel &amp; Connection
                  </h3>
                  <p>
                    The collection's long-term vision is to build a decentralized
                    platform for Xolo NFT holders to network and sharetravel experiences, fostering global connection through
                    wallet-to-wallet networking and person to person experiences on the XRPL.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <CounterSection />

    </>
  );
}

export default Home;
