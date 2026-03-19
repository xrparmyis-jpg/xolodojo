import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
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
    req: Request,
    res: Response,
    next: NextFunction
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
type VercelHandler = (req: VercelRequest, res: VercelResponse) => unknown | Promise<unknown>;

function vercelToExpress(vercelHandler: VercelHandler) {
  return async (req: Request, res: Response) => {
    const vercelReq = {
      method: req.method,
      url: req.url,
      headers: req.headers as Record<string, string | string[] | undefined>,
      query: req.query as Record<string, string | string[] | undefined>,
      body: req.body,
    } as VercelRequest;

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
      await Promise.resolve(vercelHandler(vercelReq, vercelRes));
    } catch (error: any) {
      console.error('Handler error:', error);
      if (!res.headersSent) {
        res.status(500).json({
          error: 'Internal server error',
          details: error?.message || String(error),
          stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined,
        });
      }
    }
  };
}

// Dynamically import handlers and register routes
async function setupRoutes() {
  try {
    const [
      profileModule,
      syncModule,
      walletsModule,
      walletAssetsModule,
      pinnedNftsModule,
      xoloGlobePinsModule,
      nftResourceProxyModule,
      walletsIdModule,
      walletsDisconnectModule,
      xamanSigninModule,
    ] = await Promise.all([
      import('./api/user/profile'),
      import('./api/user/sync'),
      import('./api/user/wallets'),
      import('./api/user/wallet-assets'),
      import('./api/user/pinned-nfts'),
      import('./api/user/xologlobe-pins'),
      import('./api/user/nft-resource-proxy'),
      import('./api/user/wallets/[walletId]'),
      import('./api/user/wallets/disconnect'),
      import('./api/user/xaman-signin'),
    ]);

    // API Routes (specific routes BEFORE parameterized patterns)
    app.all('/api/user/profile', vercelToExpress(profileModule.default));
    app.all('/api/user/sync', vercelToExpress(syncModule.default));
    app.all('/api/user/wallets', vercelToExpress(walletsModule.default));
    app.all('/api/user/wallet-assets', vercelToExpress(walletAssetsModule.default));
    app.all('/api/user/pinned-nfts', vercelToExpress(pinnedNftsModule.default));
    app.all('/api/user/xologlobe-pins', vercelToExpress(xoloGlobePinsModule.default));
    app.all('/api/user/nft-resource-proxy', vercelToExpress(nftResourceProxyModule.default));
    app.all('/api/user/xaman-signin', vercelToExpress(xamanSigninModule.default));
    app.all('/api/user/wallets/disconnect', vercelToExpress(walletsDisconnectModule.default));
    app.all('/api/user/wallets/:walletId/connect', vercelToExpress(walletsIdModule.default));
    app.all('/api/user/wallets/:walletId', vercelToExpress(walletsIdModule.default));

    console.log('Routes registered successfully');
  } catch (importError: any) {
    console.error('Failed to import handlers:', importError);
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
      console.log(`   - GET http://localhost:${PORT}/api/user/nft-resource-proxy`);
      console.log(`   - PUT/DELETE http://localhost:${PORT}/api/user/wallets/:walletId`);
      console.log(`   - PUT http://localhost:${PORT}/api/user/wallets/:walletId/connect`);
      console.log(`   - PUT http://localhost:${PORT}/api/user/wallets/disconnect`);
      console.log(`   - POST http://localhost:${PORT}/api/user/xaman-signin`);
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
    process.exit(1);
  });