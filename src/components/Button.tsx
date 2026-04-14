import { ReactNode } from 'react';

interface ButtonProps {
  title?: string;
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  icon?: ReactNode;
  className?: string;
}

/** Matches `btn-cta-*` presets from `src/index.css` (shared with auth / map pin flow). */
const CTA_PRESET_RE = /\bbtn-cta-/;

export default function Button({
  title = '',
  children,
  onClick,
  disabled = false,
  type = 'button',
  icon,
  className = '',
}: ButtonProps) {
  const usesCtaPreset = CTA_PRESET_RE.test(className);
  const hasCustomBg = className.includes('bg-');

  const baseClasses = usesCtaPreset
    ? 'inline-flex items-center justify-center gap-2 font-medium transition-colors'
    : 'flex cursor-pointer items-center justify-center gap-2 rounded-lg px-6 py-2 font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-60';

  const defaultStyle = !hasCustomBg && !usesCtaPreset ? { backgroundColor: '#573583' } : {};

  const defaultBgClasses =
    !hasCustomBg && !usesCtaPreset
      ? 'hover:bg-[#6d4a9f] active:bg-[#4a2d6b] disabled:cursor-not-allowed disabled:bg-gray-500'
      : '';

  const allClasses = `${baseClasses} ${defaultBgClasses} ${className}`.trim().replace(/\s+/g, ' ');

  return (
    <button
      title={title}
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={allClasses}
      style={defaultStyle}
      onMouseEnter={(e) => {
        if (!hasCustomBg && !usesCtaPreset && !disabled) {
          e.currentTarget.style.backgroundColor = '#6d4a9f';
        }
      }}
      onMouseLeave={(e) => {
        if (!hasCustomBg && !usesCtaPreset && !disabled) {
          e.currentTarget.style.backgroundColor = '#573583';
        }
      }}
      onMouseDown={(e) => {
        if (!hasCustomBg && !usesCtaPreset && !disabled) {
          e.currentTarget.style.backgroundColor = '#4a2d6b';
        }
      }}
      onMouseUp={(e) => {
        if (!hasCustomBg && !usesCtaPreset && !disabled) {
          e.currentTarget.style.backgroundColor = '#573583';
        }
      }}
    >
      {icon && <span className="flex items-center">{icon}</span>}
      <span>{children}</span>
    </button>
  );
}
