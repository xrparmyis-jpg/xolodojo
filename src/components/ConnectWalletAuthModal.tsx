import { WalletConnection } from './WalletConnection';

type ConnectWalletAuthModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

/**
 * Wallet sign-in: mounts {@link WalletConnection} and opens the wallet-type picker
 * immediately (no intermediate “Connect wallet” / “Choose Wallet” modal).
 */
export default function ConnectWalletAuthModal({
  isOpen,
  onClose,
  onSuccess,
}: ConnectWalletAuthModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <WalletConnection
      variant="wallet_auth"
      autoOpenWalletPicker
      onWalletPickerDismiss={onClose}
      onWalletAuthSuccess={() => {
        onSuccess();
        onClose();
      }}
    />
  );
}
