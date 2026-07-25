import { useEffect, useState } from 'react';

import {
  allowAnalyticsStorage,
  allowFunctionalStorage,
  allowMarketingStorage,
  COOKIE_CONSENT_EVENT,
  getCookieConsentState,
  type CookieConsentCategories,
} from '../lib/consent/cookie-consent';

/**
 * Live consent flags for React trees. Re-renders when the user saves/resets
 * cookie preferences so gated features turn on/off without a full reload.
 */
export function useCookieConsent() {
  const [categories, setCategories] = useState<CookieConsentCategories | null>(
    null,
  );

  useEffect(() => {
    const sync = () => {
      setCategories(getCookieConsentState()?.categories ?? null);
    };
    sync();
    window.addEventListener(COOKIE_CONSENT_EVENT, sync);
    return () => window.removeEventListener(COOKIE_CONSENT_EVENT, sync);
  }, []);

  return {
    categories,
    hasChoice: categories !== null,
    allowFunctional: categories?.functional === true,
    allowAnalytics: categories?.analytics === true,
    allowMarketing: categories?.marketing === true,
    /** Snapshot helpers (same as module exports; useful in callbacks). */
    allowFunctionalStorage,
    allowAnalyticsStorage,
    allowMarketingStorage,
  };
}
