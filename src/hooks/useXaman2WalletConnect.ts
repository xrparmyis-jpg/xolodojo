import { useState, useCallback } from 'react';

export function useXaman2WalletConnect({ showToast }: { showToast: (type: 'success' | 'error', message: string, durationMs?: number) => void }) {
    const [isXaman2ConnectPending, setIsXaman2ConnectPending] = useState(false);
    const [showXaman2QrModal, setShowXaman2QrModal] = useState(false);
    const [xaman2ConnectUri, setXaman2ConnectUri] = useState<string | null>(null);
    const [xaman2DeepLink, setXaman2DeepLink] = useState<string | null>(null);
    const [payloadUuid, setPayloadUuid] = useState<string | null>(null);
    const [websocketUrl, setWebsocketUrl] = useState<string | null>(null);
    const [connectedAddress, setConnectedAddress] = useState<string | null>(null);

    const connect = useCallback(async () => {
        setIsXaman2ConnectPending(true);
        try {
            // Use backend API on port 3000 in development, relative path in production
            let apiUrl = '/api/user/xaman-signin';
            if (window.location.hostname === 'localhost' && window.location.port === '5173') {
                apiUrl = 'http://localhost:3000/api/user/xaman-signin';
            }
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });
            const text = await response.text();
            if (!response.ok) {
                let msg = `API error: ${response.status} ${text}`;
                try {
                    const errBody = JSON.parse(text);
                    if (errBody.error) msg = errBody.error;
                    if (errBody.debug) msg += ` (${JSON.stringify(errBody.debug)})`;
                } catch (_) {}
                throw new Error(msg);
            }
            const data = JSON.parse(text);
            if (!data.qrCodeUrl || !data.payloadId || !data.websocketUrl) {
                throw new Error(data.error || 'Failed to create Xaman sign-in payload: missing qrCodeUrl, payloadId, or websocketUrl');
            }
            setPayloadUuid(data.payloadId);
            setXaman2ConnectUri(data.qrCodeUrl);
            setXaman2DeepLink(data.deepLink);
            setWebsocketUrl(data.websocketUrl);
            setShowXaman2QrModal(true);
            // eslint-disable-next-line no-console
            console.log('[Xaman2][Connect] Backend response:', data);
            // Setup WebSocket to listen for scan/signature
            const ws = new window.WebSocket(data.websocketUrl);
            ws.onmessage = (event) => {
                try {
                    const msg = JSON.parse(event.data);
                    // eslint-disable-next-line no-console
                    console.log('[Xaman2][WebSocket] Message:', msg);
                    if (msg.signed && msg.account) {
                        setConnectedAddress(msg.account);
                        setShowXaman2QrModal(false);
                        setXaman2ConnectUri(null);
                        ws.close();
                        showToast('success', 'Xaman wallet connected!');
                    }
                } catch (err) {
                    // eslint-disable-next-line no-console
                    console.error('[Xaman2][WebSocket] Error parsing message:', err);
                }
            };
            ws.onerror = (err) => {
                // eslint-disable-next-line no-console
                console.error('[Xaman2][WebSocket] Error:', err);
            };
        } catch (err: any) {
            showToast('error', `Failed to generate Xaman2 QR: ${err.message}`);
            setShowXaman2QrModal(false);
            setXaman2ConnectUri(null);
            setXaman2DeepLink(null);
            setWebsocketUrl(null);
        } finally {
            setIsXaman2ConnectPending(false);
        }
    }, [showToast]);

    const cancel = useCallback(() => {
        setShowXaman2QrModal(false);
        setXaman2ConnectUri(null);
        setXaman2DeepLink(null);
        setPayloadUuid(null);
        setWebsocketUrl(null);
        setConnectedAddress(null);
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
        websocketUrl,
        connectedAddress,
    };
}
