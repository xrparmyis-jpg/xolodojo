import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../providers/AuthContext';
import { useLoginModal } from '../providers/LoginModalContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';
import { disconnectExternalWallets } from '../utils/disconnectExternalWallets';

function truncateWalletAddress(address: string): string {
    const a = address.trim();
    if (a.length <= 14) return a;
    return `${a.slice(0, 6)}...${a.slice(-4)}`;
}

interface UserMenuProps {
    isSticky?: boolean;
}

function UserMenu({ isSticky = false }: UserMenuProps) {
    const { user, loading, logout } = useAuth();
    const navigate = useNavigate();
    const { openConnect } = useLoginModal();

    const desktopAuthLinkClass =
        `cursor-pointer border-0 bg-transparent text-left inline-block text-lg font-medium capitalize no-underline transition-all duration-300 ease-in-out ${isSticky ? 'py-1.5' : 'py-5'} text-white hover:text-[#b7e9f7]`;
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

    const handleLogout = () => {
        void (async () => {
            if (user?.authMode === 'wallet') {
                await disconnectExternalWallets();
                await logout();
                navigate('/');
            } else {
                await logout();
            }
            setIsDropdownOpen(false);
        })();
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

    if (loading) {
        return null;
    }

    if (!user) {
        return (
            <nav className="flex items-center gap-6" aria-label="Account">
                <button type="button" className={desktopAuthLinkClass} onClick={openConnect}>
                    Connect
                </button>
            </nav>
        );
    }

    const isWalletSession = user.authMode === 'wallet';

    return (
        <div ref={dropdownRef} className="relative">
            <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={`cursor-pointer flex items-center justify-center overflow-hidden rounded-full border-2 border-white/30 bg-gradient-to-br from-[#667eea] to-[#764ba2] p-0 font-bold text-white transition-all duration-300 hover:scale-105 hover:border-white/60 ${isSticky ? 'h-10 min-w-10 px-2 text-sm' : 'h-12 min-w-12 px-2 text-sm md:text-base'}`}
                aria-label="User menu"
            >
                {isWalletSession && user.walletAddress ? (
                    <span className="max-w-[7.5rem] truncate font-mono text-xs font-semibold md:text-sm">
                        {truncateWalletAddress(user.walletAddress)}
                    </span>
                ) : user.pictureUrl ? (
                    <img
                        src={user.pictureUrl}
                        alt={user.name || 'User'}
                        className="h-full w-full rounded-full object-cover"
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
                        <span>{isWalletSession ? 'Disconnect' : 'Logout'}</span>
                    </button>
                </div>
            )}
        </div>
    );
}

export default UserMenu;
