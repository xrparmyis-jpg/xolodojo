import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
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
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<ToastItem[]>([]);

    const removeToast = useCallback((id: number) => {
        setToasts((current) => current.filter((toast) => toast.id !== id));
    }, []);

    const showToast = useCallback(
        (type: ToastType, message: string, durationMs = 3000) => {
            const id = Date.now() + Math.floor(Math.random() * 1000);
            setToasts((current) => [...current, { id, type, message }]);

            window.setTimeout(() => {
                removeToast(id);
            }, durationMs);
        },
        [removeToast]
    );

    const value = useMemo(() => ({ showToast }), [showToast]);

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
