import { NextRequest, NextResponse } from 'next/server';
import { verifyPaymentSchema } from '@/lib/utils/payment-validation';
import { completePayment, failPayment } from '@/services/payment-service';
import { logger } from '@/lib/utils/logger';

const log = logger.child({ module: 'api-payments-verify' });

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = verifyPaymentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: { message: 'Validation failed', code: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors } },
        { status: 400 }
      );
    }

    const { paymentId, txHash } = parsed.data;

    try {
      const payment = await completePayment(paymentId, txHash);
      return NextResponse.json({
        data: {
          paymentId: payment.id,
          status: payment.status,
          txHash: payment.txHash,
          updatedAt: payment.updatedAt,
        },
        error: null,
      });
    } catch {
      await failPayment(paymentId).catch(() => {});
      return NextResponse.json(
        { data: null, error: { message: 'Payment verification failed', code: 'PAYMENT_FAILED' } },
        { status: 422 }
      );
    }
  } catch (error) {
    log.error({ error }, 'Failed to verify payment');
    return NextResponse.json(
      { data: null, error: { message: 'Internal server error', code: 'INTERNAL_ERROR' } },
      { status: 500 }
    );
  }
}
