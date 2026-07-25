import { useState } from 'react';

import { resetCookieConsentClient } from '../lib/consent/cookie-consent';

type Props = {
  className?: string;
  children?: React.ReactNode;
};

/**
 * Clears the consent record (and optional Functional storage) so the first-visit
 * banner shows again. Used on the Cookie Policy page.
 */
export function ResetCookiePreferencesLink({
  className,
  children = 'Reset cookie preferences',
}: Props) {
  const [pending, setPending] = useState(false);
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        setPending(true);
        resetCookieConsentClient();
        try {
          window.location.reload();
        } catch {
          setPending(false);
        }
      }}
      className={
        className ??
        'cursor-pointer border-0 bg-transparent p-0 font-semibold text-cyan-300 underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:opacity-60'
      }
    >
      {children}
    </button>
  );
}
