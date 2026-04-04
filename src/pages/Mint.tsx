import GsapPageHeading from "../components/GsapPageHeading";
import GsapPageContent from "../components/GsapPageContent";
import GsapPageSubHeading from "../components/GsapPageSubHeading";
import GsapHeroParallax from "../components/GsapHeroParallax";
import MintCountdownSection from "../components/MintCountdownSection";
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
                            eyebrow="The Xoloitzquintle Mint"
                            heading="A Sacred Legacy of"
                            accent="Community, Support, & Degeneracy"
                            iconType="star"
                            iconCount={1}
                            centered
                        />
                        <GsapPageContent as="p" className="mb-4">
                            Claim Your Sacred Guide from the collection of 10,001 Unique Xoloitzquintle XRPL NFTs. Featuring 11 Traits and 311 subtraits, each individually hand-drawn by crypto artist RedShadow.
                            Built on the eco-friendly XRP Ledger: fast transactions, low fees, no gas wars.
                        </GsapPageContent>
                        <GsapPageContent as="p" className="mb-4" delay={0.06}>
                            Mint Status: Coming Soon
                            Launching on the premier XRPL marketplace, the xrp.cafe.
                            Exact date, price, and allowlist details TBA — stay tuned via @XoloDojo and xolodojo.io.
                            Prepare now to own your loyal Xolo guardian and unlock the Xglobe: a token-gated world map for holders to connect, share locations, plan travel or good swaps, and build community IRL.
                        </GsapPageContent>
                        <GsapPageContent as="p" className="mb-4" delay={0.1}>
                            One Mint, One Pin, One Friendship at a time
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
                        <GsapPageSubHeading heading="Prepare to Mint – 3 Simple Steps" />
                        <GsapPageContent staggerChildren>
                            <ul className="list-items">
                                <li>
                                    <span>
                                        <strong className="text-[#28aae4]">Set Up Your XRPL Wallet</strong>
                                    </span>
                                    <ul className="list-items mt-2 ml-4">
                                        <li>
                                            Create or use an existing XRPL wallet.  Xaman and Joey wallet are user-friendly options for beginners, offering seamless XRPL integration and secure key management.
                                        </li>
                                        <li>
                                            Back up your seed phrase securely — never share it.
                                        </li>
                                    </ul>
                                </li>
                                <li>
                                    <span>
                                        <strong className="text-[#28aae4]">Fund with XRP</strong>
                                    </span>
                                    <p className="mt-2">
                                        The XRP Ledger requires a base reserve of 1 XRP to interact with it, with nominal fees for transactions and minting. To ensure a smooth minting experience, we recommend having 20 XRP in your wallet. This allows for wallet activation, transaction costs, and mint fees.
                                    </p>
                                    <ul className="list-items mt-2 ml-4">
                                        <li>
                                            Buy XRP on exchanges like Uphold, Crypto.com, Coinbase, or via the XRPL DEX.                                        </li>
                                        <li>
                                            Wallet activation/XRPL reserve
                                        </li>
                                        <li>
                                            Transaction costs/Mint fees
                                        </li>
                                    </ul>
                                </li>
                                <li>
                                    <span>
                                        <strong className="text-[#28aae4]">Mint Your XOLO</strong>
                                    </span>
                                    <ul className="list-items mt-2 ml-4">
                                        <li>
                                            On launch: Navigate right back here to The XoloDojo Mint page. Click on the Mint button below to be directed to the mint in the xrp.cafe.
                                        </li>
                                        <li>
                                            In the xrp.cafe, connect your wallet, click the mint button, select your mint quantity, and confirm the transaction in your wallet. Your unique XoloNFT will arrive in seconds.
                                        </li>
                                        <li>
                                            Once Minted and viewable in your wallet, you're ready to pin on the XGlobe, where you can manage your collection, view your traits, and share your Xolo  profile!
                                        </li>
                                        <li>
                                            Need help? Visit our FAQ or join our community on Discord for support.
                                        </li>
                                    </ul>
                                </li>
                            </ul>
                        </GsapPageContent>
                        <GsapPageContent className="mt-10 flex justify-center" delay={0.06}>
                            <img src="/xrp-cafe-mint.png" alt="img" className="w-full max-w-md rounded-md" />
                        </GsapPageContent>
                        <MintCountdownSection />
                    </div>
                </div>
            </section>
        </>
    );
}

export default Mint;
