import PageTitle from "../components/PageTitle";
import SectionParallaxBlobs from "../components/SectionParallaxBlobs";
import { useSectionParallaxOffsets } from "../hooks/useSectionParallaxOffsets";

function Mint() {
    const { sectionRef, bgShapeOffset, colorBgOffset, colorBg2Offset } = useSectionParallaxOffsets();

    return (
        <>
            <section
                className="relative bg-[url('/Pattern.png')] bg-cover bg-center bg-no-repeat pt-16 pb-4 md:pt-30 border-b border-[#36e9e424]"
            >
                <div className="container mx-auto max-w-7xl px-4">
                    <div className="flex flex-col items-center text-center">
                        <div className="mb-8">
                            <PageTitle title="The Mint" />
                        </div>
                        <div className="mb-10">
                            <img src="/04a.png" alt="" className="max-h-56 w-auto rounded-md object-contain md:max-h-80" />
                        </div>
                    </div>
                </div>
            </section>

            <section ref={sectionRef} className="relative overflow-hidden py-8 lg:py-12 bg-[var(--bg)]">
                <SectionParallaxBlobs
                    bgShapeOffset={bgShapeOffset}
                    colorBgOffset={colorBgOffset}
                    colorBg2Offset={colorBg2Offset}
                />

                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="max-w-4xl mx-auto [&_p]:text-[#decee9] [&_ul]:text-[#decee9] [&_li]:text-[#decee9] [&_li>span]:text-[#decee9]">
                        <div className="section-title text-center">
                            <PageTitle title="The Xoloitzquintle Collection" animate delay={0} iconType="star" iconCount={1} centered />
                            <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4 opacity-0 animate-[fadeInUp_0.6s_ease-out_0.3s_forwards]">
                                The Xoloitzquintle Mint <br />
                                <span>Art, Culture, &amp; XRPL</span>
                            </h2>
                        </div>
                        <p className="opacity-0 animate-[fadeInUp_0.6s_ease-out_0.5s_forwards] mb-4">
                            Claim Your Sacred Guide from the collection of 10,001 Unique XRPL NFTs hand-drawn with deep Mesoamerican roots, featuring 7 distinct traits + 217 sub-traits by RedShadow.
                            Built on the eco-friendly XRP Ledger: fast transactions, low fees, no gas wars.
                        </p>
                        <p className="opacity-0 animate-[fadeInUp_0.6s_ease-out_0.4s_forwards] mb-4">
                            Mint Status: Coming Soon
                            Launching on the premier XRPL marketplace: xrp.cafe
                            Exact date, price, and any allowlist details TBA — stay tuned via @XoloDojo and xolodojo.io.
                            Prepare now to own your loyal Xolo guardian and unlock the XoloGlobe: a token-gated world map for holders to connect, share locations, plan travel swaps, and build community IRL.
                        </p>

                        <h3 className="text-2xl md:text-3xl font-bold mb-4 mt-8 text-[#28aae4]">
                            Prepare to Mint – 4 Simple Steps
                        </h3>
                        <div className="opacity-0 animate-[fadeInUp_0.6s_ease-out_0.4s_forwards]">
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
                                        The XRP Ledger requires a base reserve (around 10–20 XRP depending on features) plus extra for fees and trust lines.
                                        Send at least 20 XRP to your wallet to cover:
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
                                            Go to https://xrp.cafe
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
                        </div>
                        <div className="mt-10 flex justify-center opacity-0 animate-[fadeInUp_0.6s_ease-out_0.3s_forwards]">
                            <img src="/xrp-cafe-mint.png" alt="img" className="w-full max-w-md rounded-md" />
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}

export default Mint;
