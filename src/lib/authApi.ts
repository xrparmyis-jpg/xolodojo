import { getSupabaseClient } from './supabaseClient';
import { apiFetch, API_BASE_URL } from './apiFetch';

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
  const response = await apiFetch(`${API_BASE_URL}/auth/me`, {
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
    body: JSON.stringify({ email, password }),
  });

  const data = (await response.json().catch(() => ({}))) as {
    error?: string;
    code?: string;
    user?: AuthUser;
    session?: { access_token: string; refresh_token: string };
  };

  if (!response.ok) {
    throw new LoginError(
      data.error || `Login failed: ${response.statusText}`,
      typeof data.code === 'string' ? data.code : undefined
    );
  }

  if (data.session) {
    const supabase = getSupabaseClient();
    await supabase.auth.setSession({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    });
  }

  if (!data.user) {
    throw new LoginError('Login failed: missing user');
  }

  return data.user;
}

export async function logout(): Promise<void> {
  try {
    const supabase = getSupabaseClient();
    await supabase.auth.signOut();
  } catch {
    // ignore if supabase not configured
  }
  await fetch(`${API_BASE_URL}/auth/logout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });
}

export async function resendVerificationEmail(email: string): Promise<{ message: string; emailSent: boolean }> {
  const response = await fetch(`${API_BASE_URL}/auth/resend-verification`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
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

export async function resetPasswordWithSupabase(newPassword: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) {
    throw new Error(error.message);
  }
}

export async function requestPasswordResetByUsername(username: string): Promise<{ message: string }> {
  const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: username.trim() }),
  });
  const data = (await response.json().catch(() => ({}))) as { error?: string; message?: string };
  if (!response.ok) {
    throw new Error(typeof data.error === 'string' ? data.error : 'Failed to send reset email');
  }
  return {
    message:
      data.message ||
      'If an account exists for that username, check your inbox for a reset password link.',
  };
}
