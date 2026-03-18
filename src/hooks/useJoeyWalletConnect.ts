import { useState, useCallback } from 'react';
import { standalone as joeyStandalone } from '@joey-wallet/wc-client/react';

export function useJoeyWalletConnect({ showToast }: { showToast: (type: 'success' | 'error', message: string, durationMs?: number) => void }) {
    const { actions: joeyActions } = joeyStandalone.provider.useProvider();
    const [isJoeyConnectPending, setIsJoeyConnectPending] = useState(false);
    const [showJoeyQrModal, setShowJoeyQrModal] = useState(false);
    const [joeyConnectUri, setJoeyConnectUri] = useState<string | null>(null);
    const [joeyDeepLink, setJoeyDeepLink] = useState<string | null>(null);

    const connect = useCallback(async () => {
        setIsJoeyConnectPending(true);
        try {
            if (!joeyActions?.generate) throw new Error('Joey Wallet generate action not available');
            const generatedConnection = await joeyActions.generate({ chain: 'xrpl:0', openModal: false });
            if (generatedConnection.error) throw generatedConnection.error;
            const uri = generatedConnection.data?.uri?.trim() || null;
            const deeplink = generatedConnection.data?.deeplink || null;
            if (!uri) throw new Error('Joey QR code could not be generated.');
            setJoeyConnectUri(uri);
            setJoeyDeepLink(deeplink);
            setShowJoeyQrModal(true);
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            showToast('error', `Failed to generate Joey QR: ${err.message}`);
            setShowJoeyQrModal(false);
            setJoeyConnectUri(null);
            setJoeyDeepLink(null);
        } finally {
            setIsJoeyConnectPending(false);
        }
    }, [joeyActions, showToast]);

    const cancel = useCallback(() => {
        setShowJoeyQrModal(false);
        setJoeyConnectUri(null);
        setJoeyDeepLink(null);
        setIsJoeyConnectPending(false);
    }, []);

    return {
        isJoeyConnectPending,
        showJoeyQrModal,
        joeyConnectUri,
        joeyDeepLink,
        connect,
        cancel,
    };
}
