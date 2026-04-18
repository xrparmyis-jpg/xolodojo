import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const serverDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(serverDir, '..');
dotenv.config({ path: path.join(projectRoot, '.env') });
dotenv.config({ path: path.join(projectRoot, '.env.local'), override: true });

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
      json: (data: unknown) => {
        res.json(data);
        return vercelRes;
      },
      send: (data: unknown) => {
        res.send(data);
        return vercelRes;
      },
      setHeader: (name: string, value: string) => {
        res.setHeader(name, value);
        return vercelRes;
      },
      end: (chunk?: unknown) => {
        res.end(chunk as string | Uint8Array | undefined);
        return vercelRes;
      },
    } as VercelResponse;

    try {
      await Promise.resolve(vercelHandler(vercelReq, vercelRes));
    } catch (error: unknown) {
      console.error('Handler error:', error);
      if (!res.headersSent) {
        const err = error as { message?: string; stack?: string };
        res.status(500).json({
          error: 'Internal server error',
          details: err?.message || String(error),
          stack: process.env.NODE_ENV === 'development' ? err?.stack : undefined,
        });
      }
    }
  };
}

export async function createApiApp(): Promise<express.Express> {
  const app = express();

  app.use(
    cors({
      origin: true,
      credentials: true,
    })
  );
  app.use(express.json());

  const [
    profileModule,
    walletsModule,
    walletAssetsModule,
    pinnedNftsModule,
    xoloGlobePinsModule,
    nftResourceProxyModule,
    walletsIdModule,
    walletsDisconnectModule,
    authLoginModule,
    authLogoutModule,
    authMeModule,
    authRegisterModule,
    authVerifyEmailModule,
    authForgotPasswordModule,
    authForgotUsernameModule,
    authResetPasswordModule,
    authResendVerificationModule,
    authWalletLoginModule,
  ] = await Promise.all([
    import('./handlers/user/profile.js'),
    import('./handlers/user/wallets.js'),
    import('./handlers/user/wallet-assets.js'),
    import('./handlers/user/pinned-nfts.js'),
    import('./handlers/user/xologlobe-pins.js'),
    import('./handlers/user/nft-resource-proxy.js'),
    import('./handlers/user/wallets/[walletId].js'),
    import('./handlers/user/wallets/disconnect.js'),
    import('./handlers/auth/login.js'),
    import('./handlers/auth/logout.js'),
    import('./handlers/auth/me.js'),
    import('./handlers/auth/register.js'),
    import('./handlers/auth/verify-email.js'),
    import('./handlers/auth/forgot-password.js'),
    import('./handlers/auth/forgot-username.js'),
    import('./handlers/auth/reset-password.js'),
    import('./handlers/auth/resend-verification.js'),
    import('./handlers/auth/wallet-login.js'),
  ]);

  app.all('/api/auth/login', vercelToExpress(authLoginModule.default));
  app.all('/api/auth/logout', vercelToExpress(authLogoutModule.default));
  app.all('/api/auth/me', vercelToExpress(authMeModule.default));
  app.all('/api/auth/wallet-login', vercelToExpress(authWalletLoginModule.default));
  app.all('/api/auth/register', vercelToExpress(authRegisterModule.default));
  app.all('/api/auth/verify-email', vercelToExpress(authVerifyEmailModule.default));
  app.all('/api/auth/forgot-password', vercelToExpress(authForgotPasswordModule.default));
  app.all('/api/auth/forgot-username', vercelToExpress(authForgotUsernameModule.default));
  app.all('/api/auth/reset-password', vercelToExpress(authResetPasswordModule.default));
  app.all('/api/auth/resend-verification', vercelToExpress(authResendVerificationModule.default));

  app.all('/api/user/profile', vercelToExpress(profileModule.default));
  app.all('/api/user/wallets', vercelToExpress(walletsModule.default));
  app.all('/api/user/wallet-assets', vercelToExpress(walletAssetsModule.default));
  app.all('/api/user/pinned-nfts', vercelToExpress(pinnedNftsModule.default));
  app.all('/api/user/xologlobe-pins', vercelToExpress(xoloGlobePinsModule.default));
  app.all('/api/user/nft-resource-proxy', vercelToExpress(nftResourceProxyModule.default));
  app.all('/api/user/wallets/disconnect', vercelToExpress(walletsDisconnectModule.default));
  app.all('/api/user/wallets/:walletId/connect', vercelToExpress(walletsIdModule.default));
  app.all('/api/user/wallets/:walletId', vercelToExpress(walletsIdModule.default));

  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Express error middleware:', err);
    if (!res.headersSent) {
      const e = err as { message?: string; stack?: string };
      res.status(500).json({
        error: 'Internal server error',
        details: e?.message || String(err),
        stack: process.env.NODE_ENV === 'development' ? e?.stack : undefined,
      });
    }
  });

  return app;
}
