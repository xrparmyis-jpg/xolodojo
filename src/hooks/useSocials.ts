import type { ProfileSocials, UserProfile } from '../services/profileService';
import { updateUserProfile } from '../services/profileService';

import { faDiscord, faInstagram, faTelegram, faTiktok, faXTwitter } from '@fortawesome/free-brands-svg-icons';

export const socialPlatformOrder: Array<{
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

export type SocialPlatformKey = keyof ProfileSocials;

export const createEmptyVisibleInputs = () => ({
    twitter: false,
    discord: false,
    tiktok: false,
    instagram: false,
    telegram: false,
});

export const parseSocialsFromPreferences = (preferences: unknown): ProfileSocials => {
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
        return socialPlatformOrder.reduce<ProfileSocials>((acc: ProfileSocials, platform: { key: SocialPlatformKey }) => {
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

export const normalizeSocials = (socials: ProfileSocials): ProfileSocials =>
    socialPlatformOrder.reduce<ProfileSocials>((acc: ProfileSocials, platform: { key: SocialPlatformKey }) => {
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

export const getSocialProfileUrl = (platform: SocialPlatformKey, rawHandle?: string): string | undefined => {
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

export function useSocials({
    user,
    dbUser,
    socials,
    visibleSocialInputs,
    setSocials,
    setVisibleSocialInputs,
    setDbUser,
    showToast,
    getAccessTokenSilently,
    setIsSavingSocials,
}: {
    user: any;
    dbUser: UserProfile | null;
    socials: ProfileSocials;
    visibleSocialInputs: Record<SocialPlatformKey, boolean>;
    setSocials: (s: ProfileSocials) => void;
    setVisibleSocialInputs: (v: Record<SocialPlatformKey, boolean>) => void;
    setDbUser: (u: UserProfile) => void;
    showToast: (type: string, msg: string) => void;
    getAccessTokenSilently: () => Promise<string | undefined>;
    setIsSavingSocials: (b: boolean) => void;
}) {
    const handleConfirmRemoveSocial = async (pendingRemoveSocial: SocialPlatformKey | null) => {
        if (!pendingRemoveSocial) return;
        const socialToRemove = pendingRemoveSocial;
        const nextSocials = { ...socials };
        delete nextSocials[socialToRemove];
        const nextVisibleSocialInputs = {
            ...visibleSocialInputs,
            [socialToRemove]: false,
        };
        setSocials(nextSocials);
        setVisibleSocialInputs(nextVisibleSocialInputs);
        if (!user?.sub) return;
        try {
            setIsSavingSocials(true);
            const accessToken = await getAccessTokenSilently().catch(() => undefined);
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
        if (!user?.sub) return;
        try {
            setIsSavingSocials(true);
            const accessToken = await getAccessTokenSilently().catch(() => undefined);
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

    return {
        handleConfirmRemoveSocial,
        handleSaveSocials,
        parseSocialsFromPreferences,
        normalizeSocials,
        getSocialProfileUrl,
    };
}
