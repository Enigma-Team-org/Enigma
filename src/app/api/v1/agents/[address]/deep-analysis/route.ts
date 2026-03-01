import { NextRequest, NextResponse } from 'next/server';
import { hasValidPayment } from '@/services/payment-service';
import { logger } from '@/lib/utils/logger';

const log = logger.child({ module: 'api-deep-analysis' });

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params;

    // Check for x-payer-address header (set after payment)
    const payerAddress = request.headers.get('x-payer-address');

    if (!payerAddress) {
      return NextResponse.json(
        {
          data: null,
          error: {
            message: 'Payment required for Deep Analysis',
            code: 'PAYMENT_REQUIRED',
            price: '0.50',
            paymentType: 'DEEP_ANALYSIS',
          },
        },
        { status: 402 }
      );
    }

    // Verify payment is valid
    const hasPaid = await hasValidPayment(payerAddress, 'DEEP_ANALYSIS', address);

    if (!hasPaid) {
      return NextResponse.json(
        {
          data: null,
          error: {
            message: 'No valid payment found. Payment expires after 24 hours.',
            code: 'PAYMENT_REQUIRED',
            price: '0.50',
            paymentType: 'DEEP_ANALYSIS',
          },
        },
        { status: 402 }
      );
    }

    // Fetch enhanced score data (reuse existing endpoint logic)
    const baseUrl = request.nextUrl.origin;
    const enhancedRes = await fetch(`${baseUrl}/api/v1/agents/${address}/enhanced-score`, {
      headers: { 'Content-Type': 'application/json' },
    });

    if (!enhancedRes.ok) {
      return NextResponse.json(
        { data: null, error: { message: 'Failed to fetch analysis data', code: 'INTERNAL_ERROR' } },
        { status: 500 }
      );
    }

    const enhancedData = await enhancedRes.json();

    return NextResponse.json({
      data: {
        ...enhancedData.data,
        paymentVerified: true,
        accessExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      },
      error: null,
    });
  } catch (error) {
    log.error({ error }, 'Deep analysis failed');
    return NextResponse.json(
      { data: null, error: { message: 'Internal server error', code: 'INTERNAL_ERROR' } },
      { status: 500 }
    );
  }
}
