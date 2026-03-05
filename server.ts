import express, { Request, Response } from 'express';
import cors from 'cors';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const app = express();
const PORT = process.env.API_PORT ? parseInt(process.env.API_PORT) : 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Error handling middleware (must be before routes)
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error('Express error middleware:', err);
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Internal server error',
        details: err?.message || String(err),
        stack: process.env.NODE_ENV === 'development' ? err?.stack : undefined,
      });
    }
  }
);

// Convert Express request/response to Vercel format
function vercelToExpress(
  vercelHandler: (req: VercelRequest, res: VercelResponse) => Promise<void>
) {
  return async (req: Request, res: Response) => {
    // Create Vercel-compatible request object
    const vercelReq = {
      method: req.method,
      url: req.url,
      headers: req.headers as Record<string, string | string[] | undefined>,
      query: req.query as Record<string, string | string[] | undefined>,
      body: req.body,
    } as VercelRequest;

    // Create Vercel-compatible response object
    const vercelRes = {
      status: (code: number) => {
        res.status(code);
        return vercelRes;
      },
      json: (data: any) => {
        res.json(data);
        return vercelRes;
      },
      send: (data: any) => {
        res.send(data);
        return vercelRes;
      },
      setHeader: (name: string, value: string) => {
        res.setHeader(name, value);
        return vercelRes;
      },
    } as VercelResponse;

    try {
      await vercelHandler(vercelReq, vercelRes);
    } catch (error: any) {
      console.error('Handler error:', error);
      console.error('Handler error stack:', error?.stack);
      if (!res.headersSent) {
        res.status(500).json({
          error: 'Internal server error',
          details: error?.message || String(error),
          stack:
            process.env.NODE_ENV === 'development' ? error?.stack : undefined,
        });
      }
    }
  };
}

// Dynamically import handlers and register routes
async function setupRoutes() {
  try {
    console.log('Loading API handlers...');
    const profileModule = await import('./api/user/profile.ts');
    const syncModule = await import('./api/user/sync.ts');
    const walletsModule = await import('./api/user/wallets.ts');
    const walletAssetsModule = await import('./api/user/wallet-assets.ts');
    const pinnedNftsModule = await import('./api/user/pinned-nfts.ts');
    const xoloGlobePinsModule = await import('./api/user/xologlobe-pins.ts');
    const nftResourceProxyModule = await import('./api/user/nft-resource-proxy.ts');
    const walletsIdModule = await import('./api/user/wallets/[walletId].ts');
    const walletsDisconnectModule =
      await import('./api/user/wallets/disconnect.ts');

    console.log('Profile handler loaded:', typeof profileModule.default);
    console.log('Sync handler loaded:', typeof syncModule.default);
    console.log('Wallets handler loaded:', typeof walletsModule.default);
    console.log(
      'WalletAssets handler loaded:',
      typeof walletAssetsModule.default
    );
    console.log('PinnedNfts handler loaded:', typeof pinnedNftsModule.default);
    console.log('XoloGlobePins handler loaded:', typeof xoloGlobePinsModule.default);
    console.log(
      'NftResourceProxy handler loaded:',
      typeof nftResourceProxyModule.default
    );
    console.log('WalletsId handler loaded:', typeof walletsIdModule.default);
    console.log(
      'WalletsDisconnect handler loaded:',
      typeof walletsDisconnectModule.default
    );

    // API Routes (specific routes BEFORE parameterized patterns)
    app.all('/api/user/profile', vercelToExpress(profileModule.default));
    app.all('/api/user/sync', vercelToExpress(syncModule.default));
    app.all('/api/user/wallets', vercelToExpress(walletsModule.default));
    app.all(
      '/api/user/wallet-assets',
      vercelToExpress(walletAssetsModule.default)
    );
    app.all('/api/user/pinned-nfts', vercelToExpress(pinnedNftsModule.default));
    app.all('/api/user/xologlobe-pins', vercelToExpress(xoloGlobePinsModule.default));
    app.all(
      '/api/user/nft-resource-proxy',
      vercelToExpress(nftResourceProxyModule.default)
    );
    // PUT /api/user/wallets/disconnect - must come BEFORE :walletId pattern
    app.all(
      '/api/user/wallets/disconnect',
      vercelToExpress(walletsDisconnectModule.default)
    );
    app.all(
      '/api/user/wallets/:walletId',
      vercelToExpress(walletsIdModule.default)
    );
    // Explicit connect route (PUT /api/user/wallets/:walletId/connect)
    app.all(
      '/api/user/wallets/:walletId/connect',
      vercelToExpress(walletsIdModule.default)
    );

    console.log('Routes registered successfully');
  } catch (importError: any) {
    console.error('Failed to import handlers:', importError);
    console.error('Import error stack:', importError?.stack);
    throw importError;
  }
}

// Setup routes and start server
setupRoutes()
  .then(() => {
    const server = app.listen(PORT, () => {
      console.log(`🚀 API server running on http://localhost:${PORT}`);
      console.log(`📡 API routes:`);
      console.log(`   - GET/PUT http://localhost:${PORT}/api/user/profile`);
      console.log(`   - POST http://localhost:${PORT}/api/user/sync`);
      console.log(`   - GET/POST http://localhost:${PORT}/api/user/wallets`);
      console.log(`   - GET http://localhost:${PORT}/api/user/wallet-assets`);
      console.log(`   - GET/POST/DELETE http://localhost:${PORT}/api/user/pinned-nfts`);
      console.log(`   - GET http://localhost:${PORT}/api/user/xologlobe-pins`);
      console.log(
        `   - GET http://localhost:${PORT}/api/user/nft-resource-proxy`
      );
      console.log(
        `   - PUT/DELETE http://localhost:${PORT}/api/user/wallets/:walletId`
      );
      console.log(
        `   - PUT http://localhost:${PORT}/api/user/wallets/:walletId/connect`
      );
      console.log(
        `   - PUT http://localhost:${PORT}/api/user/wallets/disconnect`
      );
    });

    server.on('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use.`);
        console.error(
          `   Please stop the process using port ${PORT} or set API_PORT environment variable to use a different port.`
        );
        console.error(`   Example: API_PORT=3001 npm run dev:api`);
        process.exit(1);
      } else {
        console.error('Server error:', error);
        process.exit(1);
      }
    });
  })
  .catch(error => {
    console.error('Failed to setup routes:', error);
    console.error('Error details:', error);
    process.exit(1);
  });
