import DraggablePin from "../components/DraggablePin";
import SectionParallaxBlobs from "../components/SectionParallaxBlobs";
import { useSectionParallaxOffsets } from "../hooks/useSectionParallaxOffsets";

function XoloGlobe() {
    const { sectionRef, bgShapeOffset, colorBgOffset, colorBg2Offset } = useSectionParallaxOffsets();

    return (
        <>
            <section
                className="relative bg-[url('/Pattern.png')] bg-cover bg-center bg-no-repeat pt-16 pb-4 md:pt-30 border-b border-[#36e9e424]"
            >
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <DraggablePin
                        style="mapbox://styles/mapbox/standard-satellite"
                        className="relative mx-auto my-8 w-full max-w-7xl overflow-hidden rounded-lg h-90 sm:h-107.5 md:h-130 lg:h-155 xl:h-175"
                    />
                </div>
            </section>

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
                        <div className="opacity-0 animate-[fadeInUp_0.6s_ease-out_0.3s_forwards]">
                            <h2 className="text-2xl md:text-3xl font-bold mb-4 text-[#28aae4]">
                                The living map of our global community
                            </h2>
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
                        </div>

                        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-start">
                            <div>
                                <div className="opacity-0 animate-[fadeInUp_0.6s_ease-out_0.6s_forwards] mt-4">
                                    <h3 className="text-lg md:text-xl font-semibold text-[#891387] mb-3">
                                        How It Works
                                    </h3>

                                    <ul className="list-items">
                                        <li>
                                            <span><strong className="text-[#f7eab7]">Connect Your Wallet</strong> — Click "Connect Wallet," select your XRPL wallet (Xaman Wallet, Xoge's MadLabs, etc.), and sign. We verify your Xolo NFT ownership instantly on the XRP Ledger.</span>
                                        </li>
                                        <li>
                                            <span><strong className="text-[#f7eab7]">Pin Your Location</strong> — Drop your pin anywhere meaningful — your home base, current travels, or a dream destination you're open to sharing.</span>
                                        </li>
                                        <li>
                                            <span><strong className="text-[#f7eab7]">Showcase Your Xolo</strong> — Choose which Xolo NFT to feature. Your pin displays its artwork, letting your personality shine through to the community.</span>
                                        </li>
                                        <li>
                                            <span><strong className="text-[#f7eab7]">Discover & Connect</strong> — Explore pins worldwide. Click any to view their Xolo, profile, and current offerings. Reach out directly to:</span>
                                        </li>
                                    </ul>
                                </div>
                                <div className="opacity-0 animate-[fadeInUp_0.6s_ease-out_0.8s_forwards] mt-4">
                                    <h4 className="text-lg md:text-xl font-semibold text-[#891387] mb-3">
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
                                </div>

                                <div className="opacity-0 animate-[fadeInUp_0.6s_ease-out_1.0s_forwards] mt-4">
                                    <h4 className="text-lg md:text-xl font-semibold text-[#891387] mb-3">A platform for more than one tribe</h4>
                                    <p className="text-white/90">
                                        Over time, the XoloGlobe will open its doors to
                                        other verified, values-aligned NFT communities who
                                        share our vision of trust-based human connection.
                                    </p>
                                    <p className="text-white/90 mt-4">
                                        Just as our Mission states: we're cultivating a
                                        global dojo where shared experiences weave a
                                        stronger, more connected world. Connect your wallet and join the XoloGlobe today!
                                    </p>
                                </div>
                            </div>
                            <div className="flex justify-center opacity-0 animate-[fadeInUp_0.6s_ease-out_0.5s_forwards] lg:justify-end">
                                <img
                                    src="/01a.png"
                                    alt="Xolo Globe Map"
                                    className="w-full max-w-md"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}

export default XoloGlobe;
