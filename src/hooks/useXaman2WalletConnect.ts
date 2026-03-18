import { useState, useCallback } from 'react';
import { Xumm } from 'xumm';

export function useXaman2WalletConnect({ showToast }: { showToast: (type: 'success' | 'error', message: string, durationMs?: number) => void }) {
    const [isXaman2ConnectPending, setIsXaman2ConnectPending] = useState(false);
    const [showXaman2QrModal, setShowXaman2QrModal] = useState(false);
    const [xaman2ConnectUri, setXaman2ConnectUri] = useState<string | null>(null);
    const [xaman2DeepLink, setXaman2DeepLink] = useState<string | null>(null);
    const [payloadUuid, setPayloadUuid] = useState<string | null>(null);

    const connect = useCallback(async () => {
        setIsXaman2ConnectPending(true);
        try {
            const apiKey = import.meta.env.VITE_XAMAN_API_KEY || import.meta.env.VITE_XUMM_API_KEY;
            if (!apiKey) throw new Error('Xaman API key not set');
            const xumm = new Xumm(apiKey);
            // Create a sign-in payload (minimal tx for login)
            const payload = {
                txjson: {
                    TransactionType: 'SignIn',
                },
            };
            const result = await xumm.payload?.create(payload);
            if (!result) throw new Error('Failed to create Xaman payload');
            setPayloadUuid(result.uuid);
            setXaman2ConnectUri(result.refs.qr_png);
            setXaman2DeepLink(result.next.always);
            setShowXaman2QrModal(true);
        } catch (err: any) {
            showToast('error', `Failed to generate Xaman2 QR: ${err.message}`);
            setShowXaman2QrModal(false);
            setXaman2ConnectUri(null);
            setXaman2DeepLink(null);
        } finally {
            setIsXaman2ConnectPending(false);
        }
    }, [showToast]);

    const cancel = useCallback(() => {
        setShowXaman2QrModal(false);
        setXaman2ConnectUri(null);
        setXaman2DeepLink(null);
        setPayloadUuid(null);
        setIsXaman2ConnectPending(false);
    }, []);

    return {
        isXaman2ConnectPending,
        showXaman2QrModal,
        xaman2ConnectUri,
        xaman2DeepLink,
        connect,
        cancel,
        payloadUuid,
    };
}
