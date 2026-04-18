import Modal from './Modal';

type ConnectChoiceModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onChooseLogin: () => void;
  onChooseConnectWallet: () => void;
};

export default function ConnectChoiceModal({
  isOpen,
  onClose,
  onChooseLogin,
  onChooseConnectWallet,
}: ConnectChoiceModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      title="Connect"
      onClose={onClose}
      maxWidthClassName="max-w-sm"
    >
      <p className="mb-4 text-sm text-white/70">
        Choose how you want to continue.
      </p>
      <div className="flex flex-col gap-3">
        <button
          type="button"
          className="btn-cta-primary btn-cta-primary--block"
          onClick={onChooseLogin}
        >
          XoloDojo Account
        </button>
        <button
          type="button"
          className="btn-cta-primary btn-cta-primary--block"
          onClick={onChooseConnectWallet}
        >
          Connect Wallet
        </button>
      </div>
    </Modal>
  );
}
