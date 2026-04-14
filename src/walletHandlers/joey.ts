import type { IWalletHandler } from './IWalletHandler';
import { disconnectWallet } from '../services/walletService';

/**
 * Joey connect/add flows live in `useJoeyWalletConnect` + `useJoeyWalletPersistence`
 * and `components/joey/*` — not here. This stub keeps a consistent handler shape.
 */
export const joeyHandler: IWalletHandler = {
  async connect() {
    return Promise.resolve();
  },
  async disconnect() {
    await disconnectWallet();
  },
  async repair() {
    // Implement Joey repair logic if needed
  },
};
