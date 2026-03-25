import { useState, useRef, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';

interface UserMenuProps {
    isSticky?: boolean;
}

function UserMenu({ isSticky = false }: UserMenuProps) {
    const { isAuthenticated, isLoading, user, loginWithRedirect, logout } = useAuth0();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };

        if (isDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isDropdownOpen]);

    const handleLogin = () => {
        // Store returnTo in sessionStorage for redirect after login
        sessionStorage.setItem('auth0_app_state', JSON.stringify({ returnTo: '/profile' }));
        loginWithRedirect({
            appState: {
                returnTo: '/profile',
            },
        });
    };

    const handleLogout = () => {
        logout({
            logoutParams: {
                returnTo: window.location.origin,
            },
        });
        setIsDropdownOpen(false);
    };

    const getUserInitial = () => {
        if (user?.name) {
            return user.name.charAt(0).toUpperCase();
        }
        if (user?.email) {
            return user.email.charAt(0).toUpperCase();
        }
        return 'U';
    };

    if (isLoading) {
        return null;
    }

    if (!isAuthenticated) {
        return (
            <button
                onClick={handleLogin}
                className="px-4 py-2 rounded-md bg-[#1d1d21] text-white border border-[#cfd0d4] hover:bg-black/40 transition-all duration-200"
            >
                Login
            </button>
        );
    }

    return (
        <div ref={dropdownRef} className="relative">
            <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={`cursor-pointer flex items-center justify-center overflow-hidden rounded-full border-2 border-white/30 bg-gradient-to-br from-[#667eea] to-[#764ba2] p-0 font-bold text-white transition-all duration-300 hover:scale-105 hover:border-white/60 ${isSticky ? 'h-10 w-10 text-sm' : 'h-12 w-12 text-base md:text-xl'}`}
                aria-label="User menu"
            >
                {user?.picture ? (
                    <img
                        src={user.picture}
                        alt={user.name || 'User'}
                        className="w-full h-full rounded-full object-cover"
                    />
                ) : (
                    <span className="text-white font-semibold">{getUserInitial()}</span>
                )}
            </button>

            {isDropdownOpen && (
                <div className="absolute right-0 top-full z-[1000] mt-2 min-w-[200px] overflow-hidden rounded-lg border border-white/10 bg-[#1a1a1a] shadow-[0_4px_12px_rgba(0,0,0,0.3)]">
                    <Link
                        to="/profile"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex w-full items-center gap-3 bg-transparent px-4 py-3 text-left text-sm text-white no-underline transition-colors hover:bg-white/10"
                    >
                        <FontAwesomeIcon icon={faUser} className="h-4 w-4 shrink-0" />
                        <span>Profile</span>
                    </Link>
                    <button
                        type="button"
                        onClick={handleLogout}
                        className="flex w-full cursor-pointer items-center gap-3 border-0 border-t border-white/10 bg-transparent px-4 py-3 text-left text-sm text-white transition-colors hover:bg-white/10"
                    >
                        <FontAwesomeIcon icon={faSignOutAlt} className="h-4 w-4 shrink-0" />
                        <span>Logout</span>
                    </button>
                </div>
            )}
        </div>
    );
}

export default UserMenu;
