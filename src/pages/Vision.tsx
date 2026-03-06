import GsapHeroParallax from "../components/GsapHeroParallax";
import GsapPageHeading from "../components/GsapPageHeading";
import SectionParallaxBlobs from "../components/SectionParallaxBlobs";
import { useSectionParallaxOffsets } from "../hooks/useSectionParallaxOffsets";

function Vision() {
    const { sectionRef, bgShapeOffset, colorBgOffset, colorBg2Offset } = useSectionParallaxOffsets();

    return (
        <>
            <section
                className="relative bg-[url('/Pattern.png')] bg-cover bg-center bg-no-repeat pt-16 pb-4 md:pt-30 border-b border-[#36e9e424]"
            >
            </section>
            <section ref={sectionRef} className="relative overflow-hidden py-8 lg:py-12 bg-[var(--bg)]">
                <SectionParallaxBlobs
                    bgShapeOffset={bgShapeOffset}
                    colorBgOffset={colorBgOffset}
                    colorBg2Offset={colorBg2Offset}
                />
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="max-w-4xl mx-auto [&_p]:text-[#decee9] [&_ul]:text-[#decee9] [&_li]:text-[#decee9] [&_li>span]:text-[#decee9]">
                        <GsapPageHeading
                            eyebrow="The Xoloitzquintle Collection"
                            heading="A Sacred Legacy of"
                            accent="Art, Culture, & XRPL"
                            iconType="star"
                            iconCount={1}
                            centered
                        />
                        <p className="opacity-0 animate-[fadeInUp_0.6s_ease-out_0.3s_forwards] mb-6">
                            Our vision is to build a vibrant, global network of Xolo NFT holders united through digital
                            innovation and real-world networking. Central to this is XoloGlobe, our token-gated interactive
                            world map that lets collectors pin their locations, showcase their NFTs, and build lasting
                            relationships—unlocking peer-to-peer travel, home swaps, cultural exchanges, and lifelong
                            connections. We strive to create a thriving decentralized community where art, adventure, and
                            meaningful networking converge, all while honoring the Mesoamerican traditions of revering the
                            Xoloitzquintle as a sacred protector, healer, and guide of souls, thereby enriching the XRPL
                            ecosystem for future generations.
                        </p>
                        <div className="container mx-auto max-w-7xl px-4">
                            <div className="flex flex-col items-center text-center">
                                <GsapHeroParallax
                                    imageSrc="/paralax-bg.png"
                                    alt="Xoloitzquintle Mint Hero"
                                    className="mb-10"
                                />
                            </div>
                        </div>
                        <div className="flex flex-col">
                            <div>
                                <h3 className="mb-4 text-2xl font-bold text-[#28aae4] md:text-3xl">Global Connection Opportunities</h3>
                                <ul className="list-items opacity-0 animate-[fadeInUp_0.6s_ease-out_0.5s_forwards]">
                                    <li>
                                        Staying in a Xolo Host's Dwelling — Immerse yourself in local life with overnight stays in the homes of Xolo hosts around the XoloGlobe, building deep cultural connections.
                                    </li>
                                    <li>
                                        <span>House and Dwelling Swaps — Swap homes directly with members across the XoloGlobe for cost-free, trust-based travel and reciprocal hospitality.</span>
                                    </li>
                                    <li>
                                        <span>Peer-to-Peer Bed-and-Breakfast — Enjoy personalized stays with insider tips from Xolo hosts on the XoloGlobe.</span>
                                    </li>
                                    <li>
                                        <span>Local Meetups and Day Activities — Connect with Xolo hosts for a guided day out, shared lunch, coffee, or activity—perfect for experiencing the XoloGlobe through authentic, no-commitment local encounters.</span>
                                    </li>
                                    <li>
                                        <span>Community Exchange Network — Tap into the XoloGlobe's global network to offer or access member services, handmade goods, professional skills, or even work trades—fostering collaboration, learning, and mutual support beyond travel</span>
                                    </li>
                                </ul>
                            </div>
                            <div className="mt-10 flex justify-center opacity-0 animate-[fadeInUp_0.6s_ease-out_0.3s_forwards]">
                                <img src="/01a.png" alt="img" className="w-full max-w-md rounded-md" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}

export default Vision;
