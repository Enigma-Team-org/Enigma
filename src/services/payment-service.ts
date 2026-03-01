import { prisma } from '@/lib/database/prisma';
import type { PaymentType } from '@prisma/client';
import { logger } from '@/lib/utils/logger';

const log = logger.child({ module: 'payment-service' });

const PAYMENT_VALIDITY_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Create a new payment record
 */
export async function createPayment(params: {
  payerAddress: string;
  type: PaymentType;
  amountUsd: string;
  tokenAddress: string;
  chainId: number;
  agentAddress?: string;
}) {
  const payment = await prisma.payment.create({
    data: {
      payerAddress: params.payerAddress.toLowerCase(),
      type: params.type,
      amountUsd: params.amountUsd,
      tokenAddress: params.tokenAddress,
      chainId: params.chainId,
      agentAddress: params.agentAddress?.toLowerCase(),
      status: 'PENDING',
    },
  });

  log.info({ paymentId: payment.id, type: params.type }, 'Payment created');
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
      completedAt: new Date(),
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
  const cutoff = new Date(Date.now() - PAYMENT_VALIDITY_MS);

  const payment = await prisma.payment.findFirst({
    where: {
      payerAddress: payerAddress.toLowerCase(),
      type,
      status: 'COMPLETED',
      completedAt: { gte: cutoff },
      ...(agentAddress ? { agentAddress: agentAddress.toLowerCase() } : {}),
    },
    orderBy: { completedAt: 'desc' },
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
