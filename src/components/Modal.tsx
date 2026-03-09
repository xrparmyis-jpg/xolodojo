import { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';

interface ModalProps {
    isOpen: boolean;
    title?: string;
    children: ReactNode;
    onClose: () => void;
    closeOnOverlayClick?: boolean;
    showCloseButton?: boolean;
    maxWidthClassName?: string;
}

export default function Modal({
    isOpen,
    title,
    children,
    onClose,
    closeOnOverlayClick = true,
    showCloseButton = true,
    maxWidthClassName = 'max-w-lg',
}: ModalProps) {
    if (!isOpen) return null;

    const modal = (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/75 p-2 sm:p-4"
            onClick={() => {
                if (closeOnOverlayClick) {
                    onClose();
                }
            }}
            role="presentation"
        >
            <div
                className={`relative mx-4 w-full max-h-[90vh] overflow-y-auto rounded-xl border border-white/10 bg-neutral-900 p-4 shadow-xl ${maxWidthClassName}`}
                onClick={(event) => event.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-label={title || 'Modal'}
            >
                {(title || showCloseButton) && (
                    <div className="mb-2 flex items-start justify-between gap-3">
                        {title ? (
                            <h3 className="text-lg font-semibold text-white">{title}</h3>
                        ) : (
                            <span aria-hidden="true" />
                        )}

                        {showCloseButton && (
                            <button
                                type="button"
                                onClick={onClose}
                                className="cursor-pointer inline-flex h-8 w-8 items-center justify-center rounded-md bg-red-600/60 text-white/85 hover:bg-red-600/40 hover:text-white"
                                aria-label="Close modal"
                            >
                                <FontAwesomeIcon icon={faXmark} />
                            </button>
                        )}
                    </div>
                )}

                {children}
            </div>
        </div>
    );

    if (typeof document === 'undefined') {
        return modal;
    }

    return createPortal(modal, document.body);
}