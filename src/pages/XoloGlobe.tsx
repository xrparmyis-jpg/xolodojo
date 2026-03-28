import SectionParallaxBlobs from "../components/SectionParallaxBlobs";
import MapBoxXoloGlobe from "../components/MapBoxXoloGlobe";
import { useSectionParallaxOffsets } from "../hooks/useSectionParallaxOffsets";
import GsapPageContent from "../components/GsapPageContent";
import GsapPageSubHeading from "../components/GsapPageSubHeading";
import GsapPageHeading from "../components/GsapPageHeading";

function XoloGlobe() {
    const { sectionRef, bgShapeOffset, colorBgOffset, colorBg2Offset } = useSectionParallaxOffsets();

    return (
        <>
            <section
                className="relative bg-[url('/Pattern.png')] bg-cover bg-center bg-no-repeat pt-16 pb-4 md:pt-30 border-b border-[#36e9e424]"
            >
                <div className="container mx-auto mb-8 px-4 sm:px-6 lg:px-8">
                    <GsapPageHeading
                        eyebrow="The Xoloitzquintle's Global Stage"
                        heading="A Sacred Legacy of"
                        accent="Discovery, Adventure, & Shared Experiences"
                        iconType="star"
                        iconCount={1}
                        centered
                    />
                    <GsapPageContent className="mx-auto my-4 w-full max-w-7xl" delay={0.06}>
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
                            <GsapPageSubHeading heading="The living map of our global community" />
                            <p className="mb-7 text-justify text-white/90">
                                Inside the Xolo Dojo, the XoloGlobe comes alive on
                                an interactive, Mapbox-powered world map. Verified
                                Xolo NFT holders pin their locations, showcase their
                                unique Xolo, and discover fellow members across the
                                planet.
                            </p>
                            <p className="mb-7 text-white/90">
                                This isn't just a map — it's where digital ownership
                                turns into real human connection. Find a host for an
                                authentic stay, arrange a home swap, share a meal,
                                join a day adventure, or exchange skills with someone
                                whose pin catches your eye. Exclusive, token-gated, and built on trust, only holders of a Xolo NFT can pin and fully
                                interact. Access is simple and secure — just connect
                                your wallet. No personal data required, just proof
                                of community membership.
                            </p>
                        </GsapPageContent>

                        <div>
                            <GsapPageContent className="mt-4" delay={0.08} staggerChildren staggerEach={0.08}>
                                <h3 className="mb-3 text-lg font-semibold text-[#891387] md:text-xl">
                                    How It Works
                                </h3>

                                <ul className="list-items">
                                    <li>
                                        <span><strong className="text-[#28aae4]">Connect Your Wallet</strong> — Click "Connect Wallet," select your XRPL wallet (Xaman Wallet, Joey Wallet, etc.), and sign. We verify your Xolo NFT ownership instantly on the XRP Ledger.</span>
                                    </li>
                                    <li>
                                        <span><strong className="text-[#28aae4]">Pin Your Location</strong> — Drop your pin anywhere meaningful — your home base, current travels, or a dream destination you're open to sharing.</span>
                                    </li>
                                    <li>
                                        <span><strong className="text-[#28aae4]">Showcase Your Xolo</strong> — Choose which Xolo NFT to feature. Your pin displays its artwork, letting your personality shine through to the community.</span>
                                    </li>
                                    <li>
                                        <span><strong className="text-[#28aae4]">Discover & Connect</strong> — Explore pins worldwide. Click on a pinned Xolo to view their profile.  Reach out directly as needed, a brief chat, a meetup, a local product exchange, or a collaborative opportunity.</span>
                                    </li>
                                </ul>
                            </GsapPageContent>
                            <GsapPageContent className="mt-4" delay={0.16} staggerChildren staggerEach={0.08}>
                                <h4 className="mb-3 text-lg font-semibold text-[#891387] md:text-xl">
                                    Why the Xolo Globe Matters
                                </h4>
                                <ul className="list-items">
                                    <li>
                                        <span>Keeps our community genuine and safe through token-gating</span>
                                    </li>
                                    <li>
                                        <span>Lets your Xolo NFT become a beacon for real-world connection</span>
                                    </li>
                                    <li>
                                        <span>Turns strangers into allies, travelers into locals, and shared pins into shared experiences</span>
                                    </li>
                                    <li>
                                        <span>Grows the living XoloGlobe — one pin, one message, one new friendship at a time</span>
                                    </li>
                                </ul>
                            </GsapPageContent>

                            <GsapPageContent className="mt-4" delay={0.24}>
                                <h4 className="mb-3 text-lg font-semibold text-[#891387] md:text-xl">A platform for more than one community</h4>
                                <p className="text-white/90">
                                    Over time, the XoloGlobe will open its doors to
                                    other verified, values-aligned NFT communities who
                                    share our vision of trust-based human connection.
                                </p>
                                <p className="mt-4 text-white/90">
                                    Just as our Mission states: we're cultivating a
                                    global dojo where shared experiences weave a
                                    stronger, more connected world. Connect your wallet and join the XoloGlobe today!
                                </p>
                            </GsapPageContent>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}

export default XoloGlobe;
