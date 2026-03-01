import { z } from 'zod';

const ethereumAddress = z
  .string()
  .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address');

const txHash = z
  .string()
  .regex(/^0x[a-fA-F0-9]{64}$/, 'Invalid transaction hash');

/**
 * Schema for POST /api/v1/payments/create
 */
export const createPaymentSchema = z.object({
  payerAddress: ethereumAddress,
  type: z.enum(['TRUST_SCORE_QUERY', 'SENTINEL_VALIDATION', 'DEEP_ANALYSIS', 'MARKETPLACE_FEE']),
  tokenAddress: ethereumAddress,
  tokenSymbol: z.enum(['USDC', 'EURC']).default('USDC'),
  chainId: z.number().int().positive(),
  agentAddress: ethereumAddress.optional(),
});

/**
 * Schema for POST /api/v1/payments/verify
 */
export const verifyPaymentSchema = z.object({
  paymentId: z.string().min(1),
  txHash,
});

/**
 * Schema for GET /api/v1/payments/history query params
 */
export const paymentHistorySchema = z.object({
  address: ethereumAddress,
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
