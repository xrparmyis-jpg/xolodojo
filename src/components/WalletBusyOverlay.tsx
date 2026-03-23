import { createPortal } from 'react-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';

/**
 * Full-viewport loading/status overlay so wallet operations (connect, disconnect,
 * remove, save, etc.) always appear in the same place — centered on screen — instead
 * of tracking the tall wallet card (which felt “low” / bottom-heavy when scrolled).
 *
 * z-[55]: above normal modals (z-50), below Joey QR (z-60) and toasts (z-[10000]).
 */
export function WalletBusyOverlay({ message }: { message: string | null }) {
	if (message == null || typeof document === 'undefined') {
		return null;
	}

	return createPortal(
		<div
			className="pointer-events-auto fixed inset-0 z-[55] flex items-center justify-center bg-black/50 backdrop-blur-[1px]"
			role="status"
			aria-live="polite"
			aria-busy="true"
		>
			<div className="inline-flex max-w-[min(90vw,24rem)] items-center gap-2 rounded-lg border border-white/20 bg-black/85 px-4 py-3 text-sm text-white shadow-xl">
				<FontAwesomeIcon icon={faSpinner} className="shrink-0 animate-spin" />
				<span className="text-center leading-snug">{message}</span>
			</div>
		</div>,
		document.body
	);
}
