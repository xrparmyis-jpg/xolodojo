import Button from './Button';
import Modal from './Modal';

interface ConfirmModalProps {
    isOpen: boolean;
    title?: string;
    message?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    loading?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

export default function ConfirmModal({
    isOpen,
    title = 'Are you sure?',
    message = 'Please confirm this action.',
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    loading = false,
    onConfirm,
    onCancel,
}: ConfirmModalProps) {
    return (
        <Modal
            isOpen={isOpen}
            title={title}
            onClose={onCancel}
            closeOnOverlayClick={false}
            showCloseButton={false}
            maxWidthClassName="max-w-sm"
        >
            <p className="mb-4 text-sm text-white/70">
                {message}
            </p>
            <div className="flex justify-end gap-3">
                <Button
                    onClick={onCancel}
                    disabled={loading}
                    className="bg-gray-600 hover:bg-gray-700 active:bg-gray-800 text-sm"
                >
                    {cancelLabel}
                </Button>
                <Button
                    onClick={onConfirm}
                    disabled={loading}
                    className="bg-red-600 hover:bg-red-700 active:bg-red-800 text-sm"
                >
                    {confirmLabel}
                </Button>
            </div>
        </Modal>
    );
}

