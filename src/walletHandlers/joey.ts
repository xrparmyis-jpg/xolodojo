import type { IWalletHandler } from './IWalletHandler';
import { disconnectWallet } from '../services/walletService';
// Joey Wallet handler implementation
export const joeyHandler: IWalletHandler = {
  // No connect method: all hook-using logic must be in the component
  async disconnect({ auth0Id, accessToken }: { auth0Id: string; accessToken?: string }) {
    // Implement Joey disconnect logic if needed
    await disconnectWallet(auth0Id, accessToken);
  },
	async repair() {
		// Implement Joey repair logic if needed
	},
};
