import { createConfig, http } from 'wagmi';
import { injected, walletConnect } from 'wagmi/connectors';
import { avalanche, avalancheFuji } from './config';

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '';
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://enigma-scanner.vercel.app';

/**
 * Wagmi configuration for Enigma
 * Supports Avalanche mainnet and Fuji testnet
 */
export const wagmiConfig = createConfig({
  chains: [avalanche, avalancheFuji],
  connectors: projectId
    ? [
        injected(),
        walletConnect({
          projectId,
          metadata: {
            name: 'Enigma Platform',
            description: 'Trust Score Platform for Autonomous Agents on Avalanche',
            url: siteUrl,
            icons: [`${siteUrl}/logo.png`],
          },
          showQrModal: true,
        }),
      ]
    : [injected()],
  transports: {
    [avalanche.id]: http(),
    [avalancheFuji.id]: http(),
  },
  ssr: true,
});

/**
 * Export chain configurations for convenience
 */
export { avalanche, avalancheFuji };

/**
 * Default chain (Fuji for development)
 */
export const defaultChain =
  process.env.NEXT_PUBLIC_CHAIN_ENV === 'mainnet' ? avalanche : avalancheFuji;
