import GsapPageHeading from "../components/GsapPageHeading";
import GsapPageContent from "../components/GsapPageContent";
import GsapPageSubHeading from "../components/GsapPageSubHeading";
import GsapHeroParallax from "../components/GsapHeroParallax";
import SectionParallaxBlobs from "../components/SectionParallaxBlobs";
import { useSectionParallaxOffsets } from "../hooks/useSectionParallaxOffsets";

function Mint() {
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
                            heading="The Xoloitzquintle Mint"
                            accent="Art, Culture, & XRPL"
                            iconType="star"
                            iconCount={1}
                            centered
                        />
                        <GsapPageContent as="p" className="mb-4">
                            Claim Your Sacred Guide from the collection of 10,001 Unique XRPL NFTs hand-drawn with deep Mesoamerican roots, featuring 7 distinct traits + 217 sub-traits by RedShadow.
                            Built on the eco-friendly XRP Ledger: fast transactions, low fees, no gas wars.
                        </GsapPageContent>
                        <GsapPageContent as="p" className="mb-4" delay={0.06}>
                            Mint Status: Coming Soon
                            Launching on the premier XRPL marketplace, the xrp.cafe.
                            Exact date, price, and allowlist details TBA — stay tuned via @XoloDojo and xolodojo.io.
                            Prepare now to own your loyal Xolo guardian and unlock the XoloGlobe: a token-gated world map for holders to connect, share locations, plan travel swaps, and build community IRL.
                        </GsapPageContent>
                        <GsapPageContent as="p" className="mb-4" delay={0.1}>
                            One Mint, One NFT, One Pin at a time
                        </GsapPageContent>
                        <div className="container mx-auto max-w-7xl px-4">                            <div className="flex flex-col items-center text-center">
                            <GsapHeroParallax
                                imageSrc="/paralax-bg.png"
                                alt="Xoloitzquintle Mint Hero"
                                className="mb-10"
                            />
                        </div>
                        </div>
                        <GsapPageSubHeading heading="Prepare to Mint – 4 Simple Steps" />
                        <GsapPageContent>
                            <ul className="list-items">
                                <li>
                                    <span>
                                        <strong className="text-[#f7eab7]">Set Up Your XRPL Wallet</strong>
                                        Download a trusted, XRPL-compatible wallet:
                                    </span>
                                    <ul className="list-items mt-2 ml-4">
                                        <li>
                                            Xaman (recommended for ease)
                                        </li>
                                        <li>
                                            MadLabs / Xoge (advanced features)
                                            Create or use an existing wallet. Back up your seed phrase securely — never share it.
                                        </li>
                                    </ul>
                                </li>
                                <li>
                                    <span>
                                        <strong className="text-[#f7eab7]">Fund with XRP (Minimum 20+ Recommended)</strong>
                                    </span>
                                    <p className="mt-2">
                                        The XRP Ledger requires a base reserve of 1 XRP to interact with it, with nominal fees for transactions and minting. To ensure a smooth minting experience, we recommend having at least 20 XRP in your wallet to cover all costs and potential fluctuations.
                                    </p>
                                    <ul className="list-items mt-2 ml-4">
                                        <li>
                                            Wallet activation/reserve
                                        </li>
                                        <li>
                                            Transaction costs
                                        </li>
                                        <li>
                                            Mint fees (typically very low on XRPL)
                                            Buy XRP on exchanges like Uphold, Bitrue, or via the XRPL DEX.
                                        </li>
                                    </ul>
                                </li>
                                <li>
                                    <span>
                                        <strong className="text-[#f7eab7]">Connect to xrp.cafe</strong>
                                    </span>
                                    <ul className="list-items mt-2 ml-4">
                                        <li>
                                            Go to <a href="https://xrp.cafe" target="_blank" rel="noopener noreferrer" className="text-[#b7e9f7] hover:text-white transition-all duration-300 ease-in-out no-underline hover:no-underline">XRP Cafe</a>
                                        </li>
                                        <li>
                                            Click "Connect Wallet" → Choose your XRPL wallet → Sign the secure request.
                                        </li>
                                        <li>
                                            Once connected, you'll see the official Xoloitzquintle collection when it drops.
                                        </li>
                                    </ul>
                                </li>
                                <li>
                                    <span>
                                        <strong className="text-[#f7eab7]">Mint Your Xolo When Live</strong>
                                    </span>
                                    <ul className="list-items mt-2 ml-4">
                                        <li>
                                            On launch: Navigate to the Xoloitzquintle collection page.
                                        </li>
                                        <li>
                                            Select your mint quantity (if allowed), confirm the transaction.
                                        </li>
                                        <li>
                                            Your unique NFT arrives in seconds on the ledger.
                                        </li>
                                        <li>
                                            Then verify ownership on xolodojo.io to access XoloGlobe perks!
                                        </li>
                                    </ul>
                                </li>
                            </ul>
                        </GsapPageContent>
                        <GsapPageContent className="mt-10 flex justify-center" delay={0.06}>
                            <img src="/xrp-cafe-mint.png" alt="img" className="w-full max-w-md rounded-md" />
                        </GsapPageContent>
                    </div>
                </div>
            </section>
        </>
    );
}

export default Mint;
