import { z } from 'zod';

/**
 * Zod validation schemas for the Enigma marketplace API
 * @see src/services/marketplace-service.ts
 * @see src/services/deal-service.ts
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

const SERVICE_CATEGORIES = [
  'DEFI',
  'TRADING',
  'ANALYTICS',
  'SECURITY',
  'ORACLE',
  'GOVERNANCE',
  'INFRASTRUCTURE',
  'OTHER',
] as const;

const DEAL_STATUSES = [
  'PROPOSED',
  'ACCEPTED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
  'DISPUTED',
] as const;

// ============================================
// SERVICE SCHEMAS
// ============================================

/** Schema for creating a new agent service */
export const createServiceSchema = z.object({
  agentAddress: ethAddressSchema,
  name: z
    .string()
    .min(1, 'Service name is required')
    .max(100, 'Service name must not exceed 100 characters')
    .trim(),
  description: z
    .string()
    .min(1, 'Description is required')
    .max(500, 'Description must not exceed 500 characters')
    .trim(),
  category: z.enum(SERVICE_CATEGORIES, {
    errorMap: () => ({
      message: `Category must be one of: ${SERVICE_CATEGORIES.join(', ')}`,
    }),
  }),
  priceUsd: positiveUsdSchema,
  endpoint: z.string().url('Must be a valid URL').optional(),
});

/** Schema for updating an existing service */
export const updateServiceSchema = z.object({
  id: z.string().min(1, 'Service ID is required'),
  name: z
    .string()
    .min(1, 'Service name is required')
    .max(100, 'Service name must not exceed 100 characters')
    .trim()
    .optional(),
  description: z
    .string()
    .min(1, 'Description is required')
    .max(500, 'Description must not exceed 500 characters')
    .trim()
    .optional(),
  category: z
    .enum(SERVICE_CATEGORIES, {
      errorMap: () => ({
        message: `Category must be one of: ${SERVICE_CATEGORIES.join(', ')}`,
      }),
    })
    .optional(),
  priceUsd: positiveUsdSchema.optional(),
  endpoint: z.string().url('Must be a valid URL').optional(),
});

/** Schema for listing services with filters */
export const listServicesSchema = z.object({
  category: z
    .enum(SERVICE_CATEGORIES, {
      errorMap: () => ({
        message: `Category must be one of: ${SERVICE_CATEGORIES.join(', ')}`,
      }),
    })
    .optional(),
  agentAddress: ethAddressSchema.optional(),
  isActive: z
    .union([z.boolean(), z.string().transform((val) => val === 'true')])
    .optional(),
  page: pageSchema,
  limit: limitSchema,
});

// ============================================
// DEAL SCHEMAS
// ============================================

/** Schema for creating a new deal */
export const createDealSchema = z.object({
  serviceId: z.string().min(1, 'Service ID is required'),
  buyerAddress: ethAddressSchema,
  agreedPriceUsd: positiveUsdSchema,
});

/** Schema for updating deal status */
export const updateDealStatusSchema = z.object({
  dealId: z.string().min(1, 'Deal ID is required'),
  status: z.enum(DEAL_STATUSES, {
    errorMap: () => ({
      message: `Status must be one of: ${DEAL_STATUSES.join(', ')}`,
    }),
  }),
  txHash: txHashSchema.optional(),
});

/** Schema for adding a message to a deal */
export const addMessageSchema = z.object({
  dealId: z.string().min(1, 'Deal ID is required'),
  senderAddress: ethAddressSchema,
  content: z
    .string()
    .min(1, 'Message content is required')
    .max(1000, 'Message must not exceed 1000 characters')
    .trim(),
});

/** Schema for listing deals with filters */
export const listDealsSchema = z.object({
  buyerAddress: ethAddressSchema.optional(),
  sellerAddress: ethAddressSchema.optional(),
  status: z
    .enum(DEAL_STATUSES, {
      errorMap: () => ({
        message: `Status must be one of: ${DEAL_STATUSES.join(', ')}`,
      }),
    })
    .optional(),
  page: pageSchema,
  limit: limitSchema,
});

// ============================================
// INFERRED TYPES
// ============================================

export type CreateServiceInput = z.infer<typeof createServiceSchema>;
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;
export type ListServicesInput = z.infer<typeof listServicesSchema>;
export type CreateDealInput = z.infer<typeof createDealSchema>;
export type UpdateDealStatusInput = z.infer<typeof updateDealStatusSchema>;
export type AddMessageInput = z.infer<typeof addMessageSchema>;
export type ListDealsInput = z.infer<typeof listDealsSchema>;
