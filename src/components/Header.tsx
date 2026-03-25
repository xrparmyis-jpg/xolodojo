import { Link } from "react-router-dom";
import { useState, useEffect } from "react";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowUp } from "@fortawesome/free-solid-svg-icons";
import Menu from "./Menu";
import UserMenu from "./UserMenu";

function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSticky, setIsSticky] = useState(false);
  const [showBackTop, setShowBackTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsSticky(window.scrollY > 250);
      setShowBackTop(window.scrollY > 250);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleBackToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <>
      <button
        id="back-top"
        type="button"
        aria-label="Back to top"
        className={`fixed z-[99] inline-flex h-[38px] w-[38px] cursor-pointer items-center justify-center rounded-full border-0 bg-[#b7e9f7] text-sm text-[#151518] shadow-sm transition-all duration-300 ease-in-out hover:bg-[#151518] hover:text-white right-[30px] bottom-[30px] ${showBackTop ? 'pointer-events-auto translate-y-0 opacity-100 visible' : 'pointer-events-none translate-y-5 opacity-0 invisible'}`}
        onClick={handleBackToTop}
      >
        <FontAwesomeIcon icon={faArrowUp} />
      </button>


      <header
        id="header-sticky"
        className={`${isSticky ? 'fixed' : 'absolute'} p-0 top-0 left-0 right-0 z-[1000] w-full ${isSticky ? 'bg-[rgba(24,24,24,0.8)] backdrop-blur-md border-b border-[#36e9e424]' : ''} border-0 transition-opacity duration-300 ease-out`}
      >
        <div className="w-full px-4 sm:px-8 md:px-12 lg:px-16 xl:px-24 2xl:px-28 transition-all">
          <div className="flex items-center justify-between py-4 md:py-1">
            <div className="flex items-center gap-4 lg:gap-8">
              <Link className="no-underline hover:no-underline" to="/">
                <img
                  src="/white-logo.png"
                  alt="logo-img"
                  className={`transition-all duration-300 ${isSticky ? 'h-[52px] w-[52px]' : 'h-12 w-12 md:h-24 md:w-24'}`}
                />
              </Link>
              <Menu
                isMobileMenuOpen={isMobileMenuOpen}
                setIsMobileMenuOpen={setIsMobileMenuOpen}
                isSticky={isSticky}
              />
            </div>
            <div className="flex justify-end items-center gap-4">
              <div className="hidden md:block">
                <UserMenu isSticky={isSticky} />
              </div>
              <Menu
                variant="mobile-toggle"
                isMobileMenuOpen={isMobileMenuOpen}
                setIsMobileMenuOpen={setIsMobileMenuOpen}
              />
            </div>
          </div>
        </div>
      </header>
    </>
  );
}

export default Header;
