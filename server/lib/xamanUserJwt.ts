/**
 * Resolve the active XRPL account from a Xaman / Xumm OAuth2 user JWT.
 * The client obtains this JWT via xumm-oauth2-pkce after the user authorizes.
 */
import { resolveCanonicalClassicAddress } from '../xrplClassicAddress.js';

function pickAccountFromUserPayload(data: unknown): string | null {
  if (data == null || typeof data !== 'object') {
    return null;
  }
  const d = data as Record<string, unknown>;
  const direct = d.account;
  if (typeof direct === 'string' && direct.startsWith('r')) {
    return direct;
  }
  const sub = d.sub;
  if (typeof sub === 'string' && sub.startsWith('r')) {
    return sub;
  }
  const me = d.me;
  if (me != null && typeof me === 'object') {
    const acc = (me as Record<string, unknown>).account;
    if (typeof acc === 'string' && acc.startsWith('r')) {
      return acc;
    }
  }
  return null;
}

export async function getXamanAccountFromUserJwt(jwt: string): Promise<string | null> {
  const trimmed = jwt.trim();
  if (!trimmed) {
    return null;
  }

  try {
    const res = await fetch('https://oauth2.xumm.app/userinfo', {
      headers: {
        Authorization: `Bearer ${trimmed}`,
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      return null;
    }

    const data: unknown = await res.json();
    const raw = pickAccountFromUserPayload(data);
    if (!raw) {
      return null;
    }

    return (
      resolveCanonicalClassicAddress(raw) ??
      resolveCanonicalClassicAddress(raw.toLowerCase()) ??
      null
    );
  } catch {
    return null;
  }
}
