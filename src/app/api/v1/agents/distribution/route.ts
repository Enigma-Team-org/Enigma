import { NextRequest } from 'next/server';
import { successResponse, handleError } from '@/lib/utils/api-helpers';
import { createLogger } from '@/lib/utils/logger';
import { prisma } from '@/lib/database/prisma';

export const dynamic = 'force-dynamic';

const logger = createLogger('api-agents-distribution');

interface TrustDistribution {
  range: string;
  min: number;
  max: number;
  count: number;
  percentage: number;
}

const TRUST_RANGES = [
  { range: '0-20', min: 0, max: 20 },
  { range: '21-40', min: 21, max: 40 },
  { range: '41-60', min: 41, max: 60 },
  { range: '61-80', min: 61, max: 80 },
  { range: '81-100', min: 81, max: 100 },
];

/**
 * GET /api/v1/agents/distribution
 *
 * Get trust score distribution of agents
 *
 * Returns:
 * - ranges: Array of trust score ranges with counts
 */
export async function GET(_request: NextRequest) {
  try {
    logger.debug('Fetching trust score distribution');

    // Get total count for percentage calculation
    const total = await prisma.agent.count();

    // Get counts for each range in parallel
    const rangeCounts = await Promise.all(
      TRUST_RANGES.map(async ({ range, min, max }) => {
        const count = await prisma.agent.count({
          where: {
            trust_score: {
              gte: min,
              lte: max,
            },
          },
        });
        return { range, min, max, count };
      })
    );

    // Calculate percentages
    const distribution: TrustDistribution[] = rangeCounts.map(({ range, min, max, count }) => ({
      range,
      min,
      max,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    }));

    logger.info({ distribution }, 'Trust score distribution fetched successfully');

    return successResponse({ distribution, total }, 200);
  } catch (error) {
    logger.error({ error }, 'Error fetching trust score distribution');
    return handleError(error);
  }
}
