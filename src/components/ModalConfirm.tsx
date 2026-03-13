import Button from './Button';
import Modal from './Modal';

interface ModalConfirmProps {
    isOpen: boolean;
    title?: string;
    message?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    loading?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

export default function ModalConfirm({
    isOpen,
    title = 'Are you sure?',
    message = 'Please confirm this action.',
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    loading = false,
    onConfirm,
    onCancel,
}: ModalConfirmProps) {
    return (
        <Modal
            isOpen={isOpen}
            title={title}
            onClose={onCancel}
            closeOnOverlayClick={false}
            showCloseButton={false}
            maxWidthClassName="max-w-sm"
        >
            <p className="mb-4 text-sm text-white/70" style={{ whiteSpace: 'pre-line' }}>
                {message}
            </p>
            <div className="flex justify-end gap-3">
                <Button
                    onClick={onCancel}
                    disabled={loading}
                    className="bg-gray-600 hover:bg-gray-700 active:bg-gray-800 text-sm font-semibold text-white/85 hover:text-white"
                >
                    {cancelLabel}
                </Button>
                <Button
                    onClick={onConfirm}
                    disabled={loading}
                    className="bg-red-600 hover:bg-red-700 active:bg-red-800 text-sm font-semibold text-white/85 hover:text-white"
                >
                    {confirmLabel}
                </Button>
            </div>
        </Modal>
    );
}

