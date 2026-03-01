import { NextRequest, NextResponse } from 'next/server';
import { getBurnFeed } from '@/services/burn-service';
import { logger } from '@/lib/utils/logger';

const log = logger.child({ module: 'api-burn-feed' });

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const page = parseInt(searchParams.get('page') ?? '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '20', 10), 100);

    const result = await getBurnFeed({ page, limit });
    return NextResponse.json({ data: result, error: null });
  } catch (error) {
    log.error({ error }, 'Failed to fetch burn feed');
    return NextResponse.json(
      { data: null, error: { message: 'Internal server error', code: 'INTERNAL_ERROR' } },
      { status: 500 }
    );
  }
}
