import { useState, useEffect, useCallback, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowsUpDown,
  faBookmark,
  faPlus,
  faChevronLeft,
  faChevronRight,
  faShareNodes,
  faTrash,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';

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
import {
  getSavedGlobePins,
  removeSavedGlobePin,
  type SavedGlobePinItem,
} from '../services/savedGlobePinsService';
import { buildGlobePinShareUrl } from '../utils/globeShareUrl';
import { normalizeNfTokenId } from '../utils/nfTokenId';

type SocialPlatformKey = keyof ProfileSocials;

const SAVED_GLOBE_PINS_PAGE_SIZE = 10;

const savedPinsListVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.045, delayChildren: 0.04 },
  },
  exit: { opacity: 0, transition: { duration: 0.12 } },
} as const;

const savedPinRowVariants = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 380, damping: 28 },
  },
} as const;

function Profile() {
  const { user, loading: authLoading, logout } = useAuth();
  const navigate = useNavigate();
  const { setProfile, setWallets } = useUserContext();
  const [dbUser, setDbUser] = useState<UserProfile | null>(null);
  const [socials, setSocials] = useState<ProfileSocials>({});
  const [visibleSocialInputs, setVisibleSocialInputs] = useState(
    createEmptyVisibleInputs()
  );
  const [isSavingSocials, setIsSavingSocials] = useState(false);
  const [pendingRemoveSocial, setPendingRemoveSocial] =
    useState<SocialPlatformKey | null>(null);
  const [showRemoveSocialModal, setShowRemoveSocialModal] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [resumeXamanOnMount, setResumeXamanOnMount] = useState(false);
  const [savedGlobePins, setSavedGlobePins] = useState<SavedGlobePinItem[]>([]);
  const [savedGlobePinsLoading, setSavedGlobePinsLoading] = useState(false);
  const [savedPinsSort, setSavedPinsSort] = useState<'newest' | 'oldest'>(
    'newest'
  );
  const [savedPinsPage, setSavedPinsPage] = useState(0);
  const { showToast } = useToast();

  const sortedSavedGlobePins = useMemo(() => {
    const list = [...savedGlobePins];
    list.sort((a, b) => {
      const ta = new Date(a.created_at).getTime();
      const tb = new Date(b.created_at).getTime();
      if (Number.isNaN(ta) || Number.isNaN(tb)) {
        return 0;
      }
      return savedPinsSort === 'newest' ? tb - ta : ta - tb;
    });
    return list;
  }, [savedGlobePins, savedPinsSort]);

  const savedPinsTotal = sortedSavedGlobePins.length;
  const savedPinsPageCount =
    savedPinsTotal === 0
      ? 0
      : Math.ceil(savedPinsTotal / SAVED_GLOBE_PINS_PAGE_SIZE);
  const showSavedPinsPagination = savedPinsTotal > SAVED_GLOBE_PINS_PAGE_SIZE;

  const savedPinsPageItems = useMemo(() => {
    const start = savedPinsPage * SAVED_GLOBE_PINS_PAGE_SIZE;
    return sortedSavedGlobePins.slice(
      start,
      start + SAVED_GLOBE_PINS_PAGE_SIZE
    );
  }, [sortedSavedGlobePins, savedPinsPage]);

  useEffect(() => {
    if (savedPinsPageCount === 0) {
      return;
    }
    if (savedPinsPage >= savedPinsPageCount) {
      setSavedPinsPage(Math.max(0, savedPinsPageCount - 1));
    }
  }, [savedPinsPage, savedPinsPageCount]);

  const savedPinsListMotionKey = useMemo(
    () =>
      `${savedPinsSort}-${savedPinsPage}-${savedPinsPageItems.map(p => p.token_id).join(',')}`,
    [savedPinsSort, savedPinsPage, savedPinsPageItems]
  );

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
          sessionStorage.setItem(
            walletSocialsStorageKey,
            JSON.stringify(normalized)
          );
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
    showToast: ((type: string, msg: string) =>
      showToast(type as 'success' | 'error', msg)) as (
      type: string,
      msg: string
    ) => void,
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
          const loadedSocials = parseSocialsFromPreferences(
            result.user.preferences
          );
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

  const loadSavedGlobePins = useCallback(async () => {
    if (!user) {
      setSavedGlobePins([]);
      return;
    }
    setSavedGlobePinsLoading(true);
    try {
      const list = await getSavedGlobePins();
      setSavedGlobePins(list);
    } catch (err) {
      showToast(
        'error',
        err instanceof Error ? err.message : 'Could not load saved globe pins'
      );
      setSavedGlobePins([]);
    } finally {
      setSavedGlobePinsLoading(false);
    }
  }, [user, showToast]);

  useEffect(() => {
    if (!user) {
      setSavedGlobePins([]);
      return;
    }
    void loadSavedGlobePins();
  }, [user, loadSavedGlobePins]);

  const handleRemoveSavedGlobePin = useCallback(
    async (tokenId: string) => {
      try {
        await removeSavedGlobePin(tokenId);
        setSavedGlobePins(current =>
          current.filter(p => p.token_id !== tokenId)
        );
        showToast('success', 'Removed from saved');
      } catch (err) {
        showToast(
          'error',
          err instanceof Error ? err.message : 'Could not remove pin'
        );
      }
    },
    [showToast]
  );

  const handleActivateSocial = (key: SocialPlatformKey) => {
    setVisibleSocialInputs(current => ({
      ...current,
      [key]: !current[key],
    }));
  };

  const handleSocialInputChange = (key: SocialPlatformKey, value: string) => {
    setSocials(current => ({
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

  const activeSocialPlatforms = socialPlatformOrder.filter(
    platform =>
      Boolean((socials[platform.key] || '').trim()) ||
      visibleSocialInputs[platform.key]
  );
  const openSocialPlatforms = socialPlatformOrder.filter(
    platform => visibleSocialInputs[platform.key]
  );
  const hasOpenSocialInput = openSocialPlatforms.length > 0;
  const hasEnteredSocialHandle = socialPlatformOrder.some(platform =>
    Boolean((socials[platform.key] || '').trim())
  );
  const shouldShowSaveSocialsButton =
    hasOpenSocialInput || hasEnteredSocialHandle;

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
            <GsapPageContent
              className="mt-8 rounded-xl bg-white/5 p-8"
              delay={0.06}
            >
              <div className="flex flex-col items-center gap-6">
                {!isWalletOnly && (
                  <div className="w-full p-6 bg-black/30 rounded-lg mt-4">
                    <h4 className="text-white text-lg mb-2">Social Handles</h4>
                    <p className="text-white/60 text-sm mb-4">
                      Click an icon to add or modify your handle.
                    </p>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {socialPlatformOrder.map(platform => {
                        const isActive = activeSocialPlatforms.some(
                          activePlatform => activePlatform.key === platform.key
                        );
                        return (
                          <button
                            key={platform.key}
                            type="button"
                            title={
                              isActive
                                ? `Edit ${platform.label}`
                                : `Add ${platform.label}`
                            }
                            onClick={() => handleActivateSocial(platform.key)}
                            className={`cursor-pointer relative inline-flex h-10 w-10 items-center justify-center rounded-full border transition-all duration-200 ${
                              isActive
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
                        {openSocialPlatforms.map(platform => {
                          const profileUrl = getSocialProfileUrl(
                            platform.key,
                            socials[platform.key]
                          );

                          return (
                            <div
                              key={platform.key}
                              className="flex items-center gap-2"
                            >
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
                                  <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-white/45">
                                    @
                                  </span>
                                  <input
                                    value={socials[platform.key] || ''}
                                    onChange={e =>
                                      handleSocialInputChange(
                                        platform.key,
                                        e.target.value
                                      )
                                    }
                                    placeholder={`${platform.label} username`}
                                    className="w-full rounded-lg border border-white/20 bg-black/40 pl-8 pr-3 py-2 text-white/90 placeholder:text-white/45 focus:outline-none focus:border-blue-500"
                                    autoComplete="off"
                                  />
                                </div>
                              </div>
                              <button
                                type="button"
                                title={`Remove ${platform.label}`}
                                onClick={() =>
                                  handleRequestRemoveSocial(platform.key)
                                }
                                className="cursor-pointer inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-red-500/40 bg-red-600/15 text-red-300 hover:bg-red-600/30"
                              >
                                <FontAwesomeIcon icon={faXmark} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    ) : activeSocialPlatforms.length === 0 ? (
                      <p className="text-white/50 text-sm">
                        No social handles added yet.
                      </p>
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
                    sessionWalletType={
                      isWalletOnly ? user.walletType : undefined
                    }
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

                {user && (
                  <div className="w-full p-6 bg-black/30 rounded-lg mt-4">
                    <div className="mb-1 flex min-w-0 items-center justify-between gap-2 sm:gap-3">
                      <h4 className="text-white text-lg m-0 flex min-w-0 flex-1 items-center gap-2">
                        <FontAwesomeIcon
                          icon={faBookmark}
                          className="shrink-0 text-cyan-300/90"
                        />
                        Bookmarked pins
                      </h4>
                      {!savedGlobePinsLoading && savedGlobePins.length > 0 ? (
                        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                          <span
                            className="text-sm text-white/50 tabular-nums"
                            aria-live="polite"
                          >
                            {savedPinsPage * SAVED_GLOBE_PINS_PAGE_SIZE + 1}–
                            {Math.min(
                              (savedPinsPage + 1) * SAVED_GLOBE_PINS_PAGE_SIZE,
                              savedPinsTotal
                            )}{' '}
                            of {savedPinsTotal}
                          </span>
                          <button
                            type="button"
                            title="Toggle sort order"
                            aria-label={
                              savedPinsSort === 'newest'
                                ? 'Newest saved first. Activate to show oldest first.'
                                : 'Oldest saved first. Activate to show newest first.'
                            }
                            onClick={() => {
                              setSavedPinsSort(s =>
                                s === 'newest' ? 'oldest' : 'newest'
                              );
                              setSavedPinsPage(0);
                            }}
                            className="inline-flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-md border border-white/20 bg-white/5 p-1.5 text-white/80 transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                          >
                            <FontAwesomeIcon
                              icon={faArrowsUpDown}
                              className="h-2.5 w-2.5 text-cyan-200/90"
                              aria-hidden
                            />
                          </button>
                        </div>
                      ) : null}
                    </div>

                    {savedGlobePinsLoading ? (
                      <p className="text-white/50 text-sm">Loading…</p>
                    ) : savedGlobePins.length === 0 ? (
                      <p className="text-white/50 text-sm">
                        No saved pins yet. Bookmark a pin on the globe to see it
                        here.
                      </p>
                    ) : (
                      <>
                        <AnimatePresence mode="wait">
                          <motion.ul
                            key={savedPinsListMotionKey}
                            role="list"
                            className="space-y-2"
                            variants={savedPinsListVariants}
                            initial="hidden"
                            animate="show"
                            exit="exit"
                            layout
                          >
                            {savedPinsPageItems.map(p => {
                              const short =
                                p.token_id.length > 14
                                  ? `${p.token_id.slice(0, 8)}…${p.token_id.slice(-4)}`
                                  : p.token_id;
                              const label =
                                (p.title && p.title.trim()) || `Pin ${short}`;
                              const to = `/xglobe?pin=${encodeURIComponent(normalizeNfTokenId(p.token_id))}`;
                              return (
                                <motion.li
                                  key={p.token_id}
                                  role="listitem"
                                  variants={savedPinRowVariants}
                                  className="flex flex-wrap items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-2 pr-2 sm:flex-nowrap"
                                  layout
                                >
                                  {p.image_url ? (
                                    <img
                                      src={p.image_url}
                                      alt=""
                                      className="h-12 w-12 shrink-0 rounded-md object-cover"
                                    />
                                  ) : (
                                    <div className="h-12 w-12 shrink-0 rounded-md bg-white/10" />
                                  )}
                                  <div className="min-w-0 flex-1">
                                    <Link
                                      to={to}
                                      className="text-white/95 font-medium hover:text-cyan-200 transition-colors"
                                    >
                                      {label}
                                    </Link>
                                    <p className="text-white/40 text-xs font-mono truncate mt-0.5">
                                      {p.token_id}
                                    </p>
                                  </div>
                                  <div className="flex shrink-0 items-center gap-1.5">
                                    <button
                                      type="button"
                                      title="Copy share link"
                                      className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-md border border-white/15 text-white/70 hover:bg-white/10"
                                      onClick={async () => {
                                        try {
                                          await navigator.clipboard.writeText(
                                            buildGlobePinShareUrl(p.token_id)
                                          );
                                          showToast(
                                            'success',
                                            'Link copied to clipboard'
                                          );
                                        } catch {
                                          showToast(
                                            'error',
                                            'Could not copy link'
                                          );
                                        }
                                      }}
                                    >
                                      <FontAwesomeIcon
                                        icon={faShareNodes}
                                        className="h-3.5 w-3.5"
                                      />
                                    </button>
                                    <button
                                      type="button"
                                      title="Remove from saved"
                                      className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-md border border-red-500/30 text-red-300/90 hover:bg-red-950/50"
                                      onClick={() =>
                                        void handleRemoveSavedGlobePin(
                                          p.token_id
                                        )
                                      }
                                    >
                                      <FontAwesomeIcon
                                        icon={faTrash}
                                        className="h-3.5 w-3.5"
                                      />
                                    </button>
                                  </div>
                                </motion.li>
                              );
                            })}
                          </motion.ul>
                        </AnimatePresence>
                        {showSavedPinsPagination ? (
                          <div className="mt-3 flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                setSavedPinsPage(p => Math.max(0, p - 1))
                              }
                              disabled={savedPinsPage <= 0}
                              className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-md border border-white/20 bg-white/5 px-3 text-sm text-white/85 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                              aria-label="Previous page"
                            >
                              <FontAwesomeIcon
                                icon={faChevronLeft}
                                className="h-3.5 w-3.5"
                              />
                              Previous
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setSavedPinsPage(p =>
                                  Math.min(savedPinsPageCount - 1, p + 1)
                                )
                              }
                              disabled={savedPinsPage >= savedPinsPageCount - 1}
                              className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-md border border-white/20 bg-white/5 px-3 text-sm text-white/85 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                              aria-label="Next page"
                            >
                              Next
                              <FontAwesomeIcon
                                icon={faChevronRight}
                                className="h-3.5 w-3.5"
                              />
                            </button>
                          </div>
                        ) : null}
                      </>
                    )}
                  </div>
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
