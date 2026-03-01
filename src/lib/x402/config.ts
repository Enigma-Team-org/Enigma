import type { ServicePrice, TokenInfo, PaymentChain } from './types';

/**
 * Ultravioleta DAO Facilitator URL
 */
export const FACILITATOR_URL =
  process.env.NEXT_PUBLIC_FACILITATOR_URL || 'https://facilitator.ultravioletadao.xyz';

/**
 * Treasury address — recipient of all x402 payments
 */
export const TREASURY_ADDRESS = (process.env.NEXT_PUBLIC_TREASURY_ADDRESS ||
  '0xcd595a299ad1d5D088B7764e9330f7B0be7ca983') as `0x${string}`;

/**
 * Payment validity duration (24 hours in milliseconds)
 */
export const PAYMENT_VALIDITY_MS = 24 * 60 * 60 * 1000;

/**
 * Supported payment chains (MVP: Avalanche + Base)
 */
export const PAYMENT_CHAINS: PaymentChain[] = [
  { id: 43114, name: 'Avalanche', caip2: 'eip155:43114', native: 'AVAX' },
  { id: 8453, name: 'Base', caip2: 'eip155:8453', native: 'ETH' },
];

/**
 * Supported tokens with addresses per chain
 */
export const SUPPORTED_TOKENS: TokenInfo[] = [
  {
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    addresses: {
      43114: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',
      8453: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    },
    logo: '/tokens/usdc.svg',
  },
  {
    symbol: 'EURC',
    name: 'Euro Coin',
    decimals: 6,
    addresses: {
      43114: '0xC891EB4cbdEFf6e073e859e987815Ed1505c2ACD',
      8453: '0x60a3E35Cc302bFA44Cb288Bc5a4F316Fdb1adb42',
    },
    logo: '/tokens/eurc.svg',
  },
];

/**
 * Service pricing configuration
 */
export const SERVICE_PRICES: ServicePrice[] = [
  {
    type: 'TRUST_SCORE_QUERY',
    label: 'Trust Score Query',
    priceUsd: '0.01',
    description: 'Basic trust score lookup for any agent',
  },
  {
    type: 'SENTINEL_VALIDATION',
    label: 'Sentinel Validation',
    priceUsd: '0.05',
    description: 'Full 27-check Sentinel validation',
  },
  {
    type: 'DEEP_ANALYSIS',
    label: 'Deep Analysis Report',
    priceUsd: '0.50',
    description: 'Complete TRACER + Sentinel analysis with all dimensions',
  },
  {
    type: 'MARKETPLACE_FEE',
    label: 'Marketplace Fee',
    priceUsd: '0.00',
    description: 'Variable fee for marketplace transactions (1-2%)',
  },
];

/**
 * Get price for a payment type
 */
export function getServicePrice(type: string): string {
  const price = SERVICE_PRICES.find((p) => p.type === type);
  return price?.priceUsd ?? '0.00';
}

/**
 * Get token address for a chain
 */
export function getTokenAddress(
  symbol: string,
  chainId: number
): `0x${string}` | undefined {
  const token = SUPPORTED_TOKENS.find((t) => t.symbol === symbol);
  return token?.addresses[chainId];
}

/**
 * Convert USD amount to token atomic units (6 decimals for stablecoins)
 */
export function usdToAtomicUnits(amountUsd: string, decimals = 6): string {
  const amount = parseFloat(amountUsd);
  return Math.round(amount * 10 ** decimals).toString();
}
