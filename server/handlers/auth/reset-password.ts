import type { VercelRequest, VercelResponse } from '@vercel/node';

/** Legacy reset-password endpoint — password reset is handled via Supabase Auth callback. */
export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  res.status(410).json({
    error:
      'Password reset is handled through the link in your email. Open that link, then set your new password on the page.',
  });
}
