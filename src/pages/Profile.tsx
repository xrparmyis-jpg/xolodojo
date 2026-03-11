import { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faDiscord,
    faInstagram,
    faTelegram,
    faTiktok,
    faXTwitter,
} from '@fortawesome/free-brands-svg-icons';
import { faPlus, faXmark } from '@fortawesome/free-solid-svg-icons';
import Button from '../components/Button';
import ModalConfirm from '../components/ModalConfirm';
import { useToast } from '../components/ToastProvider';
import { WalletConnection } from '../components/WalletConnection';
import {
    getUserProfile,
    type ProfileSocials,
    type UserProfile,
    updateUserProfile,
} from '../services/profileService';

type SocialPlatformKey = keyof ProfileSocials;

const socialPlatformOrder: Array<{
    key: SocialPlatformKey;
    label: string;
    icon: typeof faXTwitter;
}> = [
        { key: 'twitter', label: 'X (Twitter)', icon: faXTwitter },
        { key: 'discord', label: 'Discord', icon: faDiscord },
        { key: 'tiktok', label: 'TikTok', icon: faTiktok },
        { key: 'instagram', label: 'Instagram', icon: faInstagram },
        { key: 'telegram', label: 'Telegram', icon: faTelegram },
    ];

const createEmptyVisibleInputs = () => ({
    twitter: false,
    discord: false,
    tiktok: false,
    instagram: false,
    telegram: false,
});

const parseSocialsFromPreferences = (preferences: unknown): ProfileSocials => {
    if (!preferences) {
        return {};
    }

    let parsedPreferences: Record<string, unknown> | null = null;

    if (typeof preferences === 'string') {
        try {
            const parsed = JSON.parse(preferences) as unknown;
            parsedPreferences = parsed && typeof parsed === 'object'
                ? (parsed as Record<string, unknown>)
                : null;
        } catch {
            return {};
        }
    } else if (typeof preferences === 'object') {
        parsedPreferences = preferences as Record<string, unknown>;
    }

    if (!parsedPreferences) {
        return {};
    }

    const rawSocials = parsedPreferences.socials;
    if (!rawSocials || typeof rawSocials !== 'object') {
        return {};
    }

    const source = rawSocials as Record<string, unknown>;
    return socialPlatformOrder.reduce<ProfileSocials>((acc, platform) => {
        const value = source[platform.key];
        if (typeof value !== 'string') {
            return acc;
        }

        const normalized = value.trim().replace(/^@+/, '');
        if (normalized) {
            acc[platform.key] = normalized;
        }
        return acc;
    }, {});
};

const normalizeSocials = (socials: ProfileSocials): ProfileSocials =>
    socialPlatformOrder.reduce<ProfileSocials>((acc, platform) => {
        const value = socials[platform.key];
        if (typeof value !== 'string') {
            return acc;
        }

        const normalized = value.trim().replace(/^@+/, '');
        if (normalized) {
            acc[platform.key] = normalized;
        }

        return acc;
    }, {});

const getSocialProfileUrl = (platform: SocialPlatformKey, rawHandle?: string): string | undefined => {
    if (!rawHandle) {
        return undefined;
    }

    const handle = rawHandle.trim().replace(/^@+/, '');
    if (!handle) {
        return undefined;
    }

    const encodedHandle = encodeURIComponent(handle);

    switch (platform) {
        case 'twitter':
            return `https://x.com/${encodedHandle}`;
        case 'discord':
            return `https://discord.com/users/${encodedHandle}`;
        case 'tiktok':
            return `https://tiktok.com/@${encodedHandle}`;
        case 'instagram':
            return `https://instagram.com/${encodedHandle}`;
        case 'telegram':
            return `https://t.me/${encodedHandle}`;
        default:
            return undefined;
    }
};

function Profile() {
    const { user, isAuthenticated, isLoading, getAccessTokenSilently } = useAuth0();
    const [dbUser, setDbUser] = useState<UserProfile | null>(null);
    const [socials, setSocials] = useState<ProfileSocials>({});
    const [visibleSocialInputs, setVisibleSocialInputs] = useState(createEmptyVisibleInputs());
    const [isSavingSocials, setIsSavingSocials] = useState(false);
    const [pendingRemoveSocial, setPendingRemoveSocial] = useState<SocialPlatformKey | null>(null);
    const [showRemoveSocialModal, setShowRemoveSocialModal] = useState(false);
    const [isLoadingProfile, setIsLoadingProfile] = useState(true);
    const { showToast } = useToast();

    useEffect(() => {
        const loadProfile = async () => {
            if (!isAuthenticated || !user || !user.sub) {
                console.log('Profile: Not authenticated or no user', { isAuthenticated, hasUser: !!user, hasSub: !!user?.sub });
                return;
            }

            try {
                setIsLoadingProfile(true);

                //console.log('Profile: Starting to load profile for user:', user.sub);
                const accessToken = await getAccessTokenSilently().catch((err) => {
                    console.warn('Profile: Could not get access token:', err);
                    return undefined;
                });

                // console.log('Profile: Calling getUserProfile API...');
                const result = await getUserProfile(user.sub, accessToken);
                console.log('Profile: API response:', result);

                if (result.success && result.user) {
                    setDbUser(result.user);
                    const loadedSocials = parseSocialsFromPreferences(result.user.preferences);
                    setSocials(loadedSocials);
                    setVisibleSocialInputs(createEmptyVisibleInputs());
                } else {
                    // User doesn't exist in DB yet - that's okay, they'll be created on sync
                    console.log('Profile: User not found in DB yet, will be created by sync');
                    setDbUser(null);
                    setSocials({});
                    setVisibleSocialInputs(createEmptyVisibleInputs());
                }
            } catch (error) {
                const err = error instanceof Error ? error : new Error(String(error));
                console.error('Profile: Failed to load profile:', err);
                console.error('Profile: Error details:', {
                    message: err.message,
                    stack: err.stack,
                    response: undefined
                });

                // Don't show error if it's just that user doesn't exist yet
                if (err.message?.includes('404') || err.message?.includes('not found')) {
                    // User not in database yet - will be created by useUserSync
                    console.log('Profile: User not found (404) - will be created by sync');
                    setDbUser(null);
                    setSocials({});
                    setVisibleSocialInputs(createEmptyVisibleInputs());
                }
            } finally {
                setIsLoadingProfile(false);
            }
        };

        loadProfile();
    }, [isAuthenticated, user, getAccessTokenSilently]);

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
        if (!pendingRemoveSocial) {
            return;
        }

        const socialToRemove = pendingRemoveSocial;
        const nextSocials = { ...socials };
        delete nextSocials[socialToRemove];

        const nextVisibleSocialInputs = {
            ...visibleSocialInputs,
            [socialToRemove]: false,
        };

        setShowRemoveSocialModal(false);
        setPendingRemoveSocial(null);

        setSocials(nextSocials);
        setVisibleSocialInputs(nextVisibleSocialInputs);

        if (!user?.sub) {
            return;
        }

        try {
            setIsSavingSocials(true);

            const accessToken = await getAccessTokenSilently().catch((err) => {
                console.warn('Profile: Could not get access token for social remove:', err);
                return undefined;
            });

            const normalizedSocials = normalizeSocials(nextSocials);
            const result = await updateUserProfile(
                user.sub,
                {
                    bio: dbUser?.bio || '',
                    socials: normalizedSocials,
                },
                accessToken
            );

            if (!result.success || !result.user) {
                throw new Error('Failed to remove social handle');
            }

            setDbUser(result.user);
            setSocials(normalizedSocials);
            setVisibleSocialInputs(nextVisibleSocialInputs);
            showToast('success', 'Social handle removed.');
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            showToast('error', `Failed to remove social handle: ${err.message}`);
        } finally {
            setIsSavingSocials(false);
        }
    };

    const handleSaveSocials = async () => {
        if (!user?.sub) {
            return;
        }

        try {
            setIsSavingSocials(true);

            const accessToken = await getAccessTokenSilently().catch((err) => {
                console.warn('Profile: Could not get access token for social save:', err);
                return undefined;
            });

            const normalizedSocials = normalizeSocials(socials);
            const result = await updateUserProfile(
                user.sub,
                {
                    bio: dbUser?.bio || '',
                    socials: normalizedSocials,
                },
                accessToken
            );

            if (!result.success || !result.user) {
                throw new Error('Failed to save social handles');
            }

            setDbUser(result.user);
            setSocials(normalizedSocials);
            setVisibleSocialInputs(createEmptyVisibleInputs());
            showToast('success', 'Social handles saved.');
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            showToast('error', `Failed to save social handles: ${err.message}`);
        } finally {
            setIsSavingSocials(false);
        }
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

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-[50vh] text-white">
                Loading...
            </div>
        );
    }

    if (!isAuthenticated || !user) {
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
        <section className="fix pt-16 pb-4 md:pt-30 mb-4">
            <div className="container mx-auto px-4 max-w-7xl">
                <div className="flex flex-wrap -mx-4 justify-center">
                    <div className="w-full lg:w-5/6 xl:w-4/5 px-4">
                        <div className="bg-white/5 rounded-xl p-8 mt-8 opacity-0 animate-[fadeInUp_0.6s_ease-out_0.2s_forwards]">
                            <div className="flex flex-col items-center gap-6">
                                {user.picture && (
                                    <img
                                        src={user.picture}
                                        alt={user.name || 'User'}
                                        className="w-30 h-30 rounded-full border-4 border-white/20"
                                    />
                                )}

                                <div className="text-center text-white">
                                    <h3 className="mb-2 text-white">
                                        {user.name || 'User'}
                                    </h3>
                                    {/* {user.email && (
                                        <p className="text-white/70 mb-4">
                                            {user.email}
                                        </p>
                                    )} */}
                                </div>

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

                                {/* Wallet Connection Section */}
                                {user && user.sub && (
                                    <WalletConnection
                                        auth0Id={user.sub}
                                        accessToken={undefined}
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default Profile;
