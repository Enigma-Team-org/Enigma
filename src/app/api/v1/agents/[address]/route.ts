import { NextRequest } from 'next/server';
import { z } from 'zod';
import { successResponse, handleError } from '@/lib/utils/api-helpers';
import { NotFoundError, ValidationError } from '@/lib/utils/errors';
import { createLogger } from '@/lib/utils/logger';
import { prisma } from '@/lib/database/prisma';
import { getTrustScoreBreakdown } from '@/services/trust-score-service';
import { calculateUptime } from '@/services/centinela/heartbeat-service';
import { calculateCombinedTrustScore } from '@/services/combined-trust-score-service';
import { getLatestValidation } from '@/services/centinela/sentinel-validator';

export const dynamic = 'force-dynamic';

const logger = createLogger('api-agent-detail');

/**
 * Ethereum address validation schema
 */
const addressSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address format');

/**
 * GET /api/v1/agents/:address
 *
 * Retrieve complete details for a specific agent including:
 * - Basic info (name, type, status, etc.)
 * - Trust score with breakdown
 * - Transaction volume data
 * - Heartbeat/uptime summary
 * - Rating summary
 * - Proxy detection results
 *
 * @see docs/api/endpoints.md
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params;

    // Validate address format
    const validationResult = addressSchema.safeParse(address);
    if (!validationResult.success) {
      throw new ValidationError('Invalid address format', {
        address: 'Must be a valid Ethereum address (0x...)',
      });
    }

    const normalizedAddress = address.toLowerCase();
    logger.info({ address: normalizedAddress }, 'Fetching agent details');

    // Fetch agent with all related data
    const agent = await prisma.agent.findUnique({
      where: { address: normalizedAddress },
      include: {
        transactionVolumes: true,
        ratings: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!agent) {
      throw new NotFoundError(`Agent not found: ${address}`);
    }

    // Fetch all scoring data in parallel
    const [trustScore, uptimeData, combined, sentinelValidation] = await Promise.all([
      getTrustScoreBreakdown(normalizedAddress),
      calculateUptime(normalizedAddress, '7d'),
      calculateCombinedTrustScore(normalizedAddress).catch(() => null),
      getLatestValidation(normalizedAddress).catch(() => null),
    ]);

    // Process volume data by period
    const volumes: Record<string, { txCount: number; volumeAvax: string; volumeUsd: string }> = {};
    for (const vol of agent.transactionVolumes) {
      volumes[vol.period.toLowerCase()] = {
        txCount: vol.txCount,
        volumeAvax: vol.volumeAvax.toString(),
        volumeUsd: vol.volumeUsd.toString(),
      };
    }

    // Calculate rating summary
    const ratingSum = agent.ratings.reduce((sum, r) => sum + r.rating, 0);
    const ratingCount = agent.ratings.length;
    const averageRating = ratingCount > 0 ? ratingSum / ratingCount : 0;

    // Build response
    const response = {
      // Basic info
      address: agent.address,
      name: agent.name,
      type: agent.type,
      description: agent.description,
      ownerAddress: agent.owner_address,
      billingAddress: agent.billing_address,
      registryAddress: agent.registry_address,
      tokenId: agent.token_id,
      tokenUri: agent.token_uri,
      metadata: agent.metadata,
      status: agent.status,
      createdAt: agent.created_at.toISOString(),
      updatedAt: agent.updated_at.toISOString(),

      // Trust score (v2 with pillars + v1 as base)
      trustScore: {
        score: combined?.v2Score ?? trustScore.score,
        v2Score: combined?.v2Score ?? trustScore.score,
        tracerScore: combined?.tracerScore ?? 0,
        classification: combined?.classification ?? 'unknown',
        sentinel: {
          score: sentinelValidation?.totalScore ?? null,
          maxScore: sentinelValidation?.maxScore ?? null,
          verdict: sentinelValidation?.verdict ?? null,
        },
        pillars: combined?.pillars ?? {
          infrastructure: { score: 0, weighted: 0 },
          community: { score: 0, weighted: 0 },
          correlation: { score: 0, weighted: 0 },
          rl: { score: 0, weighted: 0 },
        },
        tracerDimensions: combined?.tracerDimensions ?? {
          trust: { score: 0, weight: 0.20, contribution: 0 },
          reliability: { score: 0, weight: 0.20, contribution: 0 },
          autonomy: { score: 0, weight: 0.15, contribution: 0 },
          capability: { score: 0, weight: 0.20, contribution: 0 },
          economics: { score: 0, weight: 0.10, contribution: 0 },
          reputation: { score: 0, weight: 0.15, contribution: 0 },
        },
        lastUpdated: trustScore.lastUpdated.toISOString(),
      },

      // Proxy detection
      proxy: {
        detected: agent.is_proxy,
        type: agent.proxy_type,
        implementationAddress: agent.implementation_address,
      },

      // Transaction volumes
      volumes,

      // Uptime summary
      uptime: {
        percentage: uptimeData.uptimePercentage,
        totalPings: uptimeData.totalPings,
        successfulPings: uptimeData.successfulPings,
        failedPings: uptimeData.failedPings,
        timeoutPings: uptimeData.timeoutPings,
        averageResponseTimeMs: uptimeData.averageResponseTimeMs,
      },

      // Rating summary
      ratings: {
        average: Number(averageRating.toFixed(2)),
        count: ratingCount,
        recent: agent.ratings.map((r) => ({
          id: r.id,
          rating: r.rating,
          review: r.review,
          userAddress: r.userAddress,
          createdAt: r.createdAt.toISOString(),
        })),
      },
    };

    logger.info({
      address: normalizedAddress,
      trustScore: trustScore.score,
    }, 'Agent details fetched successfully');

    return successResponse(response);
  } catch (error) {
    logger.error({ error }, 'Error fetching agent details');
    return handleError(error);
  }
}
