import { NextResponse } from 'next/server';
import { getBurnStats } from '@/services/burn-service';
import { logger } from '@/lib/utils/logger';

const log = logger.child({ module: 'api-burn-stats' });

export async function GET() {
  try {
    const stats = await getBurnStats();
    return NextResponse.json({ data: stats, error: null });
  } catch (error) {
    log.error({ error }, 'Failed to fetch burn stats');
    return NextResponse.json(
      { data: null, error: { message: 'Internal server error', code: 'INTERNAL_ERROR' } },
      { status: 500 }
    );
  }
}
