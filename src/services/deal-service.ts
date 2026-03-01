import { Prisma } from '@prisma/client';
import type { DealStatus } from '@prisma/client';
import { prisma } from '@/lib/database/prisma';
import { createLogger } from '@/lib/utils/logger';
import { NotFoundError } from '@/lib/utils/errors';

const logger = createLogger('deal-service');

// ============================================
// TYPES
// ============================================

export interface CreateDealInput {
  serviceId: string;
  buyerAddress: string;
  agreedPriceUsd: string;
}

export interface ListDealsFilters {
  buyerAddress?: string;
  sellerAddress?: string;
  status?: DealStatus;
  page?: number;
  limit?: number;
}

export interface AddMessageInput {
  dealId: string;
  senderAddress: string;
  content: string;
}

export interface DealStats {
  total: number;
  byStatus: Record<string, number>;
  totalVolumeUsd: number;
}

// ============================================
// DEAL FUNCTIONS
// ============================================

/**
 * Create a new deal proposal for a service.
 * Looks up the seller address from the service's agentAddress.
 */
export async function createDeal(params: CreateDealInput) {
  const service = await prisma.agentService.findUnique({
    where: { id: params.serviceId },
  });

  if (!service) {
    throw new NotFoundError(`Service not found: ${params.serviceId}`);
  }

  if (!service.isActive) {
    throw new NotFoundError(`Service is not active: ${params.serviceId}`);
  }

  const deal = await prisma.deal.create({
    data: {
      serviceId: params.serviceId,
      buyerAddress: params.buyerAddress.toLowerCase(),
      sellerAddress: service.agentAddress.toLowerCase(),
      status: 'PROPOSED' as DealStatus,
      agreedPriceUsd: new Prisma.Decimal(params.agreedPriceUsd),
    },
  });

  logger.info(
    {
      id: deal.id,
      serviceId: deal.serviceId,
      buyerAddress: deal.buyerAddress,
      sellerAddress: deal.sellerAddress,
    },
    'Created deal',
  );

  return deal;
}

/**
 * Get a single deal by ID with its service and messages
 */
export async function getDealById(id: string) {
  const deal = await prisma.deal.findUnique({
    where: { id },
    include: {
      service: true,
      messages: {
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!deal) {
    throw new NotFoundError(`Deal not found: ${id}`);
  }

  logger.debug({ id }, 'Fetched deal');
  return deal;
}

/**
 * List deals with optional filters and pagination
 */
export async function listDeals(filters: ListDealsFilters = {}) {
  const { buyerAddress, sellerAddress, status, page = 1, limit = 20 } = filters;
  const skip = (page - 1) * limit;

  const where: Prisma.DealWhereInput = {};

  if (buyerAddress) where.buyerAddress = buyerAddress.toLowerCase();
  if (sellerAddress) where.sellerAddress = sellerAddress.toLowerCase();
  if (status) where.status = status;

  const [data, total] = await Promise.all([
    prisma.deal.findMany({
      where,
      skip,
      take: limit,
      include: { service: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.deal.count({ where }),
  ]);

  logger.debug({ total, page, limit, filters }, 'Listed deals');

  return {
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Update deal status with optional transaction hash.
 * When status is COMPLETED, sets completedAt and completionTxHash.
 */
export async function updateDealStatus(id: string, status: DealStatus, txHash?: string) {
  // Verify deal exists
  await getDealById(id);

  const data: Prisma.DealUpdateInput = { status };

  if (status === 'COMPLETED') {
    data.completedAt = new Date();
    if (txHash) data.completionTxHash = txHash;
  }

  if (txHash && status !== 'COMPLETED') {
    data.escrowTxHash = txHash;
  }

  const deal = await prisma.deal.update({
    where: { id },
    data,
  });

  logger.info({ id, status, txHash }, 'Updated deal status');
  return deal;
}

/**
 * Add a message to a deal thread
 */
export async function addMessage(params: AddMessageInput) {
  // Verify deal exists
  const deal = await prisma.deal.findUnique({ where: { id: params.dealId } });
  if (!deal) {
    throw new NotFoundError(`Deal not found: ${params.dealId}`);
  }

  const message = await prisma.dealMessage.create({
    data: {
      dealId: params.dealId,
      senderAddress: params.senderAddress.toLowerCase(),
      content: params.content,
    },
  });

  logger.info({ dealId: params.dealId, messageId: message.id }, 'Added deal message');
  return message;
}

/**
 * Get paginated messages for a deal, ordered by createdAt ascending
 */
export async function getMessages(
  dealId: string,
  options: { page?: number; limit?: number } = {},
) {
  const { page = 1, limit = 50 } = options;
  const skip = (page - 1) * limit;

  // Verify deal exists
  const deal = await prisma.deal.findUnique({ where: { id: dealId } });
  if (!deal) {
    throw new NotFoundError(`Deal not found: ${dealId}`);
  }

  const [data, total] = await Promise.all([
    prisma.dealMessage.findMany({
      where: { dealId },
      skip,
      take: limit,
      orderBy: { createdAt: 'asc' },
    }),
    prisma.dealMessage.count({ where: { dealId } }),
  ]);

  logger.debug({ dealId, total, page, limit }, 'Fetched deal messages');

  return {
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get aggregate statistics for all deals
 */
export async function getDealStats(): Promise<DealStats> {
  const [total, byStatus, volumeAgg] = await Promise.all([
    prisma.deal.count(),
    prisma.deal.groupBy({
      by: ['status'],
      _count: { id: true },
    }),
    prisma.deal.aggregate({
      _sum: { agreedPriceUsd: true },
    }),
  ]);

  const byStatusMap: Record<string, number> = {};
  for (const entry of byStatus) {
    byStatusMap[entry.status] = entry._count.id;
  }

  const stats: DealStats = {
    total,
    byStatus: byStatusMap,
    totalVolumeUsd: volumeAgg._sum.agreedPriceUsd?.toNumber() ?? 0,
  };

  logger.debug(stats, 'Computed deal stats');
  return stats;
}
