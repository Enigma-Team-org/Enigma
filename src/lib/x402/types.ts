import type { PaymentType, PaymentStatus } from '@prisma/client';

/**
 * Supported tokens for x402 payments
 */
export type SupportedToken = 'USDC' | 'EURC' | 'PYUSD' | 'USDT' | 'AVAX';

/**
 * Supported chains for x402 payments
 */
export interface PaymentChain {
  id: number;
  name: string;
  caip2: string;
  native: string;
}

/**
 * Payment service pricing
 */
export interface ServicePrice {
  type: PaymentType;
  label: string;
  priceUsd: string;
  description: string;
}

/**
 * Token config for UI display
 */
export interface TokenInfo {
  symbol: SupportedToken;
  name: string;
  decimals: number;
  addresses: Record<number, `0x${string}`>;
  logo: string;
}

/**
 * Payment intent (created before payment)
 */
export interface PaymentIntent {
  id: string;
  type: PaymentType;
  amountUsd: string;
  agentAddress?: string;
  resource: string;
}

/**
 * Payment verification result
 */
export interface PaymentVerification {
  paymentId: string;
  status: PaymentStatus;
  txHash?: string;
  payer?: string;
}

/**
 * Payment record (from DB)
 */
export interface PaymentRecord {
  id: string;
  payerAddress: string;
  type: PaymentType;
  amountUsd: string;
  tokenAddress: string;
  chainId: number;
  txHash: string | null;
  status: PaymentStatus;
  agentAddress: string | null;
  createdAt: string;
  completedAt: string | null;
}
