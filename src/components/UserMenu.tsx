import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../providers/AuthContext';
import { useLoginModal } from '../providers/LoginModalContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';
import { disconnectExternalWallets } from '../utils/disconnectExternalWallets';
import { accountDisplayLabel, truncateWalletAddress } from '../utils/userDisplayLabel';

interface UserMenuProps {
    isSticky?: boolean;
}

function UserMenu({ isSticky = false }: UserMenuProps) {
    const { user, loading, logout } = useAuth();
    const navigate = useNavigate();
    const { openConnect } = useLoginModal();

    const pillClass = `xologlobe-nav-pill ${isSticky ? 'xologlobe-nav-pill--sticky' : ''}`;
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

    if (loading) {
        return null;
    }

    if (!user) {
        return (
            <nav className="flex items-center gap-6" aria-label="Account">
                <button type="button" className={pillClass} onClick={openConnect}>
                    <span className="xologlobe-nav-pill__label">Get Started</span>
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
                className={pillClass}
                aria-label="User menu"
                aria-expanded={isDropdownOpen}
            >
                {isWalletSession && user.walletAddress ? (
                    <span className="xologlobe-nav-pill__label font-mono text-xs font-semibold md:text-sm">
                        {truncateWalletAddress(user.walletAddress)}
                    </span>
                ) : (
                    <span className="xologlobe-nav-pill__label font-semibold tracking-tight">
                        {accountDisplayLabel(user)}
                    </span>
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
