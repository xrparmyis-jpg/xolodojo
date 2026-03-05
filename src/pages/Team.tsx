import PageTitle from "../components/PageTitle";
import SectionParallaxBlobs from "../components/SectionParallaxBlobs";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faDiscord,
    faXTwitter,
    faTiktok,
    faInstagram,
    faTelegram,
} from "@fortawesome/free-brands-svg-icons";
import { faEnvelope } from "@fortawesome/free-solid-svg-icons";
import { useSectionParallaxOffsets } from "../hooks/useSectionParallaxOffsets";

interface Owner {
    id: number;
    name: string;
    title: string;
    image: string;
    email?: string;
    socials?: {
        twitter?: string;
        discord?: string;
        tiktok?: string;
        instagram?: string;
        telegram?: string;
    };
}

const owners: Owner[] = [
    {
        id: 1,
        name: "Cryptonite",
        title: "Founder & Visionary Explorer",
        image: "/team/Cryptonite.jpg",
        email: "xrparmyis@gmail.com",
        socials: {
            twitter: "https://x.com/XoloDojo",
            discord: "#",
            tiktok: "#",
            instagram: "#",
            telegram: "#",
        },
    },
    {
        id: 2,
        name: "RedShadow",
        title: "Visionary Artist & Cultural Alchemist",
        image: "/team/RedShadow.jpg",
        email: "redshadow@xolodojo.com",
        socials: {
            twitter: "#",
            discord: "#",
            tiktok: "#",
            instagram: "#",
            telegram: "#",
        },
    },
    {
        id: 3,
        name: "Code",
        title: "Lead Builder & Degen Architect",
        image: "/team/Code2.jpg",
        email: "code@xolodojo.com",
        socials: {
            twitter: "#",
            discord: "#",
            tiktok: "#",
            instagram: "#",
            telegram: "#",
        },
    },
];

function OwnerCard({ owner }: { owner: Owner }) {
    const isValidLink = (s?: string) => !!s && s !== "#" && s.trim() !== "";
    return (
        <div className="flex flex-col items-center text-center">
            <div className="mb-4 overflow-hidden rounded-lg w-full max-w-xs">
                <img
                    src={owner.image}
                    alt={owner.name}
                    className="w-full h-auto object-cover"
                />
            </div>
            <h3 className="text-xl md:text-2xl font-bold text-[#ad3dab] mb-1">
                {owner.name}
            </h3>
            <p className="text-sm md:text-base mb-4">
                {owner.title}
            </p>
            <div className="flex items-center gap-2">
                {isValidLink(owner.email) && (
                    <a
                        href={`mailto:${owner.email}`}
                        title={owner.title}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-[#b7e9f7] text-[#cdcdcd] hover:text-white hover:bg-[#b7e9f7]/80 transition-all duration-300 ease-in-out"
                    >
                        <FontAwesomeIcon icon={faEnvelope} size="sm" />
                    </a>
                )}
                {isValidLink(owner.socials?.twitter) && (
                    <a
                        href={owner.socials!.twitter}
                        title={owner.title}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-[#b7e9f7] text-[#cdcdcd] hover:text-white hover:bg-[#b7e9f7]/80 transition-all duration-300 ease-in-out"
                    >
                        <FontAwesomeIcon icon={faXTwitter} size="sm" />
                    </a>
                )}
                {isValidLink(owner.socials?.discord) && (
                    <a
                        href={owner.socials!.discord}
                        title={owner.title}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-[#b7e9f7] text-[#cdcdcd] hover:text-white hover:bg-[#b7e9f7]/80 transition-all duration-300 ease-in-out"
                    >
                        <FontAwesomeIcon icon={faDiscord} size="sm" />
                    </a>
                )}
                {isValidLink(owner.socials?.tiktok) && (
                    <a
                        href={owner.socials!.tiktok}
                        title={owner.title}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-[#b7e9f7] text-[#cdcdcd] hover:text-white hover:bg-[#b7e9f7]/80 transition-all duration-300 ease-in-out"
                    >
                        <FontAwesomeIcon icon={faTiktok} size="sm" />
                    </a>
                )}
                {isValidLink(owner.socials?.instagram) && (
                    <a
                        href={owner.socials!.instagram}
                        title={owner.title}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-[#b7e9f7] text-[#cdcdcd] hover:text-white hover:bg-[#b7e9f7]/80 transition-all duration-300 ease-in-out"
                    >
                        <FontAwesomeIcon icon={faInstagram} size="sm" />
                    </a>
                )}
                {isValidLink(owner.socials?.telegram) && (
                    <a
                        href={owner.socials!.telegram}
                        title={owner.title}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-[#b7e9f7] text-[#cdcdcd] hover:text-white hover:bg-[#b7e9f7]/80 transition-all duration-300 ease-in-out"
                    >
                        <FontAwesomeIcon icon={faTelegram} size="sm" />
                    </a>
                )}
            </div>
        </div>
    );
}

function Team() {
    const { sectionRef, bgShapeOffset, colorBgOffset, colorBg2Offset } = useSectionParallaxOffsets();

    return (
        <div className="[&_p]:text-[#decee9] [&_ul]:text-[#decee9] [&_li]:text-[#decee9] [&_li>span]:text-[#decee9]">
            <section
                className="relative bg-[url('/Pattern.png')] bg-cover bg-center bg-no-repeat pt-16 pb-4 md:pt-30 border-b border-[#36e9e424]"
            >
                <div className="container mx-auto max-w-7xl px-4">
                    <div className="flex flex-col items-center text-center my-8">
                        <div className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-10">
                            {owners.map((owner) => (
                                <OwnerCard key={owner.id} owner={owner} />
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            <section
                ref={sectionRef}
                className="relative overflow-hidden py-8 lg:py-12 bg-(--bg)"
            >
                <SectionParallaxBlobs
                    bgShapeOffset={bgShapeOffset}
                    colorBgOffset={colorBgOffset}
                    colorBg2Offset={colorBg2Offset}
                />

                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="max-w-4xl mx-auto">
                        <div className="opacity-0 animate-[fadeInUp_0.6s_ease-out_0.3s_forwards] mb-8">
                                  <div className="section-title text-center">
                                    <PageTitle title="The Xoloitzquintle Collection" animate delay={0} iconType="star" iconCount={1} centered />
                                    <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4 opacity-0 animate-[fadeInUp_0.6s_ease-out_0.3s_forwards]">
                                      A Sacred Legacy of <br />
                                      <span>Art, Culture, &amp; XRPL</span>
                                    </h2>
                                  </div>
                            <p className="mb-7">
                                United by culture, art, and crypto, we're forging XoloDojo and XoloGlobe: a token-gated global tribe for trust, travel, skill-sharing, and real-world adventures.
                            </p>
                        </div>

                        <div className="opacity-0 animate-[fadeInUp_0.6s_ease-out_0.5s_forwards] mt-8">
                            <h3 className="text-2xl md:text-3xl font-bold text-[#28aae4]">
                                Cryptonite
                            </h3>
                            <h4 className="text-lg md:text-xl font-semibold text-[#642ff8] mb-4">
                                Founder & Visionary Explorer
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-[226px_1fr] gap-6 pt-4">
                                <div className="shrink-0">
                                    <img src="/xolo-nft-showcase-01.png" alt="Cryptonite" className="w-full max-w-56.5 rounded-sm" />
                                </div>
                                <div className="flex flex-col justify-start">
                                    <p className="text-justify">
                                        Cryptonite is a nomadic, blockchain-agnostic digital pirate who's been sailing the Cryptocurrenseas since 2016,
                                        with footprints in 34 countries that have shaped a deep appreciation for diverse cultures and meaningful connections.
                                        A proud XRP Army member marching forward with bullish conviction, he's the creator behind The Xoloitzquintle
                                        Collection on the XRPL — fusing ancient Mesoamerican reverence for the sacred Xoloitzquintle with modern
                                        innovation and genuine shared experiences. He's laying the foundation for XoloGlobe: a global, member-built
                                        dojo for trust, travel, skill-sharing, and soul-guided adventures — all powered by XoloDojo.
                                        Own a XoloNFT and join the voyage. If you ain't bullish, you're walking the plank.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="opacity-0 animate-[fadeInUp_0.6s_ease-out_0.7s_forwards] mt-8">
                            <h3 className="text-2xl md:text-3xl font-bold text-[#28aae4]">
                                RedShadow
                            </h3>
                            <h4 className="text-lg md:text-xl font-semibold text-[#891387] mb-4">
                                Visionary Artist & Cultural Alchemist
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-[226px_1fr] gap-6 pt-4">
                                <div className="shrink-0">
                                    <img src="/xolo-nft-showcase-01.png" alt="RedShadow" className="w-full max-w-56.5 rounded-sm" />
                                </div>
                                <div className="flex flex-col justify-start">
                                    <p className="text-justify">
                                        RedShadow is the visionary artist breathing life into The Xoloitzquintle Collection. With a masterful eye for
                                        detail and deep respect for Mesoamerican heritage, RedShadow crafts each of the 10,001 unique XoloNFTs as
                                        sacred digital guardians — blending timeless cultural symbolism with striking, evocative designs that honor
                                        the Xoloitzquintle's role as a spiritual companion and soul guide. Teaming with Cryptonite, RedShadow's
                                        artistry forms the visual heart of XoloDojo and XoloGlobe, inviting holders into a world where ancient
                                        legacy meets modern community and real-world reciprocity.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="opacity-0 animate-[fadeInUp_0.6s_ease-out_0.9s_forwards] mt-8">
                            <h3 className="text-2xl md:text-3xl font-bold text-[#28aae4]">
                                Code
                            </h3>
                            <h4 className="text-lg md:text-xl font-semibold text-[#a32ca1] mb-4">
                                Lead Builder & Degen Architect
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-[226px_1fr] gap-6 pt-4">
                                <div className="shrink-0">
                                    <img src="/xolo-nft-showcase-01.png" alt="Code" className="w-full max-w-56.5 rounded-sm" />
                                </div>
                                <div className="flex flex-col justify-start">
                                    <p className="text-justify">
                                        Code is a battle-hardened degen from the golden Clubhouse days on Ethereum, a seasoned crypto trader with razor-sharp market instincts and hands-on building experience. Fluid in React.js and battle-tested in high-stakes web development, he's shipped name-brand websites (under NDA) for top players in the space. Now building with the Xolo pack on XRPL, Code delivers the technical backbone for XoloDojo and XoloGlobe—turning visionary ideas into seamless, secure, token-gated experiences. From smart community tools to immersive interfaces, he ensures the dojo runs smoothly, the globe connects flawlessly, and the pack thrives in Web3. Degen roots. Builder soul. Xolo loyalty.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="opacity-0 animate-[fadeInUp_0.6s_ease-out_1.1s_forwards] mt-8 clear-both">
                            <p className="mb-7">
                                Together, we're not just minting NFTs — we're summoning a global pack of guardians ready to explore, connect, and build the future.
                            </p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}

export default Team;
