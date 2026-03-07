import GsapHeroParallax from "../components/GsapHeroParallax";
import GsapPageContent from "../components/GsapPageContent";
import GsapPageSubHeading from "../components/GsapPageSubHeading";
//import SectionParallaxBlobs from "../components/SectionParallaxBlobs";
//import { useSectionParallaxOffsets } from "../hooks/useSectionParallaxOffsets";

function TermsAndConditions() {
  //const { sectionRef, bgShapeOffset, colorBgOffset, colorBg2Offset } = useSectionParallaxOffsets();

  return (
    <>
      <section
        className="relative bg-[url('/Pattern.png')] bg-cover bg-center bg-no-repeat pt-16 pb-4 md:pt-30 border-b border-[#36e9e424]"
      >
      </section>
      <section
        //ref={sectionRef}
        className="relative overflow-hidden py-8 lg:py-12 bg-[var(--bg)]">
        {/* <SectionParallaxBlobs
          bgShapeOffset={bgShapeOffset}
          colorBgOffset={colorBgOffset}
          colorBg2Offset={colorBg2Offset}
        /> */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto [&_p]:text-[#decee9] [&_ul]:text-[#decee9] [&_li]:text-[#decee9] [&_li>span]:text-[#decee9]">
            <GsapPageSubHeading heading="Terms & Conditions" />
            <div className="container mx-auto max-w-7xl px-4 pt-4">
              <div className="flex flex-col items-center text-center">
                <GsapHeroParallax
                  imageSrc="/paralax-bg.png"
                  alt="Xoloitzquintle Mint Hero"
                  className="mb-8"
                />
              </div>
            </div>
            <GsapPageContent as="p" className="mb-8" delay={0.4}>
              Our vision is to build a vibrant, global network of Xolo NFT holders united through digital
              innovation and real-world networking. Central to this is XoloGlobe, our token-gated interactive
              world map that lets collectors pin their locations, showcase their NFTs, and build lasting
              relationships—unlocking peer-to-peer travel, home swaps, cultural exchanges, and lifelong
              connections. We strive to create a thriving decentralized community where art, adventure, and
              meaningful networking converge, all while honoring the Mesoamerican traditions of revering the
              Xoloitzquintle as a sacred protector, healer, and guide of souls, thereby enriching the XRPL
              ecosystem for future generations.
            </GsapPageContent>
            <div className="container mx-auto max-w-7xl px-4">
              <div className="flex flex-col items-center text-center">
                <GsapHeroParallax
                  imageSrc="/paralax-bg.png"
                  alt="Xoloitzquintle Mint Hero"
                  className="mb-4"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default TermsAndConditions;
