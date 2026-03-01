import { NextRequest, NextResponse } from 'next/server';
import { updateDealStatusSchema } from '@/lib/utils/marketplace-validation';
import { getDealById, updateDealStatus } from '@/services/deal-service';
import { NotFoundError } from '@/lib/utils/errors';
import { logger } from '@/lib/utils/logger';

const log = logger.child({ module: 'api-marketplace-deals-id' });

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deal = await getDealById(id);

    return NextResponse.json({
      data: deal,
      error: null,
    });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { data: null, error: { message: error.message, code: 'NOT_FOUND' } },
        { status: 404 }
      );
    }
    log.error({ error }, 'Failed to get deal');
    return NextResponse.json(
      { data: null, error: { message: 'Internal server error', code: 'INTERNAL_ERROR' } },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = updateDealStatusSchema.safeParse({ dealId: id, ...body });

    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: { message: 'Validation failed', code: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors } },
        { status: 400 }
      );
    }

    const { status, txHash } = parsed.data;
    const deal = await updateDealStatus(id, status, txHash);

    return NextResponse.json({
      data: deal,
      error: null,
    });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { data: null, error: { message: error.message, code: 'NOT_FOUND' } },
        { status: 404 }
      );
    }
    log.error({ error }, 'Failed to update deal status');
    return NextResponse.json(
      { data: null, error: { message: 'Internal server error', code: 'INTERNAL_ERROR' } },
      { status: 500 }
    );
  }
}
