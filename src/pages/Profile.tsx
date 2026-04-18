import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faXmark } from '@fortawesome/free-solid-svg-icons';

import { useUserContext } from '../providers/UserContext';
import { useAuth } from '../providers/AuthContext';
import { disconnectExternalWallets } from '../utils/disconnectExternalWallets';
import {
    getUserProfile,
    type ProfileSocials,
    type UserProfile,
} from '../services/profileService';
import {
    parseSocialsFromPreferences,
    useSocials,
    getSocialProfileUrl,
    socialPlatformOrder,
    createEmptyVisibleInputs,
    normalizeSocials,
} from '../hooks/useSocials';
import { shouldResumeXamanPkceConnect } from '../utils/oauthCallbackGuards';

import Button from '../components/Button';
import GsapPageContent from '../components/GsapPageContent';
import ModalConfirm from '../components/ModalConfirm';
import { useToast } from '../components/ToastProvider';
import { WalletConnection } from '../components/WalletConnection';


type SocialPlatformKey = keyof ProfileSocials;

function Profile() {
    const { user, loading: authLoading, logout } = useAuth();
    const navigate = useNavigate();
    const { setProfile, setWallets } = useUserContext();
    const [dbUser, setDbUser] = useState<UserProfile | null>(null);
    const [socials, setSocials] = useState<ProfileSocials>({});
    const [visibleSocialInputs, setVisibleSocialInputs] = useState(createEmptyVisibleInputs());
    const [isSavingSocials, setIsSavingSocials] = useState(false);
    const [pendingRemoveSocial, setPendingRemoveSocial] = useState<SocialPlatformKey | null>(null);
    const [showRemoveSocialModal, setShowRemoveSocialModal] = useState(false);
    const [isLoadingProfile, setIsLoadingProfile] = useState(true);
    const [resumeXamanOnMount, setResumeXamanOnMount] = useState(false);
    const { showToast } = useToast();

    const isWalletOnly = Boolean(user && user.authMode === 'wallet');
    const walletSocialsStorageKey =
        isWalletOnly && user?.walletAddress
            ? `xolodojo_wallet_pin_socials_${user.walletAddress.toLowerCase()}`
            : null;

    const syncPinSocialsToWalletSession = useCallback(
        (next: ProfileSocials) => {
            const normalized = normalizeSocials(next);
            setSocials(normalized);
            if (walletSocialsStorageKey) {
                try {
                    sessionStorage.setItem(walletSocialsStorageKey, JSON.stringify(normalized));
                } catch {
                    /* ignore quota / private mode */
                }
            }
            if (user?.id) {
                setProfile({ userId: user.id, socialHandles: { ...normalized } });
            }
        },
        [setProfile, user?.id, walletSocialsStorageKey]
    );

    const socialsHook = useSocials({
        canPersist: Boolean(user?.id),
        persistToProfileApi: !isWalletOnly,
        walletSocialsStorageKey,
        dbUser,
        socials,
        visibleSocialInputs,
        setSocials,
        setVisibleSocialInputs,
        setDbUser,
        showToast: ((type: string, msg: string) => showToast(type as 'success' | 'error', msg)) as (type: string, msg: string) => void,
        setIsSavingSocials,
    });

    useEffect(() => {
        if (authLoading || !user?.id) {
            return;
        }
        if (user.authMode === 'wallet') {
            setIsLoadingProfile(true);
            try {
                const raw = walletSocialsStorageKey
                    ? sessionStorage.getItem(walletSocialsStorageKey)
                    : null;
                if (raw) {
                    const parsed = JSON.parse(raw) as Record<string, string>;
                    setSocials(parseSocialsFromPreferences({ socials: parsed }));
                } else {
                    setSocials({});
                }
            } catch {
                setSocials({});
            }
            setDbUser(null);
            setProfile({ userId: user.id, socialHandles: {} });
            setVisibleSocialInputs(createEmptyVisibleInputs());
            setIsLoadingProfile(false);
            return;
        }

        let cancelled = false;
        const loadProfile = async () => {
            try {
                setIsLoadingProfile(true);
                const result = await getUserProfile();
                if (cancelled) return;
                if (result.success && result.user) {
                    setDbUser(result.user);
                    const loadedSocials = parseSocialsFromPreferences(result.user.preferences);
                    setProfile({ userId: user.id, socialHandles: { ...loadedSocials } });
                    setSocials(parseSocialsFromPreferences(result.user.preferences));
                    setVisibleSocialInputs(createEmptyVisibleInputs());
                } else {
                    setDbUser(null);
                    setProfile({ userId: user.id });
                    setSocials({});
                    setVisibleSocialInputs(createEmptyVisibleInputs());
                }
            } finally {
                if (!cancelled) {
                    setIsLoadingProfile(false);
                }
            }
        };
        void loadProfile();
        return () => {
            cancelled = true;
        };
    }, [authLoading, user, setProfile, walletSocialsStorageKey]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        if (!user || user.authMode === 'wallet') return;

        const { pathname, search } = window.location;
        if (!shouldResumeXamanPkceConnect(pathname, search)) return;

        setResumeXamanOnMount(true);
    }, [user]);

    const handleActivateSocial = (key: SocialPlatformKey) => {
        setVisibleSocialInputs((current) => ({
            ...current,
            [key]: !current[key],
        }));
    };

    const handleSocialInputChange = (key: SocialPlatformKey, value: string) => {
        setSocials((current) => ({
            ...current,
            [key]: value.replace(/^@+/, ''),
        }));
    };

    const handleRequestRemoveSocial = (key: SocialPlatformKey) => {
        setPendingRemoveSocial(key);
        setShowRemoveSocialModal(true);
    };

    const handleConfirmRemoveSocial = async () => {
        await socialsHook.handleConfirmRemoveSocial(pendingRemoveSocial);
        setShowRemoveSocialModal(false);
        setPendingRemoveSocial(null);
    };

    const handleSaveSocials = async () => {
        await socialsHook.handleSaveSocials();
    };

    const activeSocialPlatforms = socialPlatformOrder.filter((platform) =>
        Boolean((socials[platform.key] || '').trim()) || visibleSocialInputs[platform.key]
    );
    const openSocialPlatforms = socialPlatformOrder.filter((platform) => visibleSocialInputs[platform.key]);
    const hasOpenSocialInput = openSocialPlatforms.length > 0;
    const hasEnteredSocialHandle = socialPlatformOrder.some((platform) =>
        Boolean((socials[platform.key] || '').trim())
    );
    const shouldShowSaveSocialsButton = hasOpenSocialInput || hasEnteredSocialHandle;

    if (authLoading) {
        return (
            <div className="flex justify-center items-center min-h-[50vh] text-white">
                Loading...
            </div>
        );
    }

    if (!user) {
        return null;
    }

    if (isLoadingProfile) {
        return (
            <div className="flex justify-center items-center min-h-[50vh] text-white">
                Loading profile...
            </div>
        );
    }

    return (
        <section className="relative pt-16 pb-4 md:pt-30 mb-4">
            <div className="container mx-auto max-w-7xl px-4">
                <div className="-mx-4 flex flex-wrap justify-center">
                    <div className="w-full px-4 lg:w-5/6 xl:w-4/5">
                        <GsapPageContent className="mt-8 rounded-xl bg-white/5 p-8" delay={0.06}>
                            <div className="flex flex-col items-center gap-6">
                                {!isWalletOnly && (
                                    <div className="w-full p-6 bg-black/30 rounded-lg mt-4">
                                        <h4 className="text-white text-lg mb-2">Social Handles</h4>
                                        <p className="text-white/60 text-sm mb-4">
                                            Click an icon to add or modify your handle.
                                        </p>

                                        <div className="flex flex-wrap gap-2 mb-4">
                                            {socialPlatformOrder.map((platform) => {
                                                const isActive = activeSocialPlatforms.some((activePlatform) => activePlatform.key === platform.key);
                                                return (
                                                    <button
                                                        key={platform.key}
                                                        type="button"
                                                        title={isActive ? `Edit ${platform.label}` : `Add ${platform.label}`}
                                                        onClick={() => handleActivateSocial(platform.key)}
                                                        className={`cursor-pointer relative inline-flex h-10 w-10 items-center justify-center rounded-full border transition-all duration-200 ${isActive
                                                            ? 'border-emerald-400/60 bg-emerald-700/20 text-emerald-200'
                                                            : 'border-white/25 bg-white/5 text-white/70 hover:text-white hover:border-white/40'
                                                            }`}
                                                    >
                                                        <FontAwesomeIcon icon={platform.icon} />
                                                        {!isActive && (
                                                            <span className="absolute -right-1 -top-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] text-white">
                                                                <FontAwesomeIcon icon={faPlus} />
                                                            </span>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        {openSocialPlatforms.length > 0 ? (
                                            <div className="space-y-3">
                                                {openSocialPlatforms.map((platform) => {
                                                    const profileUrl = getSocialProfileUrl(platform.key, socials[platform.key]);

                                                    return (
                                                        <div key={platform.key} className="flex items-center gap-2">
                                                            {profileUrl ? (
                                                                <a
                                                                    href={profileUrl}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    title={`Open ${platform.label}`}
                                                                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/5 text-white/80 hover:border-white/40 hover:bg-white/10 hover:text-white transition-all duration-200"
                                                                >
                                                                    <FontAwesomeIcon icon={platform.icon} />
                                                                </a>
                                                            ) : (
                                                                <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/5 text-white/80">
                                                                    <FontAwesomeIcon icon={platform.icon} />
                                                                </div>
                                                            )}
                                                            <div className="w-full md:w-1/3 md:min-w-[280px]">
                                                                <div className="relative">
                                                                    <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-white/45">@</span>
                                                                    <input
                                                                        value={socials[platform.key] || ''}
                                                                        onChange={(e) => handleSocialInputChange(platform.key, e.target.value)}
                                                                        placeholder={`${platform.label} username`}
                                                                        className="w-full rounded-lg border border-white/20 bg-black/40 pl-8 pr-3 py-2 text-white/90 placeholder:text-white/45 focus:outline-none focus:border-blue-500"
                                                                        autoComplete="off"
                                                                    />
                                                                </div>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                title={`Remove ${platform.label}`}
                                                                onClick={() => handleRequestRemoveSocial(platform.key)}
                                                                className="cursor-pointer inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-red-500/40 bg-red-600/15 text-red-300 hover:bg-red-600/30"
                                                            >
                                                                <FontAwesomeIcon icon={faXmark} />
                                                            </button>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : activeSocialPlatforms.length === 0 ? (
                                            <p className="text-white/50 text-sm">No social handles added yet.</p>
                                        ) : null}

                                        {shouldShowSaveSocialsButton && (
                                            <div className="mt-4 flex justify-end">
                                                <Button
                                                    onClick={() => void handleSaveSocials()}
                                                    disabled={isSavingSocials}
                                                    className="bg-green-600 hover:bg-green-700 active:bg-green-800 min-w-[150px]"
                                                >
                                                    {isSavingSocials ? 'Saving...' : 'Save Socials'}
                                                </Button>
                                            </div>
                                        )}

                                        <ModalConfirm
                                            isOpen={showRemoveSocialModal}
                                            title="Remove social handle?"
                                            message="This removes the handle from your profile. You can add it again anytime."
                                            confirmLabel="Remove"
                                            loading={isSavingSocials}
                                            onCancel={() => {
                                                setShowRemoveSocialModal(false);
                                                setPendingRemoveSocial(null);
                                            }}
                                            onConfirm={handleConfirmRemoveSocial}
                                        />
                                    </div>
                                )}

                                {user && (
                                    <WalletConnection
                                        onWalletsUpdated={setWallets}
                                        resumeXamanOnMount={resumeXamanOnMount}
                                        variant={isWalletOnly ? 'wallet_session' : 'profile'}
                                        sessionWalletAddress={
                                            isWalletOnly ? user.walletAddress : undefined
                                        }
                                        sessionWalletType={isWalletOnly ? user.walletType : undefined}
                                        profileSocialsForPins={socials}
                                        syncPinSocialsToProfile={
                                            isWalletOnly ? syncPinSocialsToWalletSession : undefined
                                        }
                                        onWalletSessionDisconnect={async () => {
                                            await disconnectExternalWallets();
                                            await logout();
                                            navigate('/');
                                        }}
                                    />
                                )}
                            </div>
                        </GsapPageContent>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default Profile;
