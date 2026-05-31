import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAuthUserId } from '../../../lib/requestAuth.js';
import { getServiceRoleClient } from '../../../lib/supabaseAdmin.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'PUT') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const userId = await requireAuthUserId(req, res);
    if (userId === null) return;

    const supabase = getServiceRoleClient();
    const { error } = await supabase
      .from('user_wallets')
      .update({ is_connected: false, updated_at: new Date().toISOString() })
      .eq('user_id', userId);

    if (error) throw error;

    res.status(200).json({ success: true, message: 'All wallets disconnected' });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
}
