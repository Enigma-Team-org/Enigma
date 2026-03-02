import { NextRequest, NextResponse } from 'next/server';
import { recordTransactionSchema, listTransactionsSchema } from '@/lib/utils/endpoint-validation';
import { recordTransaction, listTransactions } from '@/services/endpoint-service';
import { NotFoundError } from '@/lib/utils/errors';
import { logger } from '@/lib/utils/logger';

const log = logger.child({ module: 'api-agents-transactions' });

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const parsed = listTransactionsSchema.safeParse({
      fromAgentAddress: searchParams.get('fromAgentAddress') ?? undefined,
      toAgentAddress: searchParams.get('toAgentAddress') ?? undefined,
      status: searchParams.get('status') ?? undefined,
      page: searchParams.get('page') ?? '1',
      limit: searchParams.get('limit') ?? '20',
    });

    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: { message: 'Validation failed', code: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors } },
        { status: 400 },
      );
    }

    const result = await listTransactions(parsed.data);

    return NextResponse.json({
      data: result,
      error: null,
    });
  } catch (error) {
    log.error({ error }, 'Failed to list transactions');
    return NextResponse.json(
      { data: null, error: { message: 'Internal server error', code: 'INTERNAL_ERROR' } },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = recordTransactionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: { message: 'Validation failed', code: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors } },
        { status: 400 },
      );
    }

    const transaction = await recordTransaction(parsed.data);

    return NextResponse.json({
      data: transaction,
      error: null,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { data: null, error: { message: error.message, code: 'NOT_FOUND' } },
        { status: 404 },
      );
    }
    log.error({ error }, 'Failed to record transaction');
    return NextResponse.json(
      { data: null, error: { message: 'Internal server error', code: 'INTERNAL_ERROR' } },
      { status: 500 },
    );
  }
}
