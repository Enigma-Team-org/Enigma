import { Prisma } from '@prisma/client';
import type { EndpointType, AgentTransactionStatus } from '@prisma/client';
import { prisma } from '@/lib/database/prisma';
import { createLogger } from '@/lib/utils/logger';
import { NotFoundError } from '@/lib/utils/errors';

const logger = createLogger('endpoint-service');

// ============================================
// TYPES
// ============================================

export interface RegisterEndpointInput {
  agentAddress: string;
  type: EndpointType;
  url: string;
  capabilities: string[];
  pricePerCall: string;
  paymentToken?: string;
}

export interface DiscoverEndpointsFilters {
  capability?: string;
  maxPrice?: string;
  minTrust?: number;
  type?: EndpointType;
  page?: number;
  limit?: number;
}

export interface UpdateEndpointInput {
  url?: string;
  capabilities?: string[];
  pricePerCall?: string;
  paymentToken?: string;
  isActive?: boolean;
}

export interface RecordTransactionInput {
  fromAgentAddress: string;
  toAgentAddress: string;
  endpointId: string;
  amount: string;
  token?: string;
  txHash?: string;
  x402Header?: string;
  responseTimeMs?: number;
}

export interface ListTransactionsFilters {
  fromAgentAddress?: string;
  toAgentAddress?: string;
  status?: AgentTransactionStatus;
  page?: number;
  limit?: number;
}

// ============================================
// ENDPOINT FUNCTIONS
// ============================================

/**
 * Register a new endpoint for an agent.
 * Validates agent exists in DB before creating.
 */
export async function registerEndpoint(input: RegisterEndpointInput) {
  const agent = await prisma.agent.findUnique({
    where: { address: input.agentAddress.toLowerCase() },
  });

  if (!agent) {
    throw new NotFoundError(`Agent not found: ${input.agentAddress}`);
  }

  const endpoint = await prisma.agentEndpoint.create({
    data: {
      agentAddress: input.agentAddress.toLowerCase(),
      type: input.type,
      url: input.url,
      capabilities: input.capabilities,
      pricePerCall: new Prisma.Decimal(input.pricePerCall),
      paymentToken: input.paymentToken ?? 'USDC',
    },
  });

  logger.info(
    { id: endpoint.id, agentAddress: endpoint.agentAddress, type: endpoint.type, url: endpoint.url },
    'Registered endpoint',
  );

  return endpoint;
}

/**
 * Discover agents + endpoints matching criteria.
 * Returns flat list of { agent, endpoint } pairs for A2A consumption.
 */
export async function discoverEndpoints(filters: DiscoverEndpointsFilters = {}) {
  const { capability, maxPrice, minTrust, type, page = 1, limit = 20 } = filters;
  const skip = (page - 1) * limit;

  const where: Prisma.AgentEndpointWhereInput = {
    isActive: true,
  };

  if (type) where.type = type;
  if (capability) where.capabilities = { has: capability };
  if (maxPrice) where.pricePerCall = { lte: new Prisma.Decimal(maxPrice) };
  if (minTrust) {
    where.agent = { trust_score: { gte: minTrust } };
  }

  const [endpoints, total] = await Promise.all([
    prisma.agentEndpoint.findMany({
      where,
      skip,
      take: limit,
      include: {
        agent: {
          select: {
            address: true,
            name: true,
            trust_score: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.agentEndpoint.count({ where }),
  ]);

  const data = endpoints.map((ep) => ({
    agent: {
      address: ep.agent.address,
      name: ep.agent.name,
      trustScore: ep.agent.trust_score,
      status: ep.agent.status,
    },
    endpoint: {
      id: ep.id,
      type: ep.type,
      url: ep.url,
      capabilities: ep.capabilities,
      pricePerCall: ep.pricePerCall.toString(),
      paymentToken: ep.paymentToken,
      isActive: ep.isActive,
      latencyMs: ep.latencyMs,
      lastHealthCheck: ep.lastHealthCheck,
    },
  }));

  logger.debug({ total, page, limit, filters }, 'Discovered endpoints');

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
 * Get a single endpoint by ID
 */
export async function getEndpointById(id: string) {
  const endpoint = await prisma.agentEndpoint.findUnique({
    where: { id },
    include: {
      agent: {
        select: {
          address: true,
          name: true,
          trust_score: true,
          status: true,
        },
      },
    },
  });

  if (!endpoint) {
    throw new NotFoundError(`Endpoint not found: ${id}`);
  }

  logger.debug({ id }, 'Fetched endpoint');
  return endpoint;
}

/**
 * Update an existing endpoint
 */
export async function updateEndpoint(id: string, updates: UpdateEndpointInput) {
  await getEndpointById(id);

  const data: Prisma.AgentEndpointUpdateInput = {};

  if (updates.url !== undefined) data.url = updates.url;
  if (updates.capabilities !== undefined) data.capabilities = updates.capabilities;
  if (updates.pricePerCall !== undefined) data.pricePerCall = new Prisma.Decimal(updates.pricePerCall);
  if (updates.paymentToken !== undefined) data.paymentToken = updates.paymentToken;
  if (updates.isActive !== undefined) data.isActive = updates.isActive;

  const endpoint = await prisma.agentEndpoint.update({
    where: { id },
    data,
  });

  logger.info({ id }, 'Updated endpoint');
  return endpoint;
}

/**
 * Deactivate an endpoint (soft delete)
 */
export async function deactivateEndpoint(id: string) {
  await getEndpointById(id);

  const endpoint = await prisma.agentEndpoint.update({
    where: { id },
    data: { isActive: false },
  });

  logger.info({ id }, 'Deactivated endpoint');
  return endpoint;
}

/**
 * List all endpoints for a specific agent
 */
export async function listEndpointsByAgent(agentAddress: string) {
  return prisma.agentEndpoint.findMany({
    where: { agentAddress: agentAddress.toLowerCase() },
    orderBy: { createdAt: 'desc' },
  });
}

// ============================================
// TRANSACTION FUNCTIONS
// ============================================

/**
 * Record an agent-to-agent transaction.
 * Validates both agents and the endpoint exist.
 */
export async function recordTransaction(input: RecordTransactionInput) {
  const [fromAgent, toAgent, endpoint] = await Promise.all([
    prisma.agent.findUnique({ where: { address: input.fromAgentAddress.toLowerCase() } }),
    prisma.agent.findUnique({ where: { address: input.toAgentAddress.toLowerCase() } }),
    prisma.agentEndpoint.findUnique({ where: { id: input.endpointId } }),
  ]);

  if (!fromAgent) throw new NotFoundError(`Source agent not found: ${input.fromAgentAddress}`);
  if (!toAgent) throw new NotFoundError(`Target agent not found: ${input.toAgentAddress}`);
  if (!endpoint) throw new NotFoundError(`Endpoint not found: ${input.endpointId}`);

  const transaction = await prisma.agentTransaction.create({
    data: {
      fromAgentAddress: input.fromAgentAddress.toLowerCase(),
      toAgentAddress: input.toAgentAddress.toLowerCase(),
      endpointId: input.endpointId,
      amount: new Prisma.Decimal(input.amount),
      token: input.token ?? 'USDC',
      txHash: input.txHash ?? null,
      x402Header: input.x402Header ?? null,
      responseTimeMs: input.responseTimeMs ?? null,
      status: 'PENDING',
    },
  });

  logger.info(
    {
      id: transaction.id,
      from: transaction.fromAgentAddress,
      to: transaction.toAgentAddress,
      amount: transaction.amount.toString(),
    },
    'Recorded A2A transaction',
  );

  return transaction;
}

/**
 * List transactions with optional filters and pagination
 */
export async function listTransactions(filters: ListTransactionsFilters = {}) {
  const { fromAgentAddress, toAgentAddress, status, page = 1, limit = 20 } = filters;
  const skip = (page - 1) * limit;

  const where: Prisma.AgentTransactionWhereInput = {};

  if (fromAgentAddress) where.fromAgentAddress = fromAgentAddress.toLowerCase();
  if (toAgentAddress) where.toAgentAddress = toAgentAddress.toLowerCase();
  if (status) where.status = status;

  const [data, total] = await Promise.all([
    prisma.agentTransaction.findMany({
      where,
      skip,
      take: limit,
      include: {
        endpoint: {
          select: { type: true, url: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.agentTransaction.count({ where }),
  ]);

  logger.debug({ total, page, limit, filters }, 'Listed transactions');

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
 * Update health check data for an endpoint (called by heartbeat/cron)
 */
export async function updateHealthCheck(id: string, latencyMs: number | null) {
  await prisma.agentEndpoint.update({
    where: { id },
    data: {
      lastHealthCheck: new Date(),
      latencyMs,
    },
  });

  logger.debug({ id, latencyMs }, 'Updated endpoint health check');
}
