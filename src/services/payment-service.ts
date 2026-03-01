import { prisma } from '@/lib/database/prisma';
import type { PaymentType } from '@prisma/client';
import { logger } from '@/lib/utils/logger';

const log = logger.child({ module: 'payment-service' });

const PAYMENT_VALIDITY_MS = 24 * 60 * 60 * 1000; // 24 hours

const FEE_RATE = 0.02;    // 2% platform fee
const BURN_RATE = 0.10;   // 10% of fee goes to burn

/**
 * Create a new payment record
 */
export async function createPayment(params: {
  payerAddress: string;
  type: PaymentType;
  amountUsd: string;
  tokenAddress: string;
  tokenSymbol?: string;
  chainId: number;
  agentAddress?: string;
}) {
  const amount = parseFloat(params.amountUsd);
  const feeUsd = (amount * FEE_RATE).toFixed(6);
  const burnUsd = (parseFloat(feeUsd) * BURN_RATE).toFixed(6);

  const payment = await prisma.payment.create({
    data: {
      payerAddress: params.payerAddress.toLowerCase(),
      type: params.type,
      amountUsd: params.amountUsd,
      feeUsd,
      burnUsd,
      tokenAddress: params.tokenAddress,
      tokenSymbol: params.tokenSymbol ?? 'USDC',
      chainId: params.chainId,
      agentAddress: params.agentAddress?.toLowerCase(),
      status: 'PENDING',
      expiresAt: new Date(Date.now() + PAYMENT_VALIDITY_MS),
    },
  });

  log.info({ paymentId: payment.id, type: params.type, feeUsd, burnUsd }, 'Payment created');
  return payment;
}

/**
 * Complete a payment after successful verification
 */
export async function completePayment(paymentId: string, txHash: string) {
  const payment = await prisma.payment.update({
    where: { id: paymentId },
    data: {
      status: 'COMPLETED',
      txHash,
    },
  });

  log.info({ paymentId, txHash }, 'Payment completed');
  return payment;
}

/**
 * Mark a payment as failed
 */
export async function failPayment(paymentId: string) {
  const payment = await prisma.payment.update({
    where: { id: paymentId },
    data: { status: 'FAILED' },
  });

  log.info({ paymentId }, 'Payment failed');
  return payment;
}

/**
 * Check if a payer has a valid (non-expired) payment for a service
 */
export async function hasValidPayment(
  payerAddress: string,
  type: PaymentType,
  agentAddress?: string
): Promise<boolean> {
  const payment = await prisma.payment.findFirst({
    where: {
      payerAddress: payerAddress.toLowerCase(),
      type,
      status: 'COMPLETED',
      expiresAt: { gte: new Date() },
      ...(agentAddress ? { agentAddress: agentAddress.toLowerCase() } : {}),
    },
    orderBy: { createdAt: 'desc' },
  });

  return payment !== null;
}

/**
 * Get payment history for a wallet address
 */
export async function getPaymentHistory(
  payerAddress: string,
  options: { page?: number; limit?: number } = {}
) {
  const { page = 1, limit = 20 } = options;
  const skip = (page - 1) * limit;

  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where: { payerAddress: payerAddress.toLowerCase() },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.payment.count({
      where: { payerAddress: payerAddress.toLowerCase() },
    }),
  ]);

  return {
    payments,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
