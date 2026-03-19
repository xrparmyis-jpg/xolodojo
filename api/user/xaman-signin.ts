import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

// Environment variables for Xaman/Xumm API credentials
const XAMAN_API_KEY = process.env.XAMAN_API_KEY;
const XAMAN_API_SECRET = process.env.XAMAN_API_SECRET;

// Xaman API endpoint
const XAMAN_API_URL = 'https://xumm.app/api/v1/platform/payload';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  if (!XAMAN_API_KEY || !XAMAN_API_SECRET) {
    console.error('Xaman API credentials are missing');
    res.status(500).json({ error: 'Xaman API credentials not configured' });
    return;
  }
  try {
    // Create SignIn payload (txjson only; no options.submit so QR/websocket are returned)
    const payload = {
      txjson: {
        TransactionType: 'SignIn',
      },
    };

    // Log the headers being sent to Xaman API
    console.log('Xaman API headers:', {
      'X-API-Key': XAMAN_API_KEY,
      'X-API-Secret': XAMAN_API_SECRET,
      'Content-Type': 'application/json',
    });

    // Call Xaman API
    let response;
    try {
      response = await axios.post(XAMAN_API_URL, payload, {
        headers: {
          'X-API-Key': XAMAN_API_KEY,
          'X-API-Secret': XAMAN_API_SECRET,
          'Content-Type': 'application/json',
        },
      });
    } catch (apiErr: any) {
      // Log full error response for debugging
      if (apiErr.response) {
        console.error('[Xaman API Error]', {
          status: apiErr.response.status,
          headers: apiErr.response.headers,
          data: apiErr.response.data,
        });
        res.status(apiErr.response.status).json({
          error: 'Xaman API error',
          status: apiErr.response.status,
          data: apiErr.response.data,
        });
        return;
      } else {
        console.error('[Xaman API Error]', apiErr);
        res
          .status(500)
          .json({ error: apiErr.message || 'Failed to call Xaman API' });
        return;
      }
    }

    // Extract relevant fields (Xaman may nest under .payload or use different keys)
    const data = (response.data ?? {}) as Record<string, unknown>;
    const body = (data.payload ?? data) as Record<string, unknown>;
    const uuid = (body.uuid ?? data.uuid) as string | undefined;
    const refs = (body.refs ?? data.refs ?? {}) as Record<string, unknown>;
    const next = (body.next ?? data.next ?? {}) as Record<string, unknown>;
    const websocketUrl =
      (body.websocket_status ?? data.websocket_status ?? refs.websocket_status) as string | undefined;
    const qrCodeUrl = (refs.qr_png ?? refs.qr_code) as string | undefined;
    const deepLink = (next.always ?? next.no_push_msg_received) as string | undefined;

    if (!uuid || !qrCodeUrl || !websocketUrl) {
      console.error('[Xaman Signin] Unexpected API response shape:', JSON.stringify(data, null, 2));
      res.status(502).json({
        error: 'Xaman returned unexpected response format',
        debug: { hasUuid: !!uuid, hasQr: !!qrCodeUrl, hasWebSocket: !!websocketUrl },
      });
      return;
    }

    res.status(200).json({
      payloadId: uuid,
      qrCodeUrl,
      deepLink: deepLink ?? null,
      websocketUrl,
    });
    return;
  } catch (error: any) {
    console.error('[Xaman Signin Handler Error]', error);
    res
      .status(500)
      .json({
        error: error.message || 'Failed to create Xaman sign-in payload',
      });
    return;
  }
}
