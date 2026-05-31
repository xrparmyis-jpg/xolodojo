import { getSupabaseClient } from './supabaseClient';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export async function apiFetch(input: string, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers);

  try {
    const supabase = getSupabaseClient();
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  } catch {
    // Supabase not configured yet — wallet-only cookie auth may still work.
  }

  return fetch(input, {
    ...init,
    headers,
    credentials: 'include',
  });
}

export { API_BASE_URL };
