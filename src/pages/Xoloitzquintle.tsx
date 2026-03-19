import GsapHeroParallax from "../components/GsapHeroParallax";
import GsapPageHeading from "../components/GsapPageHeading";
import GsapPageSubHeading from "../components/GsapPageSubHeading";
import SectionParallaxBlobs from "../components/SectionParallaxBlobs";
import { useSectionParallaxOffsets } from "../hooks/useSectionParallaxOffsets";

function Xoloitzquintle() {
    const { sectionRef, bgShapeOffset, colorBgOffset, colorBg2Offset } = useSectionParallaxOffsets();

    return (
        <>
            <section
                className="relative bg-[url('/Pattern.png')] bg-cover bg-center bg-no-repeat pt-16 pb-4 md:pt-30 border-b border-[#36e9e424]"
            >
            </section>
            <section ref={sectionRef} className="relative overflow-hidden py-8 lg:py-12 bg-(--bg)">
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
                            accent="Gods, Guardians, & Eternal Bonds"
                            iconType="star"
                            iconCount={1}
                            centered
                        />
                        <div className="container mx-auto max-w-7xl px-4">
                            <div className="flex flex-col items-center text-center">
                                <GsapHeroParallax
                                    imageSrc="/04a.png"
                                    alt="Xoloitzquintle Mint Hero"
                                    className="mb-10"
                                />
                            </div>
                        </div>
                        <div className="space-y-6">
                            <GsapPageSubHeading heading="Journey of the Xolo" />
                            <p className="opacity-0 animate-[fadeInUp_0.6s_ease-out_0.6s_forwards]">
                                Picture this: the Aztec cosmos is basically a chaotic family reunion that never ends. At the center? The ultimate twin duo—Quetzalcoatl, the chill, feathered-serpent genius of wind, wisdom, creation, and "let's make everything better," and his rowdy, dog-headed brother Xolotl, the lightning-fast trickster god of fire, transformation, deformities, and "hold my conch shell while I pull off the impossible."
                            </p>

                            <p className="opacity-0 animate-[fadeInUp_0.6s_ease-out_0.7s_forwards]">
                                These two aren't just siblings; they're the original dynamic duo who literally rebuilt humanity after the world got wrecked four times (because ancient gods apparently loved a good reset button). Quetzalcoatl, ever the visionary, decides it's time for round five: populate the earth with actual people. But plot twist—he needs the sacred bones from the previous eras, stashed deep in Mictlan, the shadowy, nine-level underworld ruled by the skeletal party-pooper Mictlantecuhtli (the Lord of the Dead) and his queen Mictecacihuatl.
                            </p>

                            <p className="opacity-0 animate-[fadeInUp_0.6s_ease-out_0.8s_forwards]">
                                Quetzalcoatl can't solo this dungeon crawl. Enter Xolotl: dog-faced, shape-shifting, lightning-charged, and 100% ride-or-die. His name literally echoes in the word xoloitzcuintle—the sacred hairless dog bred in his image. Xolotl's like, "Bro, I've been guiding the sun through the underworld every night. I know the shortcuts. Let's go steal some bones."
                            </p>

                            <p className="opacity-0 animate-[fadeInUp_0.6s_ease-out_0.9s_forwards]">
                                They descend into Mictlan's nightmare levels: rivers of blood, screaming winds, mountains of obsidian knives, jaguars that don't play fetch. Mictlantecuhtli isn't handing over the goods without a fight. He sets impossible trials—like blowing a conch shell with no holes. Xolotl, being the ultimate degen trickster, summons worms to drill openings. Boom—impossible becomes "done." They grab the bones and bolt, with the skeletal hordes chasing them like bad exes.
                            </p>

                            <p className="opacity-0 animate-[fadeInUp_0.6s_ease-out_1.0s_forwards]">
                                In the getaway chaos, Quetzalcoatl trips (because even gods have off days), and some bones shatter. That's why humans come in every shape, size, and weird quirk—thanks, cosmic clumsiness!
                            </p>

                            <p className="opacity-0 animate-[fadeInUp_0.6s_ease-out_1.1s_forwards]">
                                Back topside, Quetzalcoatl mixes the bones with his own divine blood, breathing life into the current era. But Xolotl's gig doesn't stop there. He becomes the eternal soul-guide: escorting the dead through Mictlan's perils, warding off evil spirits, and making sure no one gets lost in the afterlife. That's why the Aztecs buried real xoloitzcuintles with their loved ones—loyal companions in life, healers (their body heat was legendary), and furry psychopomps in death. One Xolo to rule the journey, one soul to guide.
                            </p>

                            <p className="opacity-0 animate-[fadeInUp_0.6s_ease-out_1.2s_forwards]">
                                Fast-forward to today: in the Xolo Dojo, we're resurrecting this epic saga on the XRPL. Your XoloNFT isn't just a pretty (or gloriously wrinkly) piece of digital art—it's a sacred guardian reborn, channeling Xolotl's fierce loyalty, trickster smarts, and unbreakable bonds. Mint one, pin it, and unlock XoloGlobe—where holders reach out P2P, turn strangers into allies, share skills, trade services, or plan real-world adventures. Just like the gods' twin pact: no middleman, no limits, eternal vibes.
                            </p>

                            <p className="opacity-0 animate-[fadeInUp_0.6s_ease-out_1.4s_forwards]">
                                Why the quirky spelling "Xoloitzquintle" (with that "qu" instead of "cu")? It's a loving nod to old-school Nahuatl orthography and how Spanish chroniclers/translators rendered the original xōlōitzcuintli (pronounced roughly "show-low-eats-QUEENT-lee"). The "qu" captures the guttural, ancient Aztec sound more faithfully in some traditional texts and codex styles—think of it as the mythic equivalent of using "ye olde" English for flair. We chose it to honor the deep cultural roots, keep the lore authentic, and give our guardians that extra layer of timeless mystery.
                            </p>

                            <p className="opacity-0 animate-[fadeInUp_0.6s_ease-out_1.5s_forwards]">
                                Own your Xolo. Own your journey. Own your destination.
                            </p>
                        </div>
                        <div className="mt-10 flex justify-center opacity-0 animate-[fadeInUp_0.6s_ease-out_0.3s_forwards]">
                            <img src="/xolo-art.png" alt="img" className="w-full max-w-md rounded-md" />
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}

export default Xoloitzquintle;
