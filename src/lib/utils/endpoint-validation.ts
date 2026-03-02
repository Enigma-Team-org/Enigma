import { z } from 'zod';

/**
 * Zod validation schemas for the GDP Engine Phase 1 API
 * @see src/services/endpoint-service.ts
 */

// ============================================
// REUSABLE SCHEMAS
// ============================================

/** Ethereum address: 0x + 40 hex chars, lowercased on output */
const ethAddressSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{40}$/, {
    message: 'Invalid Ethereum address format. Must be 0x followed by 40 hex characters',
  })
  .transform((val) => val.toLowerCase());

/** Positive numeric string (for Decimal USD amounts) */
const positiveUsdSchema = z
  .string()
  .regex(/^\d+(\.\d+)?$/, { message: 'Must be a numeric string' })
  .refine((val) => parseFloat(val) > 0, { message: 'Amount must be greater than 0' });

/** Tx hash: 0x + 64 hex chars */
const txHashSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{64}$/, {
    message: 'Invalid transaction hash. Must be 0x followed by 64 hex characters',
  });

/** Pagination: page number >= 1 */
const pageSchema = z.coerce.number().int().min(1).optional().default(1);

/** Pagination: limit 1-100 */
const limitSchema = z.coerce.number().int().min(1).max(100).optional().default(20);

// ============================================
// ENUM VALUES
// ============================================

const ENDPOINT_TYPES = ['A2A', 'MCP', 'REST', 'X402'] as const;

const AGENT_TX_STATUSES = ['PENDING', 'COMPLETED', 'FAILED'] as const;

// ============================================
// ENDPOINT SCHEMAS
// ============================================

/** Schema for registering a new agent endpoint */
export const registerEndpointSchema = z.object({
  agentAddress: ethAddressSchema,
  type: z.enum(ENDPOINT_TYPES, {
    errorMap: () => ({
      message: `Endpoint type must be one of: ${ENDPOINT_TYPES.join(', ')}`,
    }),
  }),
  url: z.string().url('Must be a valid URL'),
  capabilities: z
    .array(z.string().min(1).max(50))
    .min(1, 'At least one capability is required')
    .max(20, 'Maximum 20 capabilities allowed'),
  pricePerCall: positiveUsdSchema,
  paymentToken: z.string().max(10).optional().default('USDC'),
});

/** Schema for discovering endpoints with filters */
export const discoverEndpointsSchema = z.object({
  capability: z.string().min(1).max(50).optional(),
  maxPrice: z
    .string()
    .regex(/^\d+(\.\d+)?$/, { message: 'Must be a numeric string' })
    .optional(),
  minTrust: z.coerce.number().int().min(0).max(100).optional(),
  type: z
    .enum(ENDPOINT_TYPES, {
      errorMap: () => ({
        message: `Endpoint type must be one of: ${ENDPOINT_TYPES.join(', ')}`,
      }),
    })
    .optional(),
  page: pageSchema,
  limit: limitSchema,
});

/** Schema for updating an existing endpoint */
export const updateEndpointSchema = z.object({
  url: z.string().url('Must be a valid URL').optional(),
  capabilities: z
    .array(z.string().min(1).max(50))
    .min(1)
    .max(20)
    .optional(),
  pricePerCall: positiveUsdSchema.optional(),
  paymentToken: z.string().max(10).optional(),
  isActive: z.boolean().optional(),
});

// ============================================
// TRANSACTION SCHEMAS
// ============================================

/** Schema for recording an agent-to-agent transaction */
export const recordTransactionSchema = z.object({
  fromAgentAddress: ethAddressSchema,
  toAgentAddress: ethAddressSchema,
  endpointId: z.string().min(1, 'Endpoint ID is required'),
  amount: positiveUsdSchema,
  token: z.string().max(10).optional().default('USDC'),
  txHash: txHashSchema.optional(),
  x402Header: z.string().optional(),
  responseTimeMs: z.number().int().min(0).optional(),
});

/** Schema for listing transactions with filters */
export const listTransactionsSchema = z.object({
  fromAgentAddress: ethAddressSchema.optional(),
  toAgentAddress: ethAddressSchema.optional(),
  status: z
    .enum(AGENT_TX_STATUSES, {
      errorMap: () => ({
        message: `Status must be one of: ${AGENT_TX_STATUSES.join(', ')}`,
      }),
    })
    .optional(),
  page: pageSchema,
  limit: limitSchema,
});

// ============================================
// INFERRED TYPES
// ============================================

export type RegisterEndpointInput = z.infer<typeof registerEndpointSchema>;
export type DiscoverEndpointsInput = z.infer<typeof discoverEndpointsSchema>;
export type UpdateEndpointInput = z.infer<typeof updateEndpointSchema>;
export type RecordTransactionInput = z.infer<typeof recordTransactionSchema>;
export type ListTransactionsInput = z.infer<typeof listTransactionsSchema>;
