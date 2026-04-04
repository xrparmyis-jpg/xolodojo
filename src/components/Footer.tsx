import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faDiscord,
  faInstagram,
  faLinkedinIn,
  faTelegram,
  faTiktok,
  faXTwitter,
} from "@fortawesome/free-brands-svg-icons";

import SectionBlobs from "./SectionBlobs";
import GsapPageContent from "./GsapPageContent";

function Footer() {
  const footerRef = useRef<HTMLElement>(null);
  const [greenBlobOffset, setGreenBlobOffset] = useState(0);
  const [orangeBlobOffset, setOrangeBlobOffset] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!footerRef.current) return;

      const rect = footerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      if (rect.top <= windowHeight && rect.bottom >= 0) {
        const sectionTop = rect.top;
        const sectionHeight = rect.height;

        const scrollProgress = Math.max(0, (windowHeight - sectionTop) / (windowHeight + sectionHeight));
        const greenOffset = scrollProgress * sectionHeight * 0.3;
        const orangeOffset = scrollProgress * sectionHeight * 0.4;

        setGreenBlobOffset(greenOffset);
        setOrangeBlobOffset(orangeOffset);
      } else {
        setGreenBlobOffset(0);
        setOrangeBlobOffset(0);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <footer ref={footerRef} className="border-t border-[#36e9e424] relative overflow-hidden py-4 lg:py-8 bg-[#1a1a1e]">
      <SectionBlobs
        greenBlobOffset={greenBlobOffset}
        orangeBlobOffset={orangeBlobOffset}
      />

      <div className="mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl relative z-10">
        {/* XRPL Resources Section */}
        <div className="mb-4 flex flex-col items-center">
          <GsapPageContent
            as="h3"
            className="mb-6 text-xl font-bold text-white md:text-2xl"
            delay={0}
            intersectionThreshold={0}
            intersectionRootMargin="0px"
          >
            XRPL Resources
          </GsapPageContent>
          <GsapPageContent
            className="w-full max-w-5xl"
            delay={0.06}
            intersectionThreshold={0}
            intersectionRootMargin="0px"
          >
            <div className="grid grid-cols-1 justify-items-center gap-2 sm:grid-cols-2 sm:gap-4 lg:grid-cols-5">
              <a href="https://xrp.cafe/" className="text-white text-sm sm:text-base whitespace-nowrap transition-all duration-300 ease-in-out no-underline hover:text-[#b7e9f7] hover:no-underline">
                Xrp.cafe Marketplace
              </a>
              <a href="https://xaman.app/" className="text-white text-sm sm:text-base whitespace-nowrap transition-all duration-300 ease-in-out no-underline hover:text-[#b7e9f7] hover:no-underline">
                Xaman Wallet
              </a>
              <a href="https://xrpscan.com/" className="text-white text-sm sm:text-base whitespace-nowrap transition-all duration-300 ease-in-out no-underline hover:text-[#b7e9f7] hover:no-underline">
                XRPSCAN Explorer
              </a>
              <a href="https://www.xrptoolkit.com/" className="text-white text-sm sm:text-base whitespace-nowrap transition-all duration-300 ease-in-out no-underline hover:text-[#b7e9f7] hover:no-underline">
                XRP Toolkit
              </a>
              <a href="https://xrpl.org/" className="text-white text-sm sm:text-base whitespace-nowrap transition-all duration-300 ease-in-out no-underline hover:text-[#b7e9f7] hover:no-underline">
                Official XRPL Site
              </a>
            </div>
          </GsapPageContent>
        </div>

        {/* Footer Bottom Section */}
        <div className="flex flex-col items-center justify-between gap-5 pt-6 md:flex-row md:gap-0 md:pr-14 lg:pr-16">
          <GsapPageContent
            className="flex flex-col items-center gap-2 md:items-start"
            delay={0.1}
            intersectionThreshold={0}
            intersectionRootMargin="0px"
          >
            <p className="text-center text-sm text-[#cdcdcd] md:text-left">
              The Xoloitzquintle Collection © 2024. All Rights Reserved.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 md:justify-start">
              <Link to="/faq" className="text-sm text-[#cdcdcd] no-underline transition-all duration-300 ease-in-out hover:text-[#b7e9f7] hover:no-underline">
                FAQ
              </Link>
              <Link to="/terms-and-conditions" className="text-sm text-[#cdcdcd] no-underline transition-all duration-300 ease-in-out hover:text-[#b7e9f7] hover:no-underline">
                Terms &amp; Conditions
              </Link>
              <Link to="/privacy-policy" className="text-sm text-[#cdcdcd] no-underline transition-all duration-300 ease-in-out hover:text-[#b7e9f7] hover:no-underline">
                Privacy Policy
              </Link>
            </div>
          </GsapPageContent>
          <GsapPageContent
            className="flex flex-wrap items-center justify-center gap-2 md:justify-end"
            delay={0.18}
            intersectionThreshold={0}
            intersectionRootMargin="0px"
          >
            <a href="#" title="X (Twitter)" className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#cfd0d4] text-[#cdcdcd] transition-all duration-300 ease-in-out no-underline hover:bg-black/40 hover:text-[#b7e9f7] hover:no-underline" aria-label="X (Twitter)">
              <FontAwesomeIcon icon={faXTwitter} />
            </a>
            <a href="#" title="Discord" className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#cfd0d4] text-[#cdcdcd] transition-all duration-300 ease-in-out no-underline hover:bg-black/40 hover:text-[#b7e9f7] hover:no-underline" aria-label="Discord">
              <FontAwesomeIcon icon={faDiscord} />
            </a>
            <a href="#" title="LinkedIn" className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#cfd0d4] text-[#cdcdcd] transition-all duration-300 ease-in-out no-underline hover:bg-black/40 hover:text-[#b7e9f7] hover:no-underline" aria-label="LinkedIn">
              <FontAwesomeIcon icon={faLinkedinIn} />
            </a>
            <a href="#" title="TikTok" className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#cfd0d4] text-[#cdcdcd] transition-all duration-300 ease-in-out no-underline hover:bg-black/40 hover:text-[#b7e9f7] hover:no-underline" aria-label="TikTok">
              <FontAwesomeIcon icon={faTiktok} />
            </a>
            <a href="#" title="Instagram" className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#cfd0d4] text-[#cdcdcd] transition-all duration-300 ease-in-out no-underline hover:bg-black/40 hover:text-[#b7e9f7] hover:no-underline" aria-label="Instagram">
              <FontAwesomeIcon icon={faInstagram} />
            </a>
            <a href="#" title="Telegram" className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#cfd0d4] text-[#cdcdcd] transition-all duration-300 ease-in-out no-underline hover:bg-black/40 hover:text-[#b7e9f7] hover:no-underline" aria-label="Telegram">
              <FontAwesomeIcon icon={faTelegram} />
            </a>
          </GsapPageContent>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
