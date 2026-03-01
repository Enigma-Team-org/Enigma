import { NextRequest, NextResponse } from 'next/server';
import { getGdpHistory } from '@/services/gdp-service';
import { logger } from '@/lib/utils/logger';

const log = logger.child({ module: 'api-gdp-history' });

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const days = Math.min(parseInt(searchParams.get('days') ?? '30', 10), 365);

    const snapshots = await getGdpHistory({ days });

    return NextResponse.json({ data: snapshots, error: null });
  } catch (error) {
    log.error({ error }, 'Failed to fetch GDP history');
    return NextResponse.json(
      { data: null, error: { message: 'Internal server error', code: 'INTERNAL_ERROR' } },
      { status: 500 }
    );
  }
}
