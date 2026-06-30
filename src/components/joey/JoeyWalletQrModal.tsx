import Modal from '../Modal';
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
 */
export function JoeyWalletQrModal({ open, connectionUri, deepLink, onCancel }: JoeyWalletQrModalProps) {
	if (!open || !connectionUri) {
		return null;
	}

	return (
		<Modal
			isOpen
			onClose={onCancel}
			title="Scan With Joey Wallet"
			closeOnOverlayClick={false}
			maxWidthClassName="max-w-sm"
		>
			<p className="mb-4 text-sm text-white/70">
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
		</Modal>
	);
}
