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
        { path: '/xologlobe', label: 'XoloGlobe' },
    ];

    if (variant === 'mobile-toggle') {
        return (
            <div className="header__hamburger" style={{ display: 'block' }}>
                <style>{`
                    @media (min-width: 768px) {
                        .header__hamburger {
                            display: none !important;
                        }
                    }
                `}</style>
                <button
                    onClick={toggleMobileMenu}
                    aria-label="Toggle mobile menu"
                    style={{ color: 'var(--white)' }}
                    className='cursor-pointer'
                >
                    <FontAwesomeIcon icon={isMobileMenuOpen ? faTimes : faBars} />
                </button>
            </div>
        );
    }

    // Desktop menu variant
    return (
        <>
            {/* Desktop Menu - Only show on desktop screens */}
            <nav className={`main-menu desktop-menu-wrapper ${isSticky ? '-mt-1' : ''}`}>
                <ul className="flex flex-row gap-6">
                    {menuItems.map((item) => (
                        <li key={item.path}>
                            <NavLink
                                to={item.path}
                                className={({ isActive }) =>
                                    `inline-block text-lg font-medium capitalize transition-all duration-300 ease-in-out no-underline ${isSticky ? 'py-1.5' : 'py-5'} text-white hover:text-[#b7e9f7] ${isActive ? 'font-bold underline' : ''}`
                                }
                            >
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
                            className="mobile-menu-overlay d-md-none"
                            onClick={closeMobileMenu}
                            aria-hidden="true"
                        />
                    )}

                    <div
                        className={`mobile-menu-drawer d-md-none ${isMobileMenuOpen ? 'mobile-menu-open' : ''}`}
                    >
                        <div className="mobile-menu-drawer-inner">
                            <div className="mobile-menu-header">
                                <NavLink to="/" onClick={closeMobileMenu} className="no-underline hover:no-underline">
                                    <img
                                        src="/white-logo.png"
                                        alt="logo-img"
                                        className="mobile-menu-logo"
                                    />
                                </NavLink>
                                <button
                                    onClick={closeMobileMenu}
                                    className="mobile-menu-close-btn"
                                    aria-label="Close menu"
                                >
                                    <FontAwesomeIcon icon={faTimes} />
                                </button>
                            </div>

                            {/* Mobile Menu Items */}
                            <nav className="mobile-menu-nav">
                                <ul>
                                    {menuItems.map((item) => (
                                        <li key={item.path}>
                                            <NavLink
                                                to={item.path}
                                                onClick={closeMobileMenu}
                                                className={({ isActive }) =>
                                                    isActive ? 'active no-underline hover:no-underline' : 'no-underline hover:no-underline'
                                                }
                                            >
                                                {item.label}
                                            </NavLink>
                                        </li>
                                    ))}
                                    {/* Auth Menu Items */}
                                    {!isLoading && (
                                        <>
                                            {isAuthenticated ? (
                                                <>
                                                    <li>
                                                        <Link
                                                            to="/profile"
                                                            onClick={closeMobileMenu}
                                                            className="no-underline hover:no-underline"
                                                        >
                                                            <FontAwesomeIcon icon={faUser} />
                                                            <span>Profile</span>
                                                        </Link>
                                                    </li>
                                                    <li>
                                                        <button
                                                            onClick={() => {
                                                                logout({
                                                                    logoutParams: {
                                                                        returnTo: window.location.origin,
                                                                    },
                                                                });
                                                                closeMobileMenu();
                                                            }}
                                                            className="mobile-menu-logout-btn"
                                                        >
                                                            <FontAwesomeIcon icon={faSignOutAlt} />
                                                            <span>Logout</span>
                                                        </button>
                                                    </li>
                                                </>
                                            ) : (
                                                <li>
                                                    <button
                                                        onClick={() => {
                                                            loginWithRedirect();
                                                            closeMobileMenu();
                                                        }}
                                                        className="mobile-menu-login-btn"
                                                    >
                                                        <FontAwesomeIcon icon={faSignInAlt} />
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
