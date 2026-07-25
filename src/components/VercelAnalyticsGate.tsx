import { Analytics } from '@vercel/analytics/react';
import { useEffect, useState } from 'react';

import {
  allowAnalyticsStorage,
  COOKIE_CONSENT_EVENT,
} from '../lib/consent/cookie-consent';

export function VercelAnalyticsGate() {
  const [on, setOn] = useState(false);

  useEffect(() => {
    const sync = () => {
      setOn(allowAnalyticsStorage());
    };
    sync();
    window.addEventListener(COOKIE_CONSENT_EVENT, sync);
    return () => window.removeEventListener(COOKIE_CONSENT_EVENT, sync);
  }, []);

  if (!import.meta.env.PROD) return null;
  if (!on) return null;
  return <Analytics />;
}
