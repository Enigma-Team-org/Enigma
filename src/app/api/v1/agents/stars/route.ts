import { NextRequest, NextResponse } from 'next/server';
import { getStarCounts, getStarredByWallet } from '@/services/star-service';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('api-agent-stars-batch');

/**
 * GET /api/v1/agents/stars?addresses=0x1,0x2&wallet=0x3
 * Batch fetch star counts and starred status
 */
export async function GET(request: NextRequest) {
  try {
    const addressesParam = request.nextUrl.searchParams.get('addresses') || '';
    const wallet = request.nextUrl.searchParams.get('wallet');

    const addresses = addressesParam
      .split(',')
      .map((a) => a.trim())
      .filter(Boolean)
      .slice(0, 100); // max 100

    if (addresses.length === 0) {
      return NextResponse.json({ data: {}, error: null });
    }

    const counts = await getStarCounts(addresses);
    let starredSet = new Set<string>();
    if (wallet) {
      starredSet = await getStarredByWallet(wallet, addresses);
    }

    const result: Record<string, { starCount: number; starred: boolean }> = {};
    for (const addr of addresses) {
      const lower = addr.toLowerCase();
      result[lower] = {
        starCount: counts[lower] || 0,
        starred: starredSet.has(lower),
      };
    }

    return NextResponse.json({ data: result, error: null });
  } catch (error) {
    logger.error({ error }, 'Failed to fetch batch star counts');
    return NextResponse.json(
      { data: null, error: { message: 'Internal server error', code: 'INTERNAL_ERROR' } },
      { status: 500 }
    );
  }
}
