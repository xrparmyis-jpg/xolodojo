import GsapHeroParallax from '../components/GsapHeroParallax';
import GsapPageContent from '../components/GsapPageContent';
import GsapPageHeading from '../components/GsapPageHeading';
import GsapPageSubHeading from '../components/GsapPageSubHeading';
import SectionParallaxBlobs from '../components/SectionParallaxBlobs';
import { useSectionParallaxOffsets } from '../hooks/useSectionParallaxOffsets';

function Vision() {
  const { sectionRef, bgShapeOffset, colorBgOffset, colorBg2Offset } =
    useSectionParallaxOffsets();

  return (
    <>
      <section className="relative bg-[url('/Pattern.png')] bg-cover bg-center bg-no-repeat pt-16 pb-4 md:pt-30 border-b border-[#36e9e424]"></section>
      <section
        ref={sectionRef}
        className="relative overflow-hidden py-8 lg:py-12 bg-[var(--bg)]"
      >
        <SectionParallaxBlobs
          bgShapeOffset={bgShapeOffset}
          colorBgOffset={colorBgOffset}
          colorBg2Offset={colorBg2Offset}
        />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto [&_p]:text-[#decee9] [&_ul]:text-[#decee9] [&_li]:text-[#decee9] [&_li>span]:text-[#decee9]">
            <GsapPageHeading
              eyebrow="The Xoloitzquintle Vision"
              heading="A Sacred Legacy of"
              accent="Networking, Travel, & Connection"
              iconType="star"
              iconCount={1}
              centered
            />
            <GsapPageContent as="p" className="mb-4">
              Our vision is to build a vibrant, global network of Xolo NFT
              holders united through digital innovation and real-world
              networking. We strive to create a thriving decentralized community
              where art, adventure, and meaningful networking converge, built on
              trust, shared values, and cross-generational bonds by facilitating
              skill trades, cultural exchanges, casual meetups, and sourcing
              unique global goods. In this space, unfamiliar faces evolve into
              trusted companions, wanderers find a sense of home, and collective
              moments knit a more cohesive global community.
            </GsapPageContent>
            <div className="container mx-auto max-w-7xl px-4">
              <div className="flex flex-col items-center text-center">
                <GsapHeroParallax
                  imageSrc="/paralax-bg.png"
                  alt="Xoloitzquintle Mint Hero"
                  className="mb-8"
                />
              </div>
            </div>
            <GsapPageContent as="p" className="mb-4">
              At the heart of this endeavor lies Xglobe, a token-gated
              interactive world map that empowers collectors to pin their
              locations, display their NFTs, and spark meaningful
              engagements—from peer-to-peer travel guidance and home exchanges
              to cultural immersions, skill-share swaps, and lifelong networking
              alliances. Imagine seeking expert travel insights, arranging
              temporary home swaps, discovering trusted accommodations,
              uncovering hidden gems and landmarks, or tapping into local wisdom
              for an enriched journey. It could mean organizing casual meetups
              over coffee or a shared meal, exchanging skills in a workshop
              setting, or even hosting a fellow holder through work-trade
              arrangements in your own space—be it a cozy apartment, a rustic
              cabin, or a seaside retreat. Perhaps you're sourcing a unique
              specialty from afar: premium olive oil from an Italian orchard,
              handcrafted leather goods from a Moroccan artisan, or authentic
              spices from an Indian market. Simply navigate Xglobe, select a
              pin, and connect via integrated social links—or, as community
              needs grow, directly within the platform itself.
            </GsapPageContent>
            <GsapPageContent as="p" className="mb-4">
              This is the essence of networking: uniting like-minded souls in
              pursuit of sovereignty and a brighter legacy for those who follow.
              In a fragmented world, it is more important than ever to network
              with like-minded, business saavy, trusted individuals. Moreover,
              by participating in Xglobe—pinning your location and sharing your
              profile—you naturally help promote your business, ideas, or
              products to the community, getting more eyes on you and turning
              every connection into a potential collaboration or opportunity. At
              the same time, the interactive map provides a clear visual
              representation of where our like-minded individuals are scattered
              across the globe, highlighting the reach and unity of the Xolo
              network from remote spots like Alaska to bustling cities
              worldwide.
            </GsapPageContent>
            <GsapPageContent as="p" className="mb-4">
              One pin, one connection, one share at a time.
            </GsapPageContent>
            <GsapPageSubHeading heading="Global Connection Opportunities" />
            <GsapPageContent staggerChildren>
              <ul className="list-items">
                <li>
                  <span>Person to Person (P2P)</span> — All interactions remain
                  peer-to-peer (P2P), with agreements on terms and costs
                  negotiated directly between individuals, and transactions
                  executed seamlessly wallet-to-wallet on the XRPL for
                  unparalleled transparency and efficiency.
                </li>
                <li>
                  <span>Token-Gated Experiences</span> — Secure entry to Xglobe
                  for mapping, exhibiting, and initiating P2P engagements across
                  the globe, seamlessly merging digital assets with everyday
                  explorations like itinerary advice, lodging swaps, and
                  regional discoveries—while visually mapping the community's
                  global footprint.
                </li>
                <li>
                  <span>Sacred Bonds & Human Connections</span> — Paying homage
                  to the Xolo as eternal guardian and beacon, we nurture trust,
                  common goals, and cross-generational ties that turn
                  acquaintances into steadfast partners via skill trades,
                  cultural swaps, casual encounters, and sourcing distinctive
                  global goods—all while helping promote individual businesses,
                  ideas, and products through shared profiles to get more eyes
                  on you.
                </li>
                <li>
                  <span>Local Meetups and Day Activities</span> — Connect with
                  Xolo hosts for a guided day out, shared lunch, coffee, or
                  activity—perfect for experiencing the Xglobe through
                  authentic, no-commitment local encounters.
                </li>
                <li>
                  <span>Community Exchange Network</span> — Tap into the
                  Xglobe's global network to offer or access member services,
                  handmade goods, professional skills, or even work
                  trades—fostering collaboration, learning, and mutual support
                  beyond travel.
                </li>
              </ul>
            </GsapPageContent>
          </div>
        </div>
      </section>
    </>
  );
}

export default Vision;
