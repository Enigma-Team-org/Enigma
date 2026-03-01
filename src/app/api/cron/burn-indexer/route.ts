import { NextRequest, NextResponse } from 'next/server';
import { indexBurnEvents } from '@/services/burn-service';
import { logger } from '@/lib/utils/logger';

const log = logger.child({ module: 'cron-burn-indexer' });

/**
 * Cron endpoint: Index burn events from on-chain contracts
 * Runs every 5 minutes via Vercel Cron
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { data: null, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
        { status: 401 }
      );
    }

    const avalancheResult = await indexBurnEvents(43114);

    log.info({ avalanche: avalancheResult }, 'Burn indexer cron completed');

    return NextResponse.json({
      data: {
        avalanche: avalancheResult,
        timestamp: new Date().toISOString(),
      },
      error: null,
    });
  } catch (error) {
    log.error({ error }, 'Burn indexer cron failed');
    return NextResponse.json(
      { data: null, error: { message: 'Internal server error', code: 'INTERNAL_ERROR' } },
      { status: 500 }
    );
  }
}
