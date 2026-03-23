/**
 * Single source of truth for wallet-section loading overlay copy (Profile / WalletConnection).
 * Use these constants everywhere so wording stays aligned across Xaman, Joey, WalletConnect, etc.
 */

// --- List / summary ---
/** Initial GET /user/wallets (may be multiple rows). */
export const LOADING_WALLETS_MESSAGE = 'Loading wallets…';

/** NFT / asset summary for the connected wallet. */
export const LOADING_WALLET_SUMMARY_MESSAGE = 'Loading wallet summary…';

// --- Provider session → our API (add row + connect) ---
/** After signing; writing the wallet row and marking connected (Joey persistence, similar beat to Xaman “adding” phase). */
export const SAVING_WALLET_MESSAGE = 'Saving your wallet…';

// --- Disconnect / remove ---
export const DISCONNECTING_WALLET_MESSAGE = 'Disconnecting wallet…';
export const REMOVING_WALLET_MESSAGE = 'Removing wallet…';

// --- Xaman (PKCE / sign-in phases) ---
export const XAMAN_CONNECTING_MESSAGE = 'Connecting to Xaman…';
export const CONNECTING_YOUR_WALLET_MESSAGE = 'Connecting your wallet…';
export const RECONNECTING_WALLET_MESSAGE = 'Reconnecting your wallet…';
export const ADDING_WALLET_AND_CONNECTING_MESSAGE = 'Adding wallet and connecting…';

// --- Joey Wallet ---
export const JOEY_WAITING_FOR_WALLET_MESSAGE = 'Waiting for Joey Wallet…';
export const CONNECTING_JOEY_WALLET_MESSAGE = 'Connecting to Joey Wallet…';

// --- WalletConnect / generic ---
export const CONNECTING_WITH_WALLETCONNECT_MESSAGE = 'Connecting with WalletConnect…';
export const OPENING_WALLETCONNECT_MESSAGE = 'Opening WalletConnect…';
export const CONNECTING_WALLET_GENERIC_MESSAGE = 'Connecting wallet…';
