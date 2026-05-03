import SectionParallaxBlobs from '../components/SectionParallaxBlobs';
import MapBoxXoloGlobe from '../components/MapBoxXoloGlobe';
import { useSectionParallaxOffsets } from '../hooks/useSectionParallaxOffsets';
import GsapPageContent from '../components/GsapPageContent';
import GsapPageSubHeading from '../components/GsapPageSubHeading';
import GsapPageHeading from '../components/GsapPageHeading';

function Xglobe() {
  const { sectionRef, bgShapeOffset, colorBgOffset, colorBg2Offset } =
    useSectionParallaxOffsets();

  return (
    <>
      <section className="relative bg-[url('/Pattern.png')] bg-cover bg-center bg-no-repeat pt-16 pb-4 md:pt-30 border-b border-[#36e9e424]">
        <div className="container mx-auto mb-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto [&_p]:text-[#decee9] [&_ul]:text-[#decee9] [&_li]:text-[#decee9] [&_li>span]:text-[#decee9]">
            <GsapPageHeading
              eyebrow="The Xoloitzquintle's Global Stage"
              heading="A Sacred Legacy of"
              accent="Discovery, Adventure, & Shared Experiences"
              iconType="star"
              iconCount={1}
              centered
            />
            <GsapPageContent className="mb-4">
              <p className="mb-7 text-justify text-white/90">
                Inside the Xolo Dojo, the Xglobe comes alive on an interactive,
                Mapbox-powered world map. Verified Xolo NFT holders pin their
                locations, showcase their unique Xolo, and discover fellow
                members across the planet.
              </p>
            </GsapPageContent>
          </div>
          <GsapPageContent
            className="mx-auto my-4 w-full max-w-7xl"
            delay={0.06}
          >
            <MapBoxXoloGlobe className="relative h-90 w-full overflow-hidden rounded-lg sm:h-107.5 md:h-130 lg:h-155 xl:h-175" />
          </GsapPageContent>
        </div>
      </section>

      <section
        ref={sectionRef}
        className="relative overflow-hidden py-4 lg:py-12 bg-[var(--bg)]"
      >
        <SectionParallaxBlobs
          bgShapeOffset={bgShapeOffset}
          colorBgOffset={colorBgOffset}
          colorBg2Offset={colorBg2Offset}
        />

        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto [&_p]:text-[#decee9] [&_ul]:text-[#decee9] [&_li]:text-[#decee9] [&_li>span]:text-[#decee9]">
            <GsapPageContent delay={0}>
              <GsapPageSubHeading heading="A platform for more than one community" />
            </GsapPageContent>

            <div>
              <GsapPageContent className="mt-4" delay={0.24}>
                <p className="mb-4 text-white/90">
                  This isn't just a map — it's where digital ownership turns
                  into real human connection. Find a host for an authentic stay,
                  arrange a home swap, share a meal, join a day adventure, or
                  exchange skills with someone whose pin catches your eye.
                  Exclusive, token-gated, and built on trust, only holders of a
                  Xolo NFT can pin and fully interact. Access is simple and
                  secure — just connect your wallet. No personal data required,
                  just proof of community membership.
                </p>
                <p className="mb-4 text-white/90">
                  Over time, the Xglobe will open its doors to other verified,
                  values-aligned NFT communities who share our vision of
                  trust-based human connection.
                </p>
                <p className="text-white/90">
                  Just as our Mission states: we're cultivating a global dojo
                  where shared experiences weave a stronger, more connected
                  world. Connect your wallet and join the Xglobe today!
                </p>
              </GsapPageContent>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default Xglobe;
