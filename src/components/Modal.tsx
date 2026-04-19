import { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
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
    /**
     * When true, the dialog panel does not clip vertically (map geocoder dropdown can extend below).
     * Use `overflow-x-hidden` only; scroll long content inside children (e.g. a max-height + overflow-y-auto wrapper).
     */
    allowVerticalOverflow?: boolean;
}

export default function Modal({
    isOpen,
    title,
    children,
    onClose,
    closeOnOverlayClick = true,
    showCloseButton = true,
    maxWidthClassName = 'max-w-lg',
    allowVerticalOverflow = false,
}: ModalProps) {
    const reduceMotion = useReducedMotion();
    const duration = reduceMotion ? 0.08 : 0.22;
    const ease = [0.16, 1, 0.3, 1] as [number, number, number, number];

    // z-[1100]: above sticky Header (z-[1000]) so dialogs are not covered on small viewports.
    const modal = (
        <AnimatePresence>
            {isOpen ? (
                <motion.div
                    key="modal-backdrop"
                    className="fixed inset-0 z-[1100] flex items-center justify-center overflow-y-auto bg-black/75 p-2 sm:p-4"
                    role="presentation"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration, ease: 'easeOut' }}
                    onClick={() => {
                        if (closeOnOverlayClick) {
                            onClose();
                        }
                    }}
                >
                    <motion.div
                        className={`relative mx-4 w-full max-h-[90vh] overflow-x-hidden rounded-xl border border-white/10 bg-neutral-900 p-4 shadow-xl ${allowVerticalOverflow ? 'overflow-y-visible' : 'overflow-y-auto'} ${maxWidthClassName}`}
                        role="dialog"
                        aria-modal="true"
                        aria-label={title || 'Modal'}
                        initial={{
                            opacity: reduceMotion ? 1 : 0,
                            scale: reduceMotion ? 1 : 0.96,
                            y: reduceMotion ? 0 : 16,
                        }}
                        animate={{
                            opacity: 1,
                            scale: 1,
                            y: 0,
                        }}
                        exit={{
                            opacity: reduceMotion ? 1 : 0,
                            scale: reduceMotion ? 1 : 0.96,
                            y: reduceMotion ? 0 : 10,
                        }}
                        transition={{ duration, ease }}
                        onClick={(event) => event.stopPropagation()}
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
                    </motion.div>
                </motion.div>
            ) : null}
        </AnimatePresence>
    );

    if (typeof document === 'undefined') {
        return isOpen ? modal : null;
    }

    return createPortal(modal, document.body);
}
