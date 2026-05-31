import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getRequestAuth, type RequestAuthState } from '../../lib/requestAuth.js';
import { getServiceRoleClient } from '../../lib/supabaseAdmin.js';
import { normalizeWalletAddress } from '../../lib/userPinsRepo.js';
import { normalizeNfTokenId } from '../../../src/utils/nfTokenId.js';

function accountKeyFromAuth(auth: RequestAuthState): string | null {
  if (auth.kind === 'user') {
    return `u:${auth.userId}`;
  }
  if (auth.kind === 'wallet') {
    return `w:${normalizeWalletAddress(auth.walletAddress)}`;
  }
  return null;
}

function parseTokenId(body: unknown): string | null {
  if (!body || typeof body !== 'object') return null;
  const raw = (body as { token_id?: unknown }).token_id;
  if (typeof raw !== 'string') return null;
  const t = normalizeNfTokenId(raw.trim());
  return t.length > 0 ? t : null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET' && req.method !== 'POST' && req.method !== 'DELETE') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const auth = await getRequestAuth(req);
    if (!auth) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const accountKey = accountKeyFromAuth(auth);
    if (!accountKey) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const supabase = getServiceRoleClient();

    if (req.method === 'GET') {
      const { data: rows, error } = await supabase
        .from('globe_pin_bookmarks')
        .select('token_id, created_at')
        .eq('account_key', accountKey)
        .order('created_at', { ascending: false });
      if (error) throw error;

      const list = await Promise.all(
        (rows ?? []).map(async (row) => {
          const tokenId =
            typeof row.token_id === 'string' ? normalizeNfTokenId(row.token_id) : '';
          const { data: pin } = await supabase
            .from('user_pins')
            .select('title, image_url')
            .eq('token_id', tokenId)
            .limit(1)
            .maybeSingle();
          return {
            token_id: tokenId,
            title: typeof pin?.title === 'string' ? pin.title : null,
            image_url: typeof pin?.image_url === 'string' ? pin.image_url : null,
            created_at:
              row.created_at instanceof Date
                ? row.created_at.toISOString()
                : String(row.created_at ?? ''),
          };
        })
      );

      res.status(200).json({ success: true, pins: list });
      return;
    }

    const tokenId = parseTokenId(req.body);
    if (!tokenId) {
      res.status(400).json({ error: 'Missing or invalid token_id' });
      return;
    }

    if (req.method === 'POST') {
      const { error } = await supabase.from('globe_pin_bookmarks').insert({
        account_key: accountKey,
        token_id: tokenId,
      });
      if (error?.code === '23505') {
        res.status(200).json({ success: true, already: true });
        return;
      }
      if (error) throw error;
      res.status(200).json({ success: true });
      return;
    }

    const { data, error } = await supabase
      .from('globe_pin_bookmarks')
      .delete()
      .eq('account_key', accountKey)
      .eq('token_id', tokenId)
      .select('id');
    if (error) throw error;

    res.status(200).json({ success: true, removed: data?.length ?? 0 });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('saved-globe-pins:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
}
