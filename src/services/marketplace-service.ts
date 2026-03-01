import { Prisma } from '@prisma/client';
import type { ServiceCategory } from '@prisma/client';
import { prisma } from '@/lib/database/prisma';
import { createLogger } from '@/lib/utils/logger';
import { NotFoundError } from '@/lib/utils/errors';

const logger = createLogger('marketplace-service');

// ============================================
// TYPES
// ============================================

export interface ListServicesFilters {
  category?: ServiceCategory;
  agentAddress?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export interface CreateServiceInput {
  agentAddress: string;
  name: string;
  description: string;
  category: ServiceCategory;
  priceUsd: string;
  endpoint?: string;
}

export interface ServiceStats {
  total: number;
  byCategory: Record<string, number>;
  avgPrice: number;
}

// ============================================
// SERVICE FUNCTIONS
// ============================================

/**
 * List services with optional filters and pagination
 */
export async function listServices(filters: ListServicesFilters = {}) {
  const { category, agentAddress, isActive, page = 1, limit = 20 } = filters;
  const skip = (page - 1) * limit;

  const where: Prisma.AgentServiceWhereInput = {};

  if (category) where.category = category;
  if (agentAddress) where.agentAddress = agentAddress.toLowerCase();
  if (typeof isActive === 'boolean') where.isActive = isActive;

  const [data, total] = await Promise.all([
    prisma.agentService.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.agentService.count({ where }),
  ]);

  logger.debug({ total, page, limit, filters }, 'Listed services');

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
 * Get a single service by ID
 */
export async function getServiceById(id: string) {
  const service = await prisma.agentService.findUnique({
    where: { id },
  });

  if (!service) {
    throw new NotFoundError(`Service not found: ${id}`);
  }

  logger.debug({ id }, 'Fetched service');
  return service;
}

/**
 * Create a new agent service listing
 */
export async function createService(params: CreateServiceInput) {
  const service = await prisma.agentService.create({
    data: {
      agentAddress: params.agentAddress.toLowerCase(),
      name: params.name,
      description: params.description,
      category: params.category,
      priceUsd: new Prisma.Decimal(params.priceUsd),
      endpoint: params.endpoint ?? null,
      isActive: true,
    },
  });

  logger.info(
    { id: service.id, agentAddress: service.agentAddress, category: service.category },
    'Created service',
  );

  return service;
}

/**
 * Update an existing service
 */
export async function updateService(
  id: string,
  updates: Partial<Omit<CreateServiceInput, 'agentAddress'>>,
) {
  // Verify the service exists first
  await getServiceById(id);

  const data: Prisma.AgentServiceUpdateInput = {};

  if (updates.name !== undefined) data.name = updates.name;
  if (updates.description !== undefined) data.description = updates.description;
  if (updates.category !== undefined) data.category = updates.category;
  if (updates.priceUsd !== undefined) data.priceUsd = new Prisma.Decimal(updates.priceUsd);
  if (updates.endpoint !== undefined) data.endpoint = updates.endpoint;

  const service = await prisma.agentService.update({
    where: { id },
    data,
  });

  logger.info({ id }, 'Updated service');
  return service;
}

/**
 * Deactivate a service (soft delete)
 */
export async function deactivateService(id: string) {
  // Verify the service exists first
  await getServiceById(id);

  const service = await prisma.agentService.update({
    where: { id },
    data: { isActive: false },
  });

  logger.info({ id }, 'Deactivated service');
  return service;
}

/**
 * Get aggregate statistics for all services
 */
export async function getServiceStats(): Promise<ServiceStats> {
  const [total, byCategory, priceAgg] = await Promise.all([
    prisma.agentService.count(),
    prisma.agentService.groupBy({
      by: ['category'],
      _count: { id: true },
    }),
    prisma.agentService.aggregate({
      _avg: { priceUsd: true },
    }),
  ]);

  const byCategoryMap: Record<string, number> = {};
  for (const entry of byCategory) {
    byCategoryMap[entry.category] = entry._count.id;
  }

  const stats: ServiceStats = {
    total,
    byCategory: byCategoryMap,
    avgPrice: priceAgg._avg.priceUsd?.toNumber() ?? 0,
  };

  logger.debug(stats, 'Computed service stats');
  return stats;
}
