import { useEffect, useId, useState } from 'react';
import { Link } from 'react-router-dom';

import {
  acceptAllCookies,
  COOKIE_CONSENT_EVENT,
  getCookieConsentState,
  hasCookieConsentChoice,
  OPEN_COOKIE_SETTINGS_EVENT,
  OPTIONAL_CATEGORY_META,
  type OptionalCookieCategory,
  rejectNonEssentialCookies,
  setCookieConsentCategories,
} from '../lib/consent/cookie-consent';

type DraftCategories = Record<OptionalCookieCategory, boolean>;

const DEFAULT_DRAFT: DraftCategories = {
  functional: true,
  analytics: true,
  marketing: true,
};

function loadDraft(): DraftCategories {
  const state = getCookieConsentState();
  if (!state) return { ...DEFAULT_DRAFT };
  return {
    functional: state.categories.functional,
    analytics: state.categories.analytics,
    marketing: state.categories.marketing,
  };
}

function CategoryToggle({
  id,
  label,
  description,
  checked,
  disabled,
  onChange,
}: {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange?: (next: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-white/10 py-3 last:border-b-0">
      <div className="min-w-0 flex-1">
        <label htmlFor={id} className="block text-sm font-medium text-white">
          {label}
          {disabled ? (
            <span className="ml-2 text-xs font-normal text-gray-500">
              Always on
            </span>
          ) : null}
        </label>
        <p className="mt-1 text-xs leading-relaxed text-gray-400">
          {description}
        </p>
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange?.(!checked)}
        className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#151518] disabled:cursor-not-allowed ${
          checked ? 'bg-cyan-500' : 'bg-white/20'
        } ${disabled ? 'opacity-70' : 'cursor-pointer'}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}

export function CookieConsentBanner() {
  const baseId = useId();
  const [needsFirstChoice, setNeedsFirstChoice] = useState(false);
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [draft, setDraft] = useState<DraftCategories>(DEFAULT_DRAFT);

  useEffect(() => {
    const sync = () => {
      setNeedsFirstChoice(!hasCookieConsentChoice());
    };
    sync();
    window.addEventListener(COOKIE_CONSENT_EVENT, sync);
    return () => window.removeEventListener(COOKIE_CONSENT_EVENT, sync);
  }, []);

  useEffect(() => {
    const openSettings = () => {
      setDraft(loadDraft());
      setPreferencesOpen(true);
    };
    window.addEventListener(OPEN_COOKIE_SETTINGS_EVENT, openSettings);
    return () =>
      window.removeEventListener(OPEN_COOKIE_SETTINGS_EVENT, openSettings);
  }, []);

  useEffect(() => {
    if (!preferencesOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPreferencesOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [preferencesOpen]);

  const showBar = needsFirstChoice || preferencesOpen;
  if (!showBar) return null;

  const openManage = () => {
    setDraft(loadDraft());
    setPreferencesOpen(true);
  };

  const savePreferences = () => {
    setCookieConsentCategories(draft);
    setPreferencesOpen(false);
    setNeedsFirstChoice(false);
  };

  return (
    <>
      {preferencesOpen ? (
        <div
          className="fixed inset-0 z-[99] bg-black/55 backdrop-blur-[2px]"
          aria-hidden="true"
          onClick={() => setPreferencesOpen(false)}
        />
      ) : null}

      <div
        className="fixed inset-x-0 bottom-0 z-[100] border-t border-cyan-500/25 bg-[#151518]/95 px-4 py-4 shadow-[0_-8px_32px_rgba(0,0,0,0.45)] backdrop-blur-md supports-[padding-bottom:env(safe-area-inset-bottom)]:pb-[max(1rem,env(safe-area-inset-bottom))]"
        role="dialog"
        aria-modal={preferencesOpen || undefined}
        aria-labelledby="cookie-consent-title"
        aria-describedby="cookie-consent-desc"
      >
        <div className="mx-auto max-w-7xl">
          {preferencesOpen ? (
            <div className="mb-4 max-h-[min(50vh,22rem)] overflow-y-auto rounded-lg border border-white/10 bg-[#1a1a1e]/90 px-4 py-2">
              <CategoryToggle
                id={`${baseId}-necessary`}
                label="Strictly Necessary"
                description="Required for the Site to work — sessions when you sign in or connect a wallet, security, and remembering this consent choice. Cannot be turned off."
                checked
                disabled
              />
              {(
                Object.keys(OPTIONAL_CATEGORY_META) as OptionalCookieCategory[]
              ).map((key) => (
                <CategoryToggle
                  key={key}
                  id={`${baseId}-${key}`}
                  label={OPTIONAL_CATEGORY_META[key].label}
                  description={OPTIONAL_CATEGORY_META[key].description}
                  checked={draft[key]}
                  onChange={(next) =>
                    setDraft((prev) => ({ ...prev, [key]: next }))
                  }
                />
              ))}
            </div>
          ) : null}

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0 flex-1 text-sm leading-relaxed text-gray-400">
              <p id="cookie-consent-title" className="font-medium text-white">
                {preferencesOpen
                  ? 'Manage cookie preferences'
                  : 'Cookies & optional storage'}
              </p>
              <p id="cookie-consent-desc" className="mt-1">
                {preferencesOpen ? (
                  <>
                    Choose which optional categories you allow. Strictly
                    necessary cookies stay on. See our{' '}
                    <Link
                      to="/cookie-policy"
                      className="font-medium text-cyan-300 underline-offset-2 hover:text-[#b7e9f7] hover:underline"
                    >
                      Cookie Policy
                    </Link>
                    .
                  </>
                ) : (
                  <>
                    We use essential technology to run the site (e.g. sessions
                    when you sign in or connect a wallet). You can accept all
                    optional categories, reject non-essential ones, or customize
                    by category. See our{' '}
                    <Link
                      to="/cookie-policy"
                      className="font-medium text-cyan-300 underline-offset-2 hover:text-[#b7e9f7] hover:underline"
                    >
                      Cookie Policy
                    </Link>
                    .
                  </>
                )}
              </p>
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-2 md:justify-end">
              {preferencesOpen ? (
                <>
                  <button
                    type="button"
                    className="inline-flex h-9 cursor-pointer items-center justify-center rounded-lg border border-white/20 bg-transparent px-4 text-sm font-semibold text-white/85 transition-colors hover:bg-white/10"
                    onClick={() => setPreferencesOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="inline-flex h-9 cursor-pointer items-center justify-center rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 px-4 text-sm font-semibold text-white/90 transition-all duration-300 hover:from-cyan-400 hover:to-blue-400"
                    onClick={savePreferences}
                  >
                    Save preferences
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    className="inline-flex h-9 cursor-pointer items-center justify-center rounded-lg border border-white/20 bg-transparent px-4 text-sm font-semibold text-white/85 transition-colors hover:bg-white/10"
                    onClick={() => {
                      rejectNonEssentialCookies();
                      setNeedsFirstChoice(false);
                    }}
                  >
                    Reject non-essential
                  </button>
                  <button
                    type="button"
                    className="inline-flex h-9 cursor-pointer items-center justify-center rounded-lg border border-cyan-500/40 bg-transparent px-4 text-sm font-semibold text-cyan-200 transition-colors hover:bg-cyan-500/10"
                    onClick={openManage}
                  >
                    Manage preferences
                  </button>
                  <button
                    type="button"
                    className="inline-flex h-9 cursor-pointer items-center justify-center rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 px-4 text-sm font-semibold text-white/90 transition-all duration-300 hover:from-cyan-400 hover:to-blue-400"
                    onClick={() => {
                      acceptAllCookies();
                      setNeedsFirstChoice(false);
                    }}
                  >
                    Accept all
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
