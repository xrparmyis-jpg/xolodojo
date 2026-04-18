import Modal from './Modal';
import { WalletConnection } from './WalletConnection';

type ConnectWalletAuthModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export default function ConnectWalletAuthModal({
  isOpen,
  onClose,
  onSuccess,
}: ConnectWalletAuthModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      title="Connect wallet"
      onClose={onClose}
      maxWidthClassName="max-w-lg"
    >
      <p className="mb-4 text-sm text-white/70">
        Choose a wallet and complete connection. You will be signed in without a password account.
      </p>
      <WalletConnection
        variant="wallet_auth"
        onWalletAuthSuccess={() => {
          onSuccess();
          onClose();
        }}
      />
    </Modal>
  );
}
