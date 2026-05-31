import { apiFetch, API_BASE_URL } from '../lib/apiFetch';

export interface SavedGlobePinItem {
  token_id: string;
  title: string | null;
  image_url: string | null;
  created_at: string;
}

export async function getSavedGlobePins(): Promise<SavedGlobePinItem[]> {
  const response = await apiFetch(`${API_BASE_URL}/user/saved-globe-pins`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }
  const data = (await response.json()) as { success?: boolean; pins?: SavedGlobePinItem[] };
  return Array.isArray(data.pins) ? data.pins : [];
}

export async function saveGlobePin(tokenId: string): Promise<void> {
  const response = await apiFetch(`${API_BASE_URL}/user/saved-globe-pins`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token_id: tokenId }),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }
}

export async function removeSavedGlobePin(tokenId: string): Promise<void> {
  const response = await apiFetch(`${API_BASE_URL}/user/saved-globe-pins`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token_id: tokenId }),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }
}
