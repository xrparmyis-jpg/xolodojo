import { createPortal } from 'react-dom';
import Button from '../Button';

type JoeyWalletQrModalProps = {
	open: boolean;
	connectionUri: string | null;
	deepLink: string | null;
	onCancel: () => void;
};

/**
 * Desktop / fallback: scan QR or open Joey via deeplink button.
 * On mobile with auto-deeplink, this usually never mounts (see useJoeyWalletConnect).
 * Overlay z-[1200] sits above Connect wallet / {@link Modal} (z-[1100]) so the QR stays visible.
 */
export function JoeyWalletQrModal({ open, connectionUri, deepLink, onCancel }: JoeyWalletQrModalProps) {
	if (!open || !connectionUri || typeof document === 'undefined') {
		return null;
	}

	return createPortal(
		<div className="fixed inset-0 z-[1200] flex items-center justify-center overflow-y-auto bg-black/80 p-4 sm:p-6">
			<div className="w-full max-w-sm rounded-xl bg-neutral-900 p-6 shadow-xl border border-white/10">
				<h3 className="text-white text-lg font-semibold mb-2">Scan With Joey Wallet</h3>
				<p className="text-sm text-white/70 mb-4">
					Open Joey Wallet on your phone and scan this QR code to continue.
				</p>

				<div className="mx-auto mb-4 w-fit rounded-lg bg-white p-3">
					<img
						src={`https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(connectionUri)}`}
						alt="Joey Wallet connection QR code"
						className="h-56 w-56"
					/>
				</div>

				<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
					{deepLink ? (
						<a
							href={deepLink}
							className="inline-flex items-center justify-center rounded-md bg-[#F76807] px-4 py-2 text-sm font-medium text-white hover:bg-[#c94e06] active:bg-[#a13d04]"
						>
							Open Joey App
						</a>
					) : (
						<div />
					)}
					<Button
						type="button"
						onClick={() => void onCancel()}
						className="bg-red-600 hover:bg-red-700 active:bg-red-800 text-sm text-white"
					>
						Cancel
					</Button>
				</div>
			</div>
		</div>,
		document.body
	);
}
