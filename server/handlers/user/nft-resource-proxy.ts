import type { VercelRequest, VercelResponse } from '@vercel/node';

function getSingleQueryParam(value: string | string[] | undefined): string | null {
  if (!value) return null;
  if (Array.isArray(value)) {
    return value[0] || null;
  }
  return value;
}

function isPrivateHostname(hostname: string): boolean {
  const lower = hostname.toLowerCase();

  if (lower === 'localhost' || lower === '::1' || lower.endsWith('.local')) {
    return true;
  }

  if (/^127\./.test(lower)) return true;
  if (/^10\./.test(lower)) return true;
  if (/^192\.168\./.test(lower)) return true;

  const matched172 = lower.match(/^172\.(\d+)\./);
  if (matched172) {
    const secondOctet = Number(matched172[1]);
    if (secondOctet >= 16 && secondOctet <= 31) {
      return true;
    }
  }

  return false;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const targetUrlParam = getSingleQueryParam(req.query.url);
  const modeParam = (getSingleQueryParam(req.query.mode) || 'binary').toLowerCase();
  const debugParam = getSingleQueryParam(req.query.debug) === '1';

  const logDebug = (message: string, payload?: unknown) => {
    if (!debugParam) {
      return;
    }
    if (payload === undefined) {
      console.log(`[NFT PROXY DEBUG] ${message}`);
      return;
    }
    console.log(`[NFT PROXY DEBUG] ${message}`, payload);
  };

  if (!targetUrlParam) {
    res.status(400).json({ error: 'Missing url query parameter' });
    return;
  }

  if (targetUrlParam.length > 2048) {
    res.status(400).json({ error: 'URL too long' });
    return;
  }

  let targetUrl: URL;
  try {
    targetUrl = new URL(targetUrlParam);
  } catch {
    res.status(400).json({ error: 'Invalid URL' });
    return;
  }

  if (!['http:', 'https:'].includes(targetUrl.protocol)) {
    res.status(400).json({ error: 'Only http/https URLs are allowed' });
    return;
  }

  if (isPrivateHostname(targetUrl.hostname)) {
    res.status(400).json({ error: 'Private or local hosts are not allowed' });
    return;
  }

  try {
    logDebug('Incoming request', {
      mode: modeParam,
      url: targetUrl.toString(),
    });

    const upstreamResponse = await fetch(targetUrl.toString(), {
      method: 'GET',
      headers: {
        Accept: modeParam === 'json' ? 'application/json, text/plain, */*' : 'image/*, */*',
      },
    });

    logDebug('Upstream response', {
      status: upstreamResponse.status,
      ok: upstreamResponse.ok,
      contentType: upstreamResponse.headers.get('content-type') || null,
    });

    if (!upstreamResponse.ok) {
      // If not JSON mode, return a blank PNG for image requests
      if (modeParam !== 'json') {
        // 1x1 transparent PNG
        const blankPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/w8AAgMBAp6n1wAAAABJRU5ErkJggg==', 'base64');
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Content-Length', String(blankPng.length));
        res.status(200).send(blankPng);
        return;
      }
      // Otherwise, return JSON error
      res.status(upstreamResponse.status).json({
        error: `Upstream request failed with status ${upstreamResponse.status}`,
      });
      return;
    }

    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=600');

    if (modeParam === 'json') {
      const data = (await upstreamResponse.json()) as unknown;
      logDebug('Returning JSON payload');
      res.status(200).json(data);
      return;
    }

    const contentType = upstreamResponse.headers.get('content-type') || 'application/octet-stream';
    const arrayBuffer = await upstreamResponse.arrayBuffer();
    const body = Buffer.from(arrayBuffer);

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', String(body.length));
    logDebug('Returning binary payload', { bytes: body.length, contentType });
    res.status(200).send(body);
    return;
  } catch (error: any) {
    logDebug('Proxy error', {
      message: error?.message || 'Unknown error',
    });
    res.status(500).json({
      error: 'Failed to fetch upstream resource',
      details: error?.message || 'Unknown error',
    });
    return;
  }
}
