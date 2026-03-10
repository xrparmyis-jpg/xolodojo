import { createWeb3Modal, defaultWagmiConfig } from '@web3modal/wagmi/react';
import { mainnet, polygon, arbitrum, optimism, base } from 'wagmi/chains';
import type { Chain } from 'viem';

export const walletConnectProjectId =
  import.meta.env.VITE_WALLETCONNECT_PROJECT_ID ||
  import.meta.env.VITE_WEB3MODAL_PROJECT_ID ||
  import.meta.env.VITE_PROJECT_ID ||
  '';

const parseWalletIds = (rawValue?: string) =>
  (rawValue || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const parseChainIds = (rawValue?: string) =>
  (rawValue || '')
    .split(',')
    .map((item) => Number(item.trim()))
    .filter((value) => Number.isInteger(value) && value > 0);

const includeWalletIds = parseWalletIds(import.meta.env.VITE_WC_INCLUDE_WALLET_IDS);
const featuredWalletIds = parseWalletIds(import.meta.env.VITE_WC_FEATURED_WALLET_IDS);
const excludeWalletIds = parseWalletIds(import.meta.env.VITE_WC_EXCLUDE_WALLET_IDS);
const showAllWallets = import.meta.env.VITE_WC_SHOW_ALL_WALLETS !== 'false';

const supportedChainsById = new Map<number, Chain>([
  [mainnet.id, mainnet],
  [polygon.id, polygon],
  [arbitrum.id, arbitrum],
  [optimism.id, optimism],
  [base.id, base],
]);

const configuredWalletConnectChainIds = parseChainIds(import.meta.env.VITE_WC_CHAIN_IDS);
const configuredWalletConnectChains = configuredWalletConnectChainIds
  .map((chainId) => supportedChainsById.get(chainId))
  .filter((chain): chain is Chain => Boolean(chain));

const appUrl =
  import.meta.env.VITE_APP_URL ||
  (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173');

const metadata = {
  name: 'Donovan',
  description: 'Donovan wallet connection',
  url: appUrl,
  icons: [`${appUrl}/favicon.ico`],
};

const chains: [Chain, ...Chain[]] = configuredWalletConnectChains.length > 0
  ? [configuredWalletConnectChains[0], ...configuredWalletConnectChains.slice(1)]
  : [mainnet];

export const wagmiConfig = defaultWagmiConfig({
  chains,
  projectId: walletConnectProjectId || 'missing_project_id',
  metadata,
  auth: {
    email: false,
    socials: [],
    showWallets: false,
    walletFeatures: false,
  },
  enableWalletConnect: true,
  enableInjected: true,
  enableEIP6963: true,
  enableCoinbase: true,
});

createWeb3Modal({
  wagmiConfig,
  projectId: walletConnectProjectId || 'missing_project_id',
  enableAnalytics: false,
  allWallets: showAllWallets ? 'SHOW' : 'HIDE',
  includeWalletIds,
  featuredWalletIds,
  excludeWalletIds,
});
