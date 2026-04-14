const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const credFetch = (input: string, init?: RequestInit) =>
  fetch(input, { ...init, credentials: 'include' });

export interface UserProfile {
  id: number;
  email: string;
  username: string;
  name: string | null;
  picture_url: string | null;
  bio: string | null;
  wallet_address: string | null;
  wallet_type: string | null;
  preferences: Record<string, unknown>;
  updated_at: string;
}

export interface ProfileSocials {
  twitter?: string;
  discord?: string;
  tiktok?: string;
  instagram?: string;
  telegram?: string;
  linkedin?: string;
}

interface ProfileResponse {
  success: boolean;
  user: UserProfile;
}

export async function getUserProfile(): Promise<ProfileResponse> {
  const response = await credFetch(`${API_BASE_URL}/user/profile`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    const errorText = await response.text();
    let error: { error?: string } = {};
    try {
      error = JSON.parse(errorText) as { error?: string };
    } catch {
      error = { error: errorText || 'Unknown error' };
    }
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

export async function updateUserProfile(payload: {
  bio?: string;
  socials?: ProfileSocials;
}): Promise<ProfileResponse> {
  const response = await credFetch(`${API_BASE_URL}/user/profile`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      bio: payload.bio ?? '',
      socials: payload.socials ?? {},
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}
