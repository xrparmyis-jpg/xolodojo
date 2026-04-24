const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const cred = (init?: RequestInit) => ({
  ...init,
  credentials: 'include' as const,
  headers: { 'Content-Type': 'application/json', ...init?.headers },
});

export interface SavedGlobePinItem {
  token_id: string;
  title: string | null;
  image_url: string | null;
  created_at: string;
}

export async function getSavedGlobePins(): Promise<SavedGlobePinItem[]> {
  const r = await credFetch(`${API_BASE_URL}/user/saved-globe-pins`, { method: 'GET' });
  if (!r.ok) {
    const e = await r.json().catch(() => ({}));
    throw new Error((e as { error?: string }).error || 'Failed to load saved pins');
  }
  const d = (await r.json()) as { success?: boolean; pins?: SavedGlobePinItem[] };
  return d.pins || [];
}

export async function addSavedGlobePin(tokenId: string): Promise<void> {
  const r = await credFetch(`${API_BASE_URL}/user/saved-globe-pins`, {
    method: 'POST',
    body: JSON.stringify({ token_id: tokenId }),
  });
  if (!r.ok) {
    const e = await r.json().catch(() => ({}));
    throw new Error((e as { error?: string }).error || 'Failed to save pin');
  }
}

export async function removeSavedGlobePin(tokenId: string): Promise<void> {
  const r = await credFetch(`${API_BASE_URL}/user/saved-globe-pins`, {
    method: 'DELETE',
    body: JSON.stringify({ token_id: tokenId }),
  });
  if (!r.ok) {
    const e = await r.json().catch(() => ({}));
    throw new Error((e as { error?: string }).error || 'Failed to remove pin');
  }
}

function credFetch(input: string, init?: RequestInit) {
  return fetch(input, cred(init));
}
