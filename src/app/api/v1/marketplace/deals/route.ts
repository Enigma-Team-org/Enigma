import { NextRequest, NextResponse } from 'next/server';
import { listDealsSchema, createDealSchema } from '@/lib/utils/marketplace-validation';
import { listDeals, createDeal } from '@/services/deal-service';
import { NotFoundError } from '@/lib/utils/errors';
import { logger } from '@/lib/utils/logger';

const log = logger.child({ module: 'api-marketplace-deals' });

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const parsed = listDealsSchema.safeParse({
      buyerAddress: searchParams.get('buyerAddress') ?? undefined,
      sellerAddress: searchParams.get('sellerAddress') ?? undefined,
      status: searchParams.get('status') ?? undefined,
      page: searchParams.get('page') ?? '1',
      limit: searchParams.get('limit') ?? '20',
    });

    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: { message: 'Validation failed', code: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors } },
        { status: 400 }
      );
    }

    const result = await listDeals(parsed.data);

    return NextResponse.json({
      data: result,
      error: null,
    });
  } catch (error) {
    log.error({ error }, 'Failed to list deals');
    return NextResponse.json(
      { data: null, error: { message: 'Internal server error', code: 'INTERNAL_ERROR' } },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createDealSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: { message: 'Validation failed', code: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors } },
        { status: 400 }
      );
    }

    const deal = await createDeal(parsed.data);

    return NextResponse.json({
      data: deal,
      error: null,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { data: null, error: { message: error.message, code: 'NOT_FOUND' } },
        { status: 404 }
      );
    }
    log.error({ error }, 'Failed to create deal');
    return NextResponse.json(
      { data: null, error: { message: 'Internal server error', code: 'INTERNAL_ERROR' } },
      { status: 500 }
    );
  }
}
