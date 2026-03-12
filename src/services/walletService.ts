// Use relative path for API - works with both Vite dev and Vercel dev
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export interface Wallet {
  id: number;
  user_id: number;
  wallet_address: string;
  wallet_type: string;
  wallet_label?: string | null;
  is_connected: boolean;
  created_at: string;
  updated_at: string;
}

interface WalletResponse {
  success: boolean;
  wallet?: Wallet;
  wallets?: Wallet[];
  message?: string;
}

interface ApiErrorBody {
  error?: string;
  details?: string;
}

function toApiErrorMessage(status: number, body: ApiErrorBody): string {
  const baseMessage = body.error || `HTTP error! status: ${status}`;
  if (body.details) {
    return `${baseMessage} (${body.details})`;
  }
  return baseMessage;
}

/**
 * Get all wallets for a user
 */
export async function getUserWallets(
  auth0Id: string,
  accessToken?: string
): Promise<{ success: boolean; wallets: Wallet[] }> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/user/wallets?auth0_id=${encodeURIComponent(auth0Id)}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
        },
      }
    );

    if (!response.ok) {
      const error = (await response
        .json()
        .catch(() => ({ error: 'Unknown error' }))) as ApiErrorBody;
      throw new Error(toApiErrorMessage(response.status, error));
    }

    const data: { success: boolean; wallets: Wallet[] } = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching wallets:', error);
    throw error;
  }
}

/**
 * Add a new wallet for a user
 */
export async function addWallet(
  auth0Id: string,
  walletAddress: string,
  walletType: string,
  walletLabel?: string,
  accessToken?: string
): Promise<WalletResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/user/wallets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      },
      body: JSON.stringify({
        auth0_id: auth0Id,
        wallet_address: walletAddress,
        wallet_type: walletType,
        wallet_label: walletLabel,
      }),
    });

    if (!response.ok) {
      const error = (await response
        .json()
        .catch(() => ({ error: 'Unknown error' }))) as ApiErrorBody;
      throw new Error(toApiErrorMessage(response.status, error));
    }

    const data: WalletResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error adding wallet:', error);
    throw error;
  }
}

/**
 * Connect a wallet (set as active)
 */
export async function connectWallet(
  auth0Id: string,
  walletId: number,
  accessToken?: string
): Promise<WalletResponse> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/user/wallets/${walletId}/connect`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
        },
        body: JSON.stringify({
          auth0_id: auth0Id,
        }),
      }
    );

    if (!response.ok) {
      const error = (await response
        .json()
        .catch(() => ({ error: 'Unknown error' }))) as ApiErrorBody;
      throw new Error(toApiErrorMessage(response.status, error));
    }

    const data: WalletResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error connecting wallet:', error);
    throw error;
  }
}

/**
 * Disconnect the currently connected wallet
 */
export async function disconnectWallet(
  auth0Id: string,
  accessToken?: string
): Promise<WalletResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/user/wallets/disconnect`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      },
      body: JSON.stringify({
        auth0_id: auth0Id,
      }),
    });

    if (!response.ok) {
      const error = (await response
        .json()
        .catch(() => ({ error: 'Unknown error' }))) as ApiErrorBody;
      throw new Error(toApiErrorMessage(response.status, error));
    }

    const data: WalletResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error disconnecting wallet:', error);
    throw error;
  }
}

/**
 * Delete a wallet
 */
export async function deleteWallet(
  walletId: number,
  auth0Id: string,
  accessToken?: string
): Promise<WalletResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/user/wallets/${walletId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      },
      body: JSON.stringify({
        auth0_id: auth0Id,
      }),
    });

    if (!response.ok) {
      const error = (await response
        .json()
        .catch(() => ({ error: 'Unknown error' }))) as ApiErrorBody;
      throw new Error(toApiErrorMessage(response.status, error));
    }

    const data: WalletResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error deleting wallet:', error);
    throw error;
  }
}

export async function updateWalletAddress(
  walletId: number,
  auth0Id: string,
  walletAddress: string,
  accessToken?: string
): Promise<WalletResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/user/wallets/${walletId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      },
      body: JSON.stringify({
        auth0_id: auth0Id,
        wallet_address: walletAddress,
      }),
    });

    if (!response.ok) {
      const error = (await response
        .json()
        .catch(() => ({ error: 'Unknown error' }))) as ApiErrorBody;
      throw new Error(toApiErrorMessage(response.status, error));
    }

    const data: WalletResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating wallet address:', error);
    throw error;
  }
}
