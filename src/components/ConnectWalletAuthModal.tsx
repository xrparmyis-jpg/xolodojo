import { WalletConnection } from './WalletConnection';

type ConnectWalletAuthModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  /** Resume PKCE after Xaman redirected back to `/?xaman_return=1`. */
  resumeXamanOnMount?: boolean;
};

/**
 * Wallet sign-in: mounts {@link WalletConnection} and opens the wallet-type picker
 * immediately (no intermediate “Connect wallet” / “Choose Wallet” modal).
 */
export default function ConnectWalletAuthModal({
  isOpen,
  onClose,
  onSuccess,
  resumeXamanOnMount = false,
}: ConnectWalletAuthModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <WalletConnection
      variant="wallet_auth"
      resumeXamanOnMount={resumeXamanOnMount}
      autoOpenWalletPicker={!resumeXamanOnMount}
      onWalletPickerDismiss={onClose}
      onWalletAuthSuccess={() => {
        onSuccess();
        onClose();
      }}
    />
  );
}
