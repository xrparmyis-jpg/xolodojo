import { disconnect } from 'wagmi/actions';
import { wagmiConfig } from '../web3modal';
import { xamanHandler } from '../walletHandlers/xaman';
import { clearJoeyConnectIntent } from '../wallets/joey/joeyConnectIntent';

/**
 * Best-effort teardown of browser wallet sessions (used when ending wallet-only app session).
 */
export async function disconnectExternalWallets(): Promise<void> {
  try {
    await disconnect(wagmiConfig);
  } catch {
    /* already disconnected */
  }
  try {
    await xamanHandler.disconnect({ setShowToast: () => {} });
  } catch {
    /* ignore */
  }
  try {
    clearJoeyConnectIntent();
  } catch {
    /* ignore */
  }
}
