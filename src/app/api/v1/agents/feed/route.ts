import { NextRequest, NextResponse } from 'next/server';
import { getActivityFeed } from '@/services/activity-feed-service';
import { createLogger } from '@/lib/utils/logger';

export const dynamic = 'force-dynamic';

const logger = createLogger('api-activity-feed');

/**
 * GET /api/v1/agents/feed?limit=20
 * Returns recent activity events across all agents (live feed)
 */
export async function GET(request: NextRequest) {
  try {
    const limitParam = request.nextUrl.searchParams.get('limit');
    const limit = Math.min(Math.max(parseInt(limitParam || '20', 10) || 20, 1), 50);

    const events = await getActivityFeed(limit);

    return NextResponse.json({ data: events, error: null });
  } catch (error) {
    logger.error({ error }, 'Failed to fetch activity feed');
    return NextResponse.json(
      { data: null, error: { message: 'Internal server error', code: 'INTERNAL_ERROR' } },
      { status: 500 }
    );
  }
}
