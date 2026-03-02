import { NextRequest, NextResponse } from 'next/server';
import { toggleStar, getStarCount } from '@/services/star-service';
import { prisma } from '@/lib/database/prisma';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('api-agent-star');

/**
 * GET /api/v1/agents/[address]/star?wallet=0x...
 * Get star count + whether wallet has starred this agent
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params;
    const wallet = request.nextUrl.searchParams.get('wallet');

    const starCount = await getStarCount(address);

    let starred = false;
    if (wallet) {
      const existing = await prisma.agentStar.findUnique({
        where: {
          walletAddress_agentAddress: {
            walletAddress: wallet.toLowerCase(),
            agentAddress: address.toLowerCase(),
          },
        },
      });
      starred = !!existing;
    }

    return NextResponse.json({ data: { starCount, starred }, error: null });
  } catch (error) {
    logger.error({ error }, 'Failed to get star info');
    return NextResponse.json(
      { data: null, error: { message: 'Internal server error', code: 'INTERNAL_ERROR' } },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/agents/[address]/star
 * Toggle star for an agent
 * Body: { walletAddress: string }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params;
    const body = await request.json();
    const { walletAddress } = body;

    if (!walletAddress || typeof walletAddress !== 'string') {
      return NextResponse.json(
        { data: null, error: { message: 'walletAddress is required', code: 'VALIDATION_ERROR' } },
        { status: 400 }
      );
    }

    const result = await toggleStar(walletAddress, address);

    return NextResponse.json({ data: result, error: null });
  } catch (error) {
    logger.error({ error }, 'Failed to toggle star');
    return NextResponse.json(
      { data: null, error: { message: 'Internal server error', code: 'INTERNAL_ERROR' } },
      { status: 500 }
    );
  }
}
