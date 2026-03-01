import { NextRequest, NextResponse } from 'next/server';
import { paymentHistorySchema } from '@/lib/utils/payment-validation';
import { getPaymentHistory } from '@/services/payment-service';
import { logger } from '@/lib/utils/logger';

const log = logger.child({ module: 'api-payments-history' });

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const parsed = paymentHistorySchema.safeParse({
      address: searchParams.get('address'),
      page: searchParams.get('page') ?? '1',
      limit: searchParams.get('limit') ?? '20',
    });

    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: { message: 'Validation failed', code: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors } },
        { status: 400 }
      );
    }

    const { address, page, limit } = parsed.data;
    const result = await getPaymentHistory(address, { page, limit });

    return NextResponse.json({
      data: result,
      error: null,
    });
  } catch (error) {
    log.error({ error }, 'Failed to fetch payment history');
    return NextResponse.json(
      { data: null, error: { message: 'Internal server error', code: 'INTERNAL_ERROR' } },
      { status: 500 }
    );
  }
}
