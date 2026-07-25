/**
 * Granular cookie / localStorage consent (GDPR-style categories).
 *
 * Consent is stored as JSON with policy version + timestamp. Bumping
 * COOKIE_CONSENT_POLICY_VERSION re-prompts every user after material changes.
 * Legacy keys are cleared on read so old binary accept/decline values do not
 * silently map to incomplete category consent.
 *
 * Enforcement map (keep in sync with Cookie Policy):
 * - necessary — consent record; wallet connect intents (session); OAuth/JWT
 *   needed to complete sign-in. Always allowed.
 * - functional — optional UI/preference persistence (e.g. wallet-only pin
 *   social handles in sessionStorage). Gated via functional-storage helpers.
 * - analytics — Vercel Analytics mounts only when allowed (VercelAnalyticsGate).
 * - marketing — third-party ad/retargeting scripts mount only when allowed
 *   (MarketingScriptsGate). None ship today; the gate is the enforcement point.
 */

export const COOKIE_CONSENT_POLICY_VERSION = 2;
export const COOKIE_CONSENT_STORAGE_KEY = 'xolodojo.consent.cookies.v2';
const LEGACY_COOKIE_CONSENT_STORAGE_KEYS = [
  'xolodojo.consent.cookies.v1',
] as const;

export const COOKIE_CONSENT_EVENT = 'xolodojo-cookie-consent';
/** Open the Manage Preferences UI (banner panel or revisit from Cookie Policy). */
export const OPEN_COOKIE_SETTINGS_EVENT = 'xolodojo-open-cookie-settings';

export type OptionalCookieCategory = 'functional' | 'analytics' | 'marketing';

export type CookieConsentCategories = {
  /** Always enabled — session, security, consent record. Not user-toggleable. */
  necessary: true;
  /** UI prefs, non-essential wallet/display choices, similar. */
  functional: boolean;
  /** Privacy-friendly analytics (e.g. Vercel Analytics). */
  analytics: boolean;
  /** Advertising / retargeting pixels if introduced later. */
  marketing: boolean;
};

export type CookieConsentState = {
  version: number;
  timestamp: string;
  categories: CookieConsentCategories;
};

/**
 * sessionStorage / localStorage key prefixes that belong to Functional.
 * Cleared when Functional is declined or consent is reset.
 */
export const FUNCTIONAL_STORAGE_KEY_PREFIXES = [
  'xolodojo_wallet_pin_socials_',
] as const;

export const OPTIONAL_CATEGORY_META: Record<
  OptionalCookieCategory,
  { label: string; description: string }
> = {
  functional: {
    label: 'Functional / Preferences',
    description:
      'Remembers optional settings in this browser — for example social handles you enter for globe pinning when using wallet-only mode — so they survive page reloads.',
  },
  analytics: {
    label: 'Analytics',
    description:
      'Loads privacy-friendly analytics (Vercel Analytics) only after you opt in. Helps us understand aggregate traffic. Not used for advertising.',
  },
  marketing: {
    label: 'Marketing / Advertising',
    description:
      'Loads retargeting pixels or ad attribution scripts only after you opt in. We do not currently ship any; when we do, they will not run without this category.',
  },
};

function removeLegacyCookieConsentKeys() {
  for (const k of LEGACY_COOKIE_CONSENT_STORAGE_KEYS) {
    try {
      localStorage.removeItem(k);
    } catch {
      /* ignore */
    }
  }
}

function emitConsentChange() {
  try {
    window.dispatchEvent(new Event(COOKIE_CONSENT_EVENT));
  } catch {
    /* ignore */
  }
}

function parseConsentState(raw: string | null): CookieConsentState | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<CookieConsentState>;
    if (
      typeof parsed.version !== 'number' ||
      parsed.version !== COOKIE_CONSENT_POLICY_VERSION ||
      typeof parsed.timestamp !== 'string' ||
      !parsed.categories ||
      typeof parsed.categories.functional !== 'boolean' ||
      typeof parsed.categories.analytics !== 'boolean' ||
      typeof parsed.categories.marketing !== 'boolean'
    ) {
      return null;
    }
    return {
      version: COOKIE_CONSENT_POLICY_VERSION,
      timestamp: parsed.timestamp,
      categories: {
        necessary: true,
        functional: parsed.categories.functional,
        analytics: parsed.categories.analytics,
        marketing: parsed.categories.marketing,
      },
    };
  } catch {
    return null;
  }
}

export function getCookieConsentState(): CookieConsentState | null {
  if (typeof window === 'undefined') return null;
  try {
    const state = parseConsentState(
      localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY),
    );
    removeLegacyCookieConsentKeys();
    return state;
  } catch {
    return null;
  }
}

/** True once the user has saved a choice under the current policy version. */
export function hasCookieConsentChoice(): boolean {
  return getCookieConsentState() !== null;
}

function writeConsentState(categories: Omit<CookieConsentCategories, 'necessary'>) {
  if (typeof window === 'undefined') return;
  const state: CookieConsentState = {
    version: COOKIE_CONSENT_POLICY_VERSION,
    timestamp: new Date().toISOString(),
    categories: {
      necessary: true,
      functional: categories.functional,
      analytics: categories.analytics,
      marketing: categories.marketing,
    },
  };
  try {
    localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, JSON.stringify(state));
    removeLegacyCookieConsentKeys();
  } catch {
    /* private mode / quota */
  }
  clearNonEssentialPreferenceStorage(categories);
  emitConsentChange();
}

export function setCookieConsentCategories(
  categories: Pick<CookieConsentCategories, OptionalCookieCategory>,
) {
  writeConsentState(categories);
}

export function acceptAllCookies() {
  writeConsentState({
    functional: true,
    analytics: true,
    marketing: true,
  });
}

export function rejectNonEssentialCookies() {
  writeConsentState({
    functional: false,
    analytics: false,
    marketing: false,
  });
}

/**
 * Clear stored consent so the first-visit banner returns.
 * Also clears optional Functional storage. Prefer openCookieSettings() when
 * the user only wants to change categories without a full reset.
 */
export function resetCookieConsentClient() {
  if (typeof window === 'undefined') return;
  clearNonEssentialPreferenceStorage({
    functional: false,
    analytics: false,
    marketing: false,
  });
  try {
    localStorage.removeItem(COOKIE_CONSENT_STORAGE_KEY);
    removeLegacyCookieConsentKeys();
  } catch {
    /* ignore */
  }
  emitConsentChange();
}

export function openCookieSettings() {
  if (typeof window === 'undefined') return;
  try {
    window.dispatchEvent(new Event(OPEN_COOKIE_SETTINGS_EVENT));
  } catch {
    /* ignore */
  }
}

export function allowFunctionalStorage(): boolean {
  return getCookieConsentState()?.categories.functional === true;
}

export function allowAnalyticsStorage(): boolean {
  return getCookieConsentState()?.categories.analytics === true;
}

export function allowMarketingStorage(): boolean {
  return getCookieConsentState()?.categories.marketing === true;
}

function removeMatchingStorageKeys(
  storage: Storage,
  prefixes: readonly string[],
) {
  const toRemove: string[] = [];
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i);
    if (key && prefixes.some((p) => key.startsWith(p))) {
      toRemove.push(key);
    }
  }
  for (const key of toRemove) {
    storage.removeItem(key);
  }
}

/**
 * Remove optional Functional preference keys when that category is off.
 * Analytics/marketing are enforced by not mounting their scripts (no first-party
 * keys to clear for those today).
 */
export function clearNonEssentialPreferenceStorage(
  categories?: Pick<CookieConsentCategories, OptionalCookieCategory>,
) {
  if (typeof window === 'undefined') return;
  const cats =
    categories ??
    getCookieConsentState()?.categories ?? {
      functional: false,
      analytics: false,
      marketing: false,
    };

  if (!cats.functional) {
    try {
      removeMatchingStorageKeys(
        sessionStorage,
        FUNCTIONAL_STORAGE_KEY_PREFIXES,
      );
      removeMatchingStorageKeys(
        localStorage,
        FUNCTIONAL_STORAGE_KEY_PREFIXES,
      );
    } catch {
      /* ignore */
    }
  }
}
