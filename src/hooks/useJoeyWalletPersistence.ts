import { useEffect, useRef, type MutableRefObject } from 'react';
import type { Wallet } from '../services/walletService';
import { addWallet, connectWallet, disconnectWallet } from '../services/walletService';
import { extractJoeyWalletAddress } from '../wallets/joey/extractJoeyWalletAddress';
import { clearJoeyConnectIntent, hasJoeyConnectIntent } from '../wallets/joey/joeyConnectIntent';
import { walletAddressPreview, walletDebugLog, walletTraceLog } from '../utils/walletDebugLog';
import { SAVING_WALLET_MESSAGE } from '../constants/walletUiMessages';

type ShowToast = (type: 'success' | 'error', message: string, durationMs?: number) => void;

export interface UseJoeyWalletPersistenceParams {
  showJoeyQrModal: boolean;
  joeyAccount: string | null | undefined;
  joeySession: unknown;
  wallets: Wallet[];
  loadWallets: (opts?: { silent?: boolean }) => Promise<void>;
  applyConnectedWalletFromApi: (row: Wallet) => void;
  setWalletBusyMessage: (msg: string | null) => void;
  showToast: ShowToast;
  /** Set true while disconnecting/removing Joey so in-flight persist cannot reconnect. */
  persistenceSuppressedRef: MutableRefObject<boolean>;
  /** When set, skip DB add/connect and create wallet-only app session instead. */
  walletAuthLogin?: (address: string, walletType: 'joey') => Promise<void>;
}

/**
 * When Joey WC session resolves (modal closed + account/session present), persist to our API.
 * Keeps WalletConnection free of Joey-specific effect logic.
 */
export function useJoeyWalletPersistence({
  showJoeyQrModal,
  joeyAccount,
  joeySession,
  wallets,
  loadWallets,
  applyConnectedWalletFromApi,
  setWalletBusyMessage,
  showToast,
  persistenceSuppressedRef,
  walletAuthLogin,
}: UseJoeyWalletPersistenceParams): void {
  const runningRef = useRef(false);

  useEffect(() => {
    if (showJoeyQrModal) return;
    if (!joeyAccount && !joeySession) return;

    const joeyAddress = extractJoeyWalletAddress(joeyAccount, joeySession);
    if (!joeyAddress) {
      walletTraceLog('Joey persist: no XRPL address from SDK yet', {
        hasJoeyAccount: Boolean(joeyAccount),
        hasJoeySession: Boolean(joeySession),
      });
      walletDebugLog('Joey persist skipped (no classic address from SDK)', {
        hasJoeyAccount: Boolean(joeyAccount),
        hasJoeySession: Boolean(joeySession),
      });
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.warn('[JoeyWallet] No address extracted from session; skip persist.');
      }
      return;
    }

    /** Must preserve XRPL base58 checksum casing — do not .toLowerCase() the stored address. */
    const canonicalAddress = joeyAddress.trim();
    const compareKey = canonicalAddress.toLowerCase();

    walletTraceLog('Joey persist: have address, checking intent + DB', {
      addressPreview: walletAddressPreview(canonicalAddress),
    });
    walletDebugLog('Joey persist candidate', {
      addressPreview: walletAddressPreview(canonicalAddress),
    });
    const existingWallet = wallets.find(
      (w) => w.wallet_address.toLowerCase() === compareKey && w.wallet_type === 'joey'
    );
    if (existingWallet?.is_connected) {
      return;
    }

    // No intent => lingering SDK session after disconnect/delete, or stale tab — never write to API.
    if (!hasJoeyConnectIntent()) {
      walletTraceLog(
        'Joey persist skipped — no joey connect intent (SDK has session but we will not save/connect API)',
        {
          addressPreview: walletAddressPreview(canonicalAddress),
        }
      );
      walletDebugLog('Joey persist skipped (no connect intent in sessionStorage)', {
        addressPreview: walletAddressPreview(canonicalAddress),
      });
      return;
    }

    const currentConnectedWallet = wallets.find((w) => w.is_connected);

    if (runningRef.current) return;
    runningRef.current = true;

    void (async () => {
      if (persistenceSuppressedRef.current) {
        runningRef.current = false;
        return;
      }
      setWalletBusyMessage(SAVING_WALLET_MESSAGE);
      try {
        if (walletAuthLogin) {
          if (persistenceSuppressedRef.current) {
            clearJoeyConnectIntent();
            return;
          }
          await walletAuthLogin(canonicalAddress, 'joey');
          clearJoeyConnectIntent();
          return;
        }

        let walletId: number | undefined;
        let successToastMessage = 'Joey Wallet added and connected!';
        if (!existingWallet) {
          if (persistenceSuppressedRef.current) {
            clearJoeyConnectIntent();
            return;
          }
          const result = await addWallet(canonicalAddress, 'joey', 'Joey Wallet');
          if (!result.success || !result.wallet) throw new Error('Failed to add Joey Wallet');
          walletId = result.wallet.id;
          if (result.already_exists && result.message) {
            successToastMessage = result.message;
          }
        } else {
          walletId = existingWallet.id;
        }
        if (walletId) {
          if (persistenceSuppressedRef.current) {
            clearJoeyConnectIntent();
            return;
          }
          if (currentConnectedWallet && currentConnectedWallet.id !== walletId) {
            await disconnectWallet();
          }
          if (persistenceSuppressedRef.current) {
            clearJoeyConnectIntent();
            return;
          }
          const connectRes = await connectWallet(walletId);
          if (connectRes.wallet) {
            applyConnectedWalletFromApi(connectRes.wallet);
          }
          await loadWallets({ silent: true });
          clearJoeyConnectIntent();
          showToast('success', successToastMessage);
          walletTraceLog('Joey persist: backend saved wallet + is_connected; NFT summary should run next', {
            walletId,
            addressPreview: walletAddressPreview(canonicalAddress),
          });
        }
      } catch (err) {
        clearJoeyConnectIntent();
        console.error('[JoeyWallet] Failed to add/connect:', err);
        showToast(
          'error',
          `Failed to add/connect Joey Wallet: ${err instanceof Error ? err.message : String(err)}`
        );
      } finally {
        setWalletBusyMessage(null);
        runningRef.current = false;
      }
    })();
  }, [
    showJoeyQrModal,
    joeyAccount,
    joeySession,
    wallets,
    loadWallets,
    showToast,
    applyConnectedWalletFromApi,
    setWalletBusyMessage,
    persistenceSuppressedRef,
    walletAuthLogin,
  ]);
}
