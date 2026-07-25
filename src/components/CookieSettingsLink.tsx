import { openCookieSettings } from '../lib/consent/cookie-consent';

type Props = {
  className?: string;
  children?: React.ReactNode;
};

/** Opens Manage Preferences without clearing the saved consent choice. */
export function CookieSettingsLink({
  className,
  children = 'Manage cookie preferences',
}: Props) {
  return (
    <button
      type="button"
      onClick={() => openCookieSettings()}
      className={
        className ??
        'cursor-pointer border-0 bg-transparent p-0 font-semibold text-cyan-300 underline-offset-2 hover:underline'
      }
    >
      {children}
    </button>
  );
}
