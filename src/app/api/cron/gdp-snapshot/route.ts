import { NextRequest, NextResponse } from 'next/server';
import { calculateDailySnapshot } from '@/services/gdp-service';
import { logger } from '@/lib/utils/logger';

const log = logger.child({ module: 'cron-gdp-snapshot' });

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      log.warn('Unauthorized GDP cron access attempt');
      return NextResponse.json(
        { data: null, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
        { status: 401 }
      );
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const snapshot = await calculateDailySnapshot(yesterday);

    log.info({ date: yesterday.toISOString() }, 'GDP daily snapshot created');

    return NextResponse.json({ data: snapshot, error: null });
  } catch (error) {
    log.error({ error }, 'Failed to calculate GDP snapshot');
    return NextResponse.json(
      { data: null, error: { message: 'Internal server error', code: 'INTERNAL_ERROR' } },
      { status: 500 }
    );
  }
}
