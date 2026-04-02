import { useState } from 'react';

import GsapPageSubHeading from '../components/GsapPageSubHeading';

const faqItems = [
  {
    id: 'faq-project-1',
    question: 'What Is The Xoloitzquintle?',
    answer:
      "The Xoloitzcuintle (Shō-lō eats-kwēnt-lee), also known as Xolo (Shō-lō), is one of the world's oldest breeds, with archaeological evidence dating back over 3,000–3,500 years in Mesoamerican civilizations (including Colima, Toltec, Zapotec, Maya, and Aztec cultures). Revered as a sacred spiritual guide and loyal companion, it was believed to guard homes from evil spirits in life and accompany souls through the dangers of Mictlan (the Aztec underworld/afterlife) to reach eternal rest. Named after the god Xolotl (lightning, death, and transformation) and the Nahuatl word for dog (itzcuintli), the Xolo symbolizes protection, healing, and the journey between worlds.",
  },
  {
    id: 'faq-project-2',
    question: 'Who Is The Creator?',
    answer:
      "Cryptonite — a nomadic, blockchain-agnostic digital pirate who's been sailing the Cryptocurrenseas since 2016. With footprints in 34 countries shaping a deep appreciation for diverse cultures and meaningful connections, he's a proud XRP Army member building The Xoloitzquintle Collection on the XRPL. Teaming with visionary artist RedShadow, he's creating XoloDojo and Xglobe: a token-gated global community for trust, travel, skill-sharing, and genuine shared experiences. Own a XoloNFT and join the voyage.",
  },
  {
    id: 'faq-project-3',
    question: 'Who Is The Artist?',
    answer:
      "RedShadow is the visionary artist behind The Xoloitzquintle Collection. With a masterful eye for detail and deep respect for Mesoamerican heritage, RedShadow designs each of the 10,001 unique XoloNFTs as sacred digital guardians — blending timeless cultural symbolism with striking, evocative artwork that honors the Xoloitzquintle's spiritual role as a companion and soul guide. Teaming with Cryptonite, RedShadow's artistry forms the visual foundation of XoloDojo and Xglobe.",
  },
  {
    id: 'faq-project-5',
    question: 'What Wallet And Funds Do I Need To Prepare?',
    answer:
      'You will need an XRPL-compatible wallet like MadLab Pro. Ensure your wallet is funded with XRP, 20 XRP is recommended to cover the XRPL\'s wallet reserve and minimal transaction fees.',
  },
  {
    id: 'faq-project-4',
    question: 'When And Where And Where Can I Mint A Xolo NFT?',
    answer:
      "The mint for The Xoloitzcuintle Collection (10,001 unique XoloNFTs) is coming soon on xrp.cafe, the premier marketplace for XRPL-based NFTs. Built on the eco-friendly XRP Ledger (XRPL), the mint will feature low-cost, fast transactions with no gas wars. Prepare now: set up an XRPL-compatible wallet (like Xaman or Mad Lab), fund it with at least 20 XRP, and stay tuned to xolodojo.io or @XoloDojo for the exact launch announcement and any allowlist details. Get ready to own your sacred Xolo guardian and unlock the Xglobe!",
  },
];

function FAQ() {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <>
      <section
        className="relative border-b border-[#36e9e424] bg-cover bg-center bg-no-repeat pt-16 pb-4 md:pt-[7.5rem]"
        style={{ backgroundImage: "url('/Pattern.png')" }}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center text-center">
            <div className="mb-8">
              <img src="/04a.png" alt="" className="max-h-56 w-auto rounded-md object-contain md:max-h-80" />
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#1a1a1e] py-8 lg:py-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 [&_p]:text-[#decee9]">
          <GsapPageSubHeading heading="Frequently Asked Questions" />
          <div className="mt-8 mb-4 divide-y divide-white/20 overflow-hidden rounded-xl border border-[#decee9]/20 bg-black/70">
            {faqItems.map((item) => {
              const isOpen = openId === item.id;
              return (
                <div key={item.id} className="bg-black/20 first:rounded-t-xl last:rounded-b-xl overflow-hidden">
                  <h3>
                    <button
                      type="button"
                      onClick={() => setOpenId(isOpen ? null : item.id)}
                      className="cursor-pointer flex w-full items-center justify-between gap-4 py-4 px-5 text-left text-base font-medium text-[#61f7fe] transition-colors hover:bg-black/50 md:text-lg"
                      aria-expanded={isOpen}
                      aria-controls={`${item.id}-body`}
                      id={`${item.id}-head`}
                    >
                      {item.question}
                      <span
                        className={`shrink-0 text-xl text-white/80 transition-transform duration-100 ${isOpen ? 'rotate-180' : ''}`}
                        aria-hidden
                      >
                        ▼
                      </span>
                    </button>
                  </h3>
                  <div
                    id={`${item.id}-body`}
                    role="region"
                    aria-labelledby={`${item.id}-head`}
                    hidden={!isOpen}
                    className={isOpen ? 'overflow-hidden animate-fade-in-up' : 'overflow-hidden'}
                  >
                    <div className="border-t border-white/20 bg-white/5 px-5 pb-4 pt-2">
                      <p className="text-sm leading-relaxed text-white/90 md:text-base">
                        {item.answer}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}

export default FAQ;
