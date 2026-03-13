import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faDiscord,
  faReddit,
  faXTwitter,
} from "@fortawesome/free-brands-svg-icons";
import SectionBlobs from "./SectionBlobs";

function Footer() {
  const footerRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [greenBlobOffset, setGreenBlobOffset] = useState(0);
  const [orangeBlobOffset, setOrangeBlobOffset] = useState(0);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        });
      },
      { threshold: 0.1 }
    );

    if (footerRef.current) {
      observer.observe(footerRef.current);
    }

    return () => {
      if (footerRef.current) {
        observer.unobserve(footerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (!footerRef.current) return;

      const rect = footerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      // Apply parallax when footer is in viewport
      if (rect.top <= windowHeight && rect.bottom >= 0) {
        // Calculate scroll progress based on footer's position
        const sectionTop = rect.top;
        const sectionHeight = rect.height;

        // Calculate parallax offset - different speeds for each blob
        // Green blob moves slower (0.3x speed)
        const scrollProgress = Math.max(0, (windowHeight - sectionTop) / (windowHeight + sectionHeight));
        const greenOffset = scrollProgress * sectionHeight * 0.3;
        const orangeOffset = scrollProgress * sectionHeight * 0.4; // Orange moves slightly faster (0.4x speed)

        setGreenBlobOffset(greenOffset);
        setOrangeBlobOffset(orangeOffset);
      } else {
        // Reset when footer is out of viewport
        setGreenBlobOffset(0);
        setOrangeBlobOffset(0);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial calculation

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <footer
      ref={footerRef}
      className="border-t border-[#36e9e424] relative overflow-hidden py-4 lg:py-8 bg-[var(--bg)]"
    >
      <SectionBlobs
        greenBlobOffset={greenBlobOffset}
        orangeBlobOffset={orangeBlobOffset}
      />

      <div className="mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl relative z-10">
        {/* XRPL Resources Section */}
        <div className={`flex flex-col items-center mb-4 ${isVisible ? 'opacity-100' : 'opacity-0'} transition-opacity duration-700 ease-out`}>
          <h3 className="text-xl md:text-2xl font-bold text-white mb-6 opacity-0 animate-[fadeInUp_0.6s_ease-out_0.2s_forwards]">
            XRPL Resources
          </h3>
          <div className="w-full max-w-5xl opacity-0 animate-[fadeInUp_0.6s_ease-out_0.4s_forwards]">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-4 justify-items-center">
              <a href="https://xrp.cafe/" className="text-white text-sm sm:text-base whitespace-nowrap transition-all duration-300 ease-in-out no-underline hover:no-underline">
                Xrp.cafe Marketplace
              </a>
              <a href="https://xaman.app/" className="text-white text-sm sm:text-base whitespace-nowrap transition-all duration-300 ease-in-out no-underline hover:no-underline">
                Xaman Wallet
              </a>
              <a href="https://xrpscan.com/" className="text-white text-sm sm:text-base whitespace-nowrap transition-all duration-300 ease-in-out no-underline hover:no-underline">
                XRPSCAN Explorer
              </a>
              <a href="https://www.xrptoolkit.com/" className="text-white text-sm sm:text-base whitespace-nowrap transition-all duration-300 ease-in-out no-underline hover:no-underline">
                XRP Toolkit
              </a>
              <a href="https://xrpl.org/" className="text-white text-sm sm:text-base whitespace-nowrap transition-all duration-300 ease-in-out no-underline hover:no-underline">
                Official XRPL Site
              </a>
            </div>
          </div>
        </div>

        {/* Footer Bottom Section */}
        <div className={`flex flex-col md:flex-row items-center justify-between gap-5 md:gap-0 pt-6 md:pr-14 lg:pr-16 ${isVisible ? 'opacity-100' : 'opacity-0'} transition-opacity duration-700 ease-out delay-300`}>
          <div className="flex flex-col items-center md:items-start gap-2 opacity-0 animate-[fadeInUp_0.6s_ease-out_0.7s_forwards]">
            <p className="text-[#cdcdcd] text-center text-sm md:text-left">
              The Xoloitzquintle Collection © 2024. All Rights Reserved.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 md:justify-start">
              <Link
                to="/faq"
                className="text-[#cdcdcd] text-sm no-underline hover:no-underline hover:text-[#b7e9f7] transition-all duration-300 ease-in-out"
              >
                FAQ
              </Link>
              <Link
                to="/terms-and-conditions"
                className="text-[#cdcdcd] text-sm no-underline hover:no-underline hover:text-[#b7e9f7] transition-all duration-300 ease-in-out"
              >
                Terms &amp; Conditions
              </Link>
              <Link
                to="/privacy-policy"
                className="text-[#cdcdcd] text-sm no-underline hover:no-underline hover:text-[#b7e9f7] transition-all duration-300 ease-in-out"
              >
                Privacy Policy
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-2 opacity-0 animate-[fadeInUp_0.6s_ease-out_0.8s_forwards]">
            <a href="#" className="inline-flex items-center justify-center w-11 h-11 rounded-full border border-[#cfd0d4] text-[#cdcdcd] hover:text-[#b7e9f7] hover:bg-black/40 transition-all duration-300 ease-in-out no-underline hover:no-underline">
              <FontAwesomeIcon icon={faXTwitter} />
            </a>
            <a href="#" className="inline-flex items-center justify-center w-11 h-11 rounded-full border border-[#cfd0d4] text-[#cdcdcd] hover:text-[#b7e9f7] hover:bg-black/40 transition-all duration-300 ease-in-out no-underline hover:no-underline">
              <FontAwesomeIcon icon={faDiscord} />
            </a>
            <a href="#" className="inline-flex items-center justify-center w-11 h-11 rounded-full border border-[#cfd0d4] text-[#cdcdcd] hover:text-[#b7e9f7] hover:bg-black/40 transition-all duration-300 ease-in-out no-underline hover:no-underline">
              <FontAwesomeIcon icon={faReddit} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
