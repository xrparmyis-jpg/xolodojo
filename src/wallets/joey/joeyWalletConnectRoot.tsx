import { useMemo, type ReactNode } from 'react';
import { standalone as joeyStandalone } from '@joey-wallet/wc-client/react';
import { walletConnectProjectId } from '../../web3modal';

const JoeyProvider = joeyStandalone.provider.Provider;

const joeyProjectId = (
  import.meta.env.VITE_JOEY_PROJECT_ID ||
  walletConnectProjectId ||
  '717dec7dead15d3a101d504ed3933709'
).trim();

export function JoeyWalletConnectRootProvider({ children }: { children: ReactNode }) {
  const appUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
  const config = useMemo(
    () => ({
      projectId: joeyProjectId,
      defaultChain: 'xrpl:0' as const,
      metadata: {
        name: 'Donovan',
        description: 'Donovan Joey wallet connection',
        url: appUrl,
        icons: [`${appUrl}/favicon.ico`],
        redirect: {
          universal: appUrl,
        },
      },
    }),
    [appUrl]
  );

  return <JoeyProvider config={config}>{children}</JoeyProvider>;
}
