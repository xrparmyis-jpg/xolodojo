import { useEffect, useMemo, type ReactNode } from 'react';
import { standalone as joeyStandalone } from '@joey-wallet/wc-client/react';
import { walletConnectProjectId } from '../../web3modal';

const JoeyProvider = joeyStandalone.provider.Provider;

const FALLBACK_JOEY_PROJECT_ID = '717dec7dead15d3a101d504ed3933709';

const joeyProjectId = (
  import.meta.env.VITE_JOEY_PROJECT_ID ||
  walletConnectProjectId ||
  FALLBACK_JOEY_PROJECT_ID
).trim();

const usingFallbackJoeyProjectId =
  !String(import.meta.env.VITE_JOEY_PROJECT_ID || '').trim() &&
  !String(walletConnectProjectId || '').trim();

export function JoeyWalletConnectRootProvider({ children }: { children: ReactNode }) {
  const appUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
  const config = useMemo(
    () => ({
      projectId: joeyProjectId,
      defaultChain: 'xrpl:0' as const,
      metadata: {
        name: 'XoloDojo',
        description: 'XoloDojo Joey wallet connection',
        url: appUrl,
        icons: [`${appUrl}/favicon.svg`],
        redirect: {
          universal: appUrl,
        },
      },
    }),
    [appUrl]
  );

  useEffect(() => {
    if (usingFallbackJoeyProjectId && import.meta.env.PROD) {
      console.warn(
        '[JoeyWallet] VITE_JOEY_PROJECT_ID / VITE_WALLETCONNECT_PROJECT_ID missing at build time; using fallback project ID. Set them in Vercel Production env and redeploy.'
      );
    }
  }, []);

  return <JoeyProvider config={config}>{children}</JoeyProvider>;
}
