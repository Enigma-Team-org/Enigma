import { NextRequest, NextResponse } from 'next/server';
import { calculateSignals } from '@/services/signal-service';
import { createLogger } from '@/lib/utils/logger';

export const dynamic = 'force-dynamic';

const logger = createLogger('api-agent-signals');

/**
 * GET /api/v1/agents/signals?addresses=0x1,0x2,0x3
 * Returns signal badges for given agents
 */
export async function GET(request: NextRequest) {
  try {
    const addressesParam = request.nextUrl.searchParams.get('addresses') || '';
    const addresses = addressesParam
      .split(',')
      .map((a) => a.trim())
      .filter(Boolean)
      .slice(0, 100);

    if (addresses.length === 0) {
      return NextResponse.json({ data: {}, error: null });
    }

    const signals = await calculateSignals(addresses);

    return NextResponse.json({ data: signals, error: null });
  } catch (error) {
    logger.error({ error }, 'Failed to calculate signals');
    return NextResponse.json(
      { data: null, error: { message: 'Internal server error', code: 'INTERNAL_ERROR' } },
      { status: 500 }
    );
  }
}
