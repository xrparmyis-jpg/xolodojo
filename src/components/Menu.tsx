import { useState, useEffect } from 'react';
import { NavLink, useLocation, Link } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faTimes, faUser, faSignOutAlt, faSignInAlt } from '@fortawesome/free-solid-svg-icons';

interface MenuProps {
    onLinkClick?: () => void;
    variant?: 'desktop' | 'mobile-toggle';
    isMobileMenuOpen?: boolean;
    setIsMobileMenuOpen?: React.Dispatch<React.SetStateAction<boolean>>;
    isSticky?: boolean;
}

function Menu({
    onLinkClick,
    variant = 'desktop',
    isMobileMenuOpen: externalIsOpen,
    setIsMobileMenuOpen: externalSetOpen,
    isSticky = false,
}: MenuProps) {
    const [internalIsOpen, setInternalIsOpen] = useState(false);
    const location = useLocation();
    const { isAuthenticated, isLoading, loginWithRedirect, logout } = useAuth0();

    const isMobileMenuOpen =
        externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
    const setIsMobileMenuOpen =
        externalSetOpen !== undefined ? externalSetOpen : setInternalIsOpen;

    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [location.pathname]);

    useEffect(() => {
        if (isMobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isMobileMenuOpen]);

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    const closeMobileMenu = () => {
        setIsMobileMenuOpen(false);
        onLinkClick?.();
    };

    const menuItems = [
        { path: '/xoloitzquintle', label: 'Xoloitzquintle' },
        { path: '/team', label: 'Team' },
        { path: '/vision', label: 'Vision' },
        { path: '/mint', label: 'Mint' },
        { path: '/xologlobe', label: 'Xglobe' },
    ];

    const mobileNavLinkClass = ({ isActive }: { isActive: boolean }) =>
        `flex items-center gap-3 border-b border-white/10 py-3 text-base font-medium capitalize no-underline transition-colors ${isActive ? 'font-semibold text-[#b7e9f7]' : 'text-white hover:text-[#b7e9f7]'}`;

    const desktopNavLinkClass = ({ isActive }: { isActive: boolean }) =>
        `inline-block text-lg font-medium capitalize no-underline transition-all duration-300 ease-in-out ${isSticky ? 'py-1.5' : 'py-5'} ${isActive
            ? 'font-bold text-[#b7e9f7] underline decoration-[#b7e9f7] underline-offset-4'
            : 'text-white hover:text-[#b7e9f7]'
        }`;

    if (variant === 'mobile-toggle') {
        return (
            <div className="md:hidden">
                <button
                    type="button"
                    onClick={toggleMobileMenu}
                    aria-label="Toggle mobile menu"
                    className="cursor-pointer border-0 bg-transparent p-2 text-xl text-white"
                >
                    <FontAwesomeIcon icon={isMobileMenuOpen ? faTimes : faBars} />
                </button>
            </div>
        );
    }

    // Desktop menu variant
    return (
        <>
            <nav
                className={`hidden md:block ${isSticky ? '-mt-1' : ''}`}
                aria-label="Primary"
            >
                <ul className="m-0 flex list-none flex-row gap-6 p-0">
                    {menuItems.map((item) => (
                        <li key={item.path} className="relative list-none">
                            <NavLink to={item.path} end className={desktopNavLinkClass}>
                                {item.label}
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </nav>

            {variant === 'desktop' && (
                <>
                    {isMobileMenuOpen && (
                        <div
                            className="fixed inset-0 z-[9998] bg-black/50 md:hidden"
                            onClick={closeMobileMenu}
                            role="presentation"
                            aria-hidden="true"
                        />
                    )}

                    <div
                        className={`fixed top-0 right-0 z-[9999] h-screen w-[320px] max-w-[85vw] overflow-hidden bg-[#1d1d21] shadow-[-2px_0_10px_rgba(0,0,0,0.3)] transition-transform duration-300 ease-in-out md:hidden ${isMobileMenuOpen ? 'translate-x-0 pointer-events-auto' : 'translate-x-full pointer-events-none'}`}
                    >
                        <div className="flex h-full flex-col overflow-hidden">
                            <div className="flex items-center justify-between border-b border-white/20 px-5 py-5">
                                <NavLink to="/" onClick={closeMobileMenu} className="no-underline hover:no-underline">
                                    <img
                                        src="/white-logo.png"
                                        alt="logo-img"
                                        className="h-8 w-auto"
                                    />
                                </NavLink>
                                <button
                                    type="button"
                                    onClick={closeMobileMenu}
                                    className="cursor-pointer border-0 bg-transparent p-2 text-xl text-white transition-colors hover:text-[#b7e9f7]"
                                    aria-label="Close menu"
                                >
                                    <FontAwesomeIcon icon={faTimes} />
                                </button>
                            </div>

                            <nav className="flex-1 overflow-y-auto p-5" aria-label="Mobile primary">
                                <ul className="m-0 list-none p-0">
                                    {menuItems.map((item) => (
                                        <li key={item.path} className="mb-2">
                                            <NavLink
                                                to={item.path}
                                                end
                                                onClick={closeMobileMenu}
                                                className={mobileNavLinkClass}
                                            >
                                                {item.label}
                                            </NavLink>
                                        </li>
                                    ))}
                                    {!isLoading && (
                                        <>
                                            {isAuthenticated ? (
                                                <>
                                                    <li className="mb-2">
                                                        <Link
                                                            to="/profile"
                                                            onClick={closeMobileMenu}
                                                            className="flex w-full items-center gap-3 border-b border-white/10 py-3 text-left text-base font-medium text-white no-underline transition-colors hover:text-[#b7e9f7]"
                                                        >
                                                            <FontAwesomeIcon icon={faUser} className="h-[18px] w-[18px] shrink-0" />
                                                            <span>Profile</span>
                                                        </Link>
                                                    </li>
                                                    <li className="mb-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                logout({
                                                                    logoutParams: {
                                                                        returnTo: window.location.origin,
                                                                    },
                                                                });
                                                                closeMobileMenu();
                                                            }}
                                                            className="mt-2 flex w-full cursor-pointer items-center gap-3 border-0 border-b border-white/10 bg-transparent py-3 text-left text-base font-medium text-white transition-colors hover:text-[#b7e9f7]"
                                                        >
                                                            <FontAwesomeIcon icon={faSignOutAlt} className="h-[18px] w-[18px] shrink-0" />
                                                            <span>Logout</span>
                                                        </button>
                                                    </li>
                                                </>
                                            ) : (
                                                <li className="mb-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            loginWithRedirect();
                                                            closeMobileMenu();
                                                        }}
                                                        className="mt-2 flex w-full cursor-pointer items-center gap-3 border-0 border-b border-white/10 bg-transparent py-3 text-left text-base font-medium text-white transition-colors hover:text-[#b7e9f7]"
                                                    >
                                                        <FontAwesomeIcon icon={faSignInAlt} className="h-[18px] w-[18px] shrink-0" />
                                                        <span>Login</span>
                                                    </button>
                                                </li>
                                            )}
                                        </>
                                    )}
                                </ul>
                            </nav>
                        </div>
                    </div>
                </>
            )}
        </>
    );
}

export default Menu;
