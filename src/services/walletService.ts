// Use relative path for API - works with both Vite dev and Vercel dev
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const credFetch = (input: string, init?: RequestInit) =>
  fetch(input, { ...init, credentials: 'include' });

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

/**
 * Apply a wallet row returned from connect (or add) APIs: upsert this row and mark every other wallet disconnected.
 * Matches server behavior after PUT .../connect.
 */
export function mergeWalletIntoList(previous: Wallet[], updated: Wallet): Wallet[] {
  const without = previous.filter((w) => w.id !== updated.id);
  const othersDisconnected = without.map((w) => ({ ...w, is_connected: false }));
  return [...othersDisconnected, updated];
}

interface WalletResponse {
  success: boolean;
  wallet?: Wallet;
  wallets?: Wallet[];
  message?: string;
  already_exists?: boolean;
}

interface ApiErrorBody {
  error?: string;
  details?: string;
}

async function parseApiError(response: Response): Promise<ApiErrorBody> {
  const text = await response.text();
  if (!text) return { error: 'Unknown error' };
  try {
    return JSON.parse(text) as ApiErrorBody;
  } catch {
    return { error: text };
  }
}

function toApiErrorMessage(status: number, body: ApiErrorBody): string {
  const baseMessage = body.error || `HTTP error! status: ${status}`;
  if (body.details) {
    return `${baseMessage} (${body.details})`;
  }
  return baseMessage;
}

function isTransientNetworkError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /ECONNRESET|ETIMEDOUT|ECONNREFUSED|network|fetch failed|Failed to fetch/i.test(
    msg
  );
}

/**
 * Get all wallets for the logged-in user (session cookie).
 */
export async function getUserWallets(): Promise<{ success: boolean; wallets: Wallet[] }> {
  const maxAttempts = 3;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await credFetch(`${API_BASE_URL}/user/wallets`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const error = await parseApiError(response);
        throw new Error(toApiErrorMessage(response.status, error));
      }

      const data: { success: boolean; wallets: Wallet[] } = await response.json();
      return data;
    } catch (error) {
      lastError = error;
      console.error('Error fetching wallets:', error);
      if (attempt < maxAttempts && isTransientNetworkError(error)) {
        await new Promise((r) => setTimeout(r, 350 * attempt));
        continue;
      }
      throw error;
    }
  }

  throw lastError;
}

export async function addWallet(
  walletAddress: string,
  walletType: string,
  walletLabel?: string
): Promise<WalletResponse> {
  const response = await credFetch(`${API_BASE_URL}/user/wallets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      wallet_address: walletAddress,
      wallet_type: walletType,
      wallet_label: walletLabel,
    }),
  });

  if (!response.ok) {
    const error = await parseApiError(response);
    throw new Error(toApiErrorMessage(response.status, error));
  }

  return response.json();
}

export async function connectWallet(walletId: number): Promise<WalletResponse> {
  const response = await credFetch(`${API_BASE_URL}/user/wallets/${walletId}/connect`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });

  if (!response.ok) {
    const error = await parseApiError(response);
    throw new Error(toApiErrorMessage(response.status, error));
  }

  return response.json();
}

export async function disconnectWallet(): Promise<WalletResponse> {
  const response = await credFetch(`${API_BASE_URL}/user/wallets/disconnect`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });

  if (!response.ok) {
    const error = await parseApiError(response);
    throw new Error(toApiErrorMessage(response.status, error));
  }

  return response.json();
}

export async function deleteWallet(walletId: number): Promise<WalletResponse> {
  const response = await credFetch(`${API_BASE_URL}/user/wallets/${walletId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });

  if (!response.ok) {
    const error = await parseApiError(response);
    throw new Error(toApiErrorMessage(response.status, error));
  }

  return response.json();
}

export async function updateWalletAddress(
  walletId: number,
  walletAddress: string
): Promise<WalletResponse> {
  const response = await credFetch(`${API_BASE_URL}/user/wallets/${walletId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      wallet_address: walletAddress,
    }),
  });

  if (!response.ok) {
    const error = await parseApiError(response);
    throw new Error(toApiErrorMessage(response.status, error));
  }

  return response.json();
}
