import { NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';

const log = logger.child({ module: 'api-burn-execute' });

/**
 * POST: Trigger a manual burn execution
 * In production, burns are triggered automatically when pool reaches minimum.
 * This endpoint is for admin/testing purposes.
 */
export async function POST() {
  try {
    // For MVP: burns are tracked via on-chain events indexed by cron
    // The actual burn tx is executed by backend wallet when pool >= $1
    return NextResponse.json({
      data: {
        message: 'Burn execution is handled automatically when pool reaches minimum threshold ($1)',
        status: 'queued',
      },
      error: null,
    });
  } catch (error) {
    log.error({ error }, 'Failed to execute burn');
    return NextResponse.json(
      { data: null, error: { message: 'Internal server error', code: 'INTERNAL_ERROR' } },
      { status: 500 }
    );
  }
}
