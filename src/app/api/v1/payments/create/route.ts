import { NextRequest, NextResponse } from 'next/server';
import { createPaymentSchema } from '@/lib/utils/payment-validation';
import { createPayment } from '@/services/payment-service';
import { getServicePrice } from '@/lib/x402/config';
import { logger } from '@/lib/utils/logger';

const log = logger.child({ module: 'api-payments-create' });

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createPaymentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: { message: 'Validation failed', code: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors } },
        { status: 400 }
      );
    }

    const { payerAddress, type, tokenAddress, tokenSymbol, chainId, agentAddress } = parsed.data;
    const priceUsd = getServicePrice(type);

    const payment = await createPayment({
      payerAddress,
      type,
      amountUsd: priceUsd,
      tokenAddress,
      tokenSymbol,
      chainId,
      agentAddress,
    });

    return NextResponse.json({
      data: {
        paymentId: payment.id,
        type: payment.type,
        amountUsd: priceUsd,
        feeUsd: payment.feeUsd,
        burnUsd: payment.burnUsd,
        status: payment.status,
        expiresAt: payment.expiresAt,
      },
      error: null,
    }, { status: 201 });
  } catch (error) {
    log.error({ error }, 'Failed to create payment');
    return NextResponse.json(
      { data: null, error: { message: 'Internal server error', code: 'INTERNAL_ERROR' } },
      { status: 500 }
    );
  }
}
