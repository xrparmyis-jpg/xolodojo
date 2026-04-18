const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export type AuthMode = 'password' | 'wallet';

export interface AuthUser {
  id: string;
  authMode?: AuthMode;
  email?: string;
  username?: string;
  name?: string;
  pictureUrl?: string;
  role?: string;
  createdAt: string;
  emailVerified?: boolean;
  walletAddress?: string;
  walletType?: string;
}

export class LoginError extends Error {
  constructor(
    message: string,
    public readonly code?: string
  ) {
    super(message);
    this.name = 'LoginError';
  }
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    credentials: 'include',
    cache: 'no-store',
  });

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(typeof err.error === 'string' ? err.error : 'Auth check failed');
  }

  const data = (await response.json()) as { user: AuthUser };
  return data.user ?? null;
}

export async function loginWithWallet(
  walletAddress: string,
  walletType: string,
  opts?: { xamanJwt?: string }
): Promise<AuthUser> {
  const body: Record<string, string> = {
    wallet_address: walletAddress,
    wallet_type: walletType,
  };
  if (opts?.xamanJwt) {
    body.xaman_jwt = opts.xamanJwt;
  }

  const response = await fetch(`${API_BASE_URL}/auth/wallet-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  });

  const data = (await response.json().catch(() => ({}))) as {
    error?: string;
    user?: AuthUser;
  };

  if (!response.ok) {
    throw new Error(typeof data.error === 'string' ? data.error : 'Wallet sign-in failed');
  }

  if (!data.user) {
    throw new Error('Wallet sign-in failed: missing user');
  }

  return data.user;
}

export async function login(email: string, password: string): Promise<AuthUser> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  });

  const data = (await response.json().catch(() => ({}))) as {
    error?: string;
    code?: string;
    user?: AuthUser;
  };

  if (!response.ok) {
    throw new LoginError(
      data.error || `Login failed: ${response.statusText}`,
      typeof data.code === 'string' ? data.code : undefined
    );
  }

  if (!data.user) {
    throw new LoginError('Login failed: missing user');
  }

  return data.user;
}

export async function logout(): Promise<void> {
  await fetch(`${API_BASE_URL}/auth/logout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });
}

export async function resendVerificationEmail(
  email: string,
  password: string
): Promise<{ message: string; emailSent: boolean }> {
  const response = await fetch(`${API_BASE_URL}/auth/resend-verification`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = (await response.json().catch(() => ({}))) as {
    error?: string;
    message?: string;
    emailSent?: boolean;
  };
  if (!response.ok) {
    throw new Error(typeof data.error === 'string' ? data.error : 'Could not resend verification email');
  }
  return {
    message:
      typeof data.message === 'string'
        ? data.message
        : 'Check your inbox for the verification link.',
    emailSent: data.emailSent !== false,
  };
}
