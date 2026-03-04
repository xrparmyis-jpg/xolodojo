import { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import PageTitle from '../components/PageTitle';
import Button from '../components/Button';
import { WalletConnection } from '../components/WalletConnection';
import { getUserProfile, updateUserProfile } from '../services/profileService';
import type { UserProfile } from '../services/profileService';

function Profile() {
    const { user, isAuthenticated, isLoading, getAccessTokenSilently } = useAuth0();
    const [dbUser, setDbUser] = useState<UserProfile | null>(null);
    const [bio, setBio] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoadingProfile, setIsLoadingProfile] = useState(true);
    const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        const loadProfile = async () => {
            if (!isAuthenticated || !user || !user.sub) {
                console.log('Profile: Not authenticated or no user', { isAuthenticated, hasUser: !!user, hasSub: !!user?.sub });
                return;
            }

            try {
                setIsLoadingProfile(true);
                setSaveMessage(null); // Clear any previous errors

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
                    setBio(result.user.bio || '');
                    // console.log('Profile: Loaded successfully');
                } else {
                    // User doesn't exist in DB yet - that's okay, they'll be created on sync
                    console.log('Profile: User not found in DB yet, will be created by sync');
                    setBio('');
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
                    setBio('');
                } else {
                    setSaveMessage({
                        type: 'error',
                        text: `Failed to load profile: ${err.message || 'Unknown error'}. Check console for details.`
                    });
                }
            } finally {
                setIsLoadingProfile(false);
            }
        };

        loadProfile();
    }, [isAuthenticated, user, getAccessTokenSilently]);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-[50vh] text-white">
                Loading...
            </div>
        );
    }

    const handleSave = async () => {
        if (!user || !user.sub) return;

        try {
            setIsSaving(true);
            setSaveMessage(null);
            const accessToken = await getAccessTokenSilently().catch(() => undefined);
            const result = await updateUserProfile(user.sub, bio, accessToken);
            setDbUser(result.user);
            setIsEditing(false);
            setSaveMessage({ type: 'success', text: 'Profile saved successfully!' });

            // Clear message after 3 seconds
            setTimeout(() => setSaveMessage(null), 3000);
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            console.error('Failed to save profile:', err);
            setSaveMessage({ type: 'error', text: 'Failed to save profile. Please try again.' });
        } finally {
            setIsSaving(false);
        }
    };

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
        <section className="service-section fix section-padding">
            <div className="container mx-auto px-4 max-w-7xl">
                <div className="flex flex-wrap -mx-4">
                    <div className="w-full px-4">
                        <div className="section-title text-center">
                            <PageTitle title="User Profile" animate={true} />
                            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-white opacity-0 animate-[fadeInUp_0.6s_ease-out_0.1s_forwards]">
                                Welcome back, {user.name || user.email}!
                            </h2>
                        </div>
                    </div>
                </div>

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

                                {/* Test Field: Bio */}
                                <div className="hidden w-full p-6 bg-black/30 rounded-lg mt-4">
                                    {/* <h4 className="text-white text-lg mb-4">
                                        Bio (Test Field)
                                    </h4>

                                    {saveMessage && (
                                        <div className={`mb-4 p-3 rounded-lg ${saveMessage.type === 'success'
                                            ? 'bg-green-900/50 text-green-200'
                                            : 'bg-red-900/50 text-red-200'
                                            }`}>
                                            {saveMessage.text}
                                        </div>
                                    )}

                                    {isEditing ? (
                                        <textarea
                                            value={bio}
                                            onChange={(e) => setBio(e.target.value)}
                                            placeholder="Enter your bio..."
                                            className="w-full p-3 bg-black/40 text-white/90 rounded-lg border border-white/20 focus:border-blue-500 focus:outline-none resize-none"
                                            rows={4}
                                        />
                                    ) : (
                                        <p className="text-white/70 whitespace-pre-wrap mb-4">
                                            {dbUser?.bio || 'No bio set. Click Edit to add one.'}
                                        </p>
                                    )}

                                    {dbUser && (
                                        <div className="mt-4 pt-4 border-t border-white/10 mb-4">
                                            <p className="text-white/50 text-sm">
                                                Last updated: {new Date(dbUser.updated_at).toLocaleString()}
                                            </p>
                                        </div>
                                    )} */}

                                    {/* Buttons below the form */}
                                    {/* <div className="flex justify-end gap-3 mt-4">
                                        {!isEditing ? (
                                            <Button onClick={() => setIsEditing(true)}>
                                                Edit
                                            </Button>
                                        ) : (
                                            <>
                                                <Button
                                                    onClick={() => {
                                                        setIsEditing(false);
                                                        setBio(dbUser?.bio || '');
                                                        setSaveMessage(null);
                                                    }}
                                                    disabled={isSaving}
                                                    className="bg-gray-600 hover:bg-gray-700 active:bg-gray-800"
                                                >
                                                    Cancel
                                                </Button>
                                                <Button
                                                    onClick={handleSave}
                                                    disabled={isSaving}
                                                    className="bg-green-600 hover:bg-green-700 active:bg-green-800"
                                                >
                                                    {isSaving ? 'Saving...' : 'Save'}
                                                </Button>
                                            </>
                                        )}
                                    </div> */}
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
