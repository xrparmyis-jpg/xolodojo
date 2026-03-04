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
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/75 p-4 sm:p-6"
            onClick={() => {
                if (closeOnOverlayClick) {
                    onClose();
                }
            }}
            role="presentation"
        >
            <div
                className={`relative mx-4 w-full rounded-xl border border-white/10 bg-neutral-900 p-6 shadow-xl ${maxWidthClassName}`}
                onClick={(event) => event.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-label={title || 'Modal'}
            >
                {(title || showCloseButton) && (
                    <div className="mb-4 flex items-start justify-between gap-3">
                        {title ? (
                            <h3 className="text-lg font-semibold text-white">{title}</h3>
                        ) : (
                            <span aria-hidden="true" />
                        )}

                        {showCloseButton && (
                            <button
                                type="button"
                                onClick={onClose}
                                className="cursor-pointer inline-flex h-8 w-8 items-center justify-center rounded-md border border-white/20 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white"
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