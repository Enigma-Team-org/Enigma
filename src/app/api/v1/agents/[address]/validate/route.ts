import { NextRequest } from 'next/server';
import { successResponse, handleError } from '@/lib/utils/api-helpers';
import { NotFoundError, ValidationError } from '@/lib/utils/errors';
import { addressSchema } from '@/lib/utils/validation';
import { createLogger } from '@/lib/utils/logger';
import { validateAgent, getLatestValidation } from '@/services/centinela/sentinel-validator';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Validation can take up to 60s

const logger = createLogger('api-validate');

/**
 * GET /api/v1/agents/:address/validate
 *
 * Get the latest validation result for an agent.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params;

    const addrResult = addressSchema.safeParse(address);
    if (!addrResult.success) {
      throw new ValidationError('Invalid address format', {
        address: 'Must be a valid Ethereum address (0x...)',
      });
    }

    const validation = await getLatestValidation(address);
    if (!validation) {
      throw new NotFoundError('No validation found for this agent');
    }

    return successResponse({
      agentAddress: validation.agentAddress,
      totalScore: validation.totalScore,
      maxScore: validation.maxScore,
      verdict: validation.verdict,
      categories: {
        metadata: validation.metadataScore,
        infrastructure: validation.infrastructureScore,
        aws: validation.awsScore,
        x402: validation.x402Score,
        bonus: validation.bonusScore,
      },
      checks: validation.checks,
      validatedAt: validation.createdAt.toISOString(),
    });
  } catch (error) {
    logger.error({ error }, 'Error fetching validation');
    return handleError(error);
  }
}

/**
 * POST /api/v1/agents/:address/validate
 *
 * Run Super Sentinel validation (27 checks) on an agent.
 * Protected by CRON_SECRET in production.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params;

    // Auth check in production
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (process.env.NODE_ENV === 'production' && cronSecret) {
      if (authHeader !== `Bearer ${cronSecret}`) {
        logger.warn('Unauthorized validation attempt');
        return new Response('Unauthorized', { status: 401 });
      }
    }

    const addrResult = addressSchema.safeParse(address);
    if (!addrResult.success) {
      throw new ValidationError('Invalid address format', {
        address: 'Must be a valid Ethereum address (0x...)',
      });
    }

    logger.info({ address }, 'Running Super Sentinel validation');

    const result = await validateAgent(address);

    return successResponse({
      agentAddress: result.agentAddress,
      totalScore: result.totalScore,
      maxScore: result.maxScore,
      verdict: result.verdict,
      categories: result.categories,
      checks: result.checks,
      criticalFailures: result.criticalFailures,
      duration: `${result.duration}ms`,
    }, 200);
  } catch (error) {
    logger.error({ error }, 'Validation failed');
    return handleError(error);
  }
}
