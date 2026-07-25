import { useEffect, useState } from 'react';

import {
  allowMarketingStorage,
  COOKIE_CONSENT_EVENT,
} from '../lib/consent/cookie-consent';

/**
 * Mount point for marketing / advertising scripts.
 * Nothing loads unless Marketing consent is granted.
 *
 * When adding pixels (Meta, Google Ads, etc.), render them only inside this
 * component's `on` branch — never in index.html or an ungated layout.
 */
export function MarketingScriptsGate() {
  const [on, setOn] = useState(false);

  useEffect(() => {
    const sync = () => {
      setOn(allowMarketingStorage());
    };
    sync();
    window.addEventListener(COOKIE_CONSENT_EVENT, sync);
    return () => window.removeEventListener(COOKIE_CONSENT_EVENT, sync);
  }, []);

  if (!on) return null;

  // No marketing scripts today. Example when adding one:
  // return <Script src="..." strategy="afterInteractive" />;
  return null;
}
