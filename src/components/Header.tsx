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
        className={`back-to-top ${showBackTop ? 'show' : ''}`}
        onClick={handleBackToTop}
      >
        <FontAwesomeIcon icon={faArrowUp} />
      </button>


      <header
        id="header-sticky"
        className={`${isSticky ? 'fixed' : 'absolute'} p-0 top-0 left-0 right-0 z-50 w-full ${isSticky ? 'bg-[rgba(24,24,24,0.8)] backdrop-blur-md border-b border-[#36e9e424]' : ''} border-0 transition-opacity duration-300 ease-out`}
      >
        <div className="transition-all w-full px-4 sm:px-8 md:px-12 lg:px-16 xl:px-24 2xl:px-28">
          <div className="mega-menu-wrapper">
            <div className={`header-main flex items-center justify-between ${isSticky ? 'py-1' : 'py-4'} transition-all duration-100`}>
              <div className="header-left flex items-center gap-4 lg:gap-8">
                <div className="logo">
                  <Link className="header-logo no-underline hover:no-underline" to="/">
                    <img
                      src="/white-logo.png"
                      alt="logo-img"
                      className={`transition-all duration-300 ${isSticky ? 'h-[52px] w-[52px]' : 'h-12 w-12 md:h-24 md:w-24'}`}
                    />
                  </Link>
                </div>
                <div className="mean__menu-wrapper">
                  <Menu
                    isMobileMenuOpen={isMobileMenuOpen}
                    setIsMobileMenuOpen={setIsMobileMenuOpen}
                    isSticky={isSticky}
                  />
                </div>
              </div>
              <div className="header-right flex justify-end items-center gap-4">
                <UserMenu isSticky={isSticky} />
                <Menu
                  variant="mobile-toggle"
                  isMobileMenuOpen={isMobileMenuOpen}
                  setIsMobileMenuOpen={setIsMobileMenuOpen}
                />
              </div>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}

export default Header;
