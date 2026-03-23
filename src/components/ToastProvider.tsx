import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faCircleExclamation, faXmark } from '@fortawesome/free-solid-svg-icons';

type ToastType = 'success' | 'error';

interface ToastItem {
    id: number;
    type: ToastType;
    message: string;
}

interface ToastContextValue {
    showToast: (type: ToastType, message: string, durationMs?: number) => void;
    clearToasts: (type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<ToastItem[]>([]);
    const dismissTimeoutRef = useRef<number | null>(null);

    const clearDismissTimeout = useCallback(() => {
        if (dismissTimeoutRef.current != null) {
            window.clearTimeout(dismissTimeoutRef.current);
            dismissTimeoutRef.current = null;
        }
    }, []);

    const removeToast = useCallback((id: number) => {
        setToasts((current) => {
            if (current.some((toast) => toast.id === id)) {
                clearDismissTimeout();
            }
            return current.filter((toast) => toast.id !== id);
        });
    }, [clearDismissTimeout]);

    const clearToasts = useCallback((type?: ToastType) => {
        setToasts((current) => {
            const hasMatchingToasts = type == null
                ? current.length > 0
                : current.some((toast) => toast.type === type);

            if (hasMatchingToasts) {
                clearDismissTimeout();
            }

            if (type == null) {
                return [];
            }

            return current.filter((toast) => toast.type !== type);
        });
    }, [clearDismissTimeout]);

    const showToast = useCallback(
        (type: ToastType, message: string, durationMs?: number) => {
            const id = Date.now() + Math.floor(Math.random() * 1000);
            clearDismissTimeout();
            setToasts([{ id, type, message }]);

            const timeoutMs = typeof durationMs === 'number'
                ? durationMs
                : type === 'success'
                    ? 3000
                    : null;

            if (timeoutMs == null) {
                return;
            }

            dismissTimeoutRef.current = window.setTimeout(() => {
                removeToast(id);
            }, timeoutMs);
        },
        [clearDismissTimeout, removeToast]
    );

    useEffect(() => {
        return () => {
            clearDismissTimeout();
        };
    }, [clearDismissTimeout]);

    const value = useMemo(() => ({ showToast, clearToasts }), [clearToasts, showToast]);

    return (
        <ToastContext.Provider value={value}>
            {children}

            <div className="pointer-events-none fixed right-4 top-4 z-[10000] flex w-[min(92vw,420px)] flex-col gap-2">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`pointer-events-auto flex items-start gap-3 rounded-lg border px-3 py-2 text-sm shadow-lg ${toast.type === 'success'
                            ? 'border-green-500/30 bg-green-950/90 text-green-100'
                            : 'border-red-500/30 bg-red-950/90 text-red-100'
                            }`}
                    >
                        <FontAwesomeIcon
                            icon={toast.type === 'success' ? faCheckCircle : faCircleExclamation}
                            className="mt-0.5"
                        />
                        <p className="flex-1 leading-5">{toast.message}</p>
                        <button
                            type="button"
                            onClick={() => removeToast(toast.id)}
                            className="cursor-pointer inline-flex h-5 w-5 items-center justify-center rounded text-white/80 hover:bg-white/10 hover:text-white"
                            aria-label="Dismiss notification"
                        >
                            <FontAwesomeIcon icon={faXmark} />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within ToastProvider');
    }
    return context;
}
