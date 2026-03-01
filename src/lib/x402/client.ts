import {
  FacilitatorClient,
  buildPaymentRequirements,
  extractPaymentFromHeaders,
  create402Response,
} from 'uvd-x402-sdk/backend';
import { FACILITATOR_URL, TREASURY_ADDRESS, getServicePrice, usdToAtomicUnits } from './config';
import type { PaymentType } from '@prisma/client';

/**
 * Singleton FacilitatorClient for verifying and settling x402 payments
 */
let _facilitator: FacilitatorClient | null = null;

export function getFacilitator(): FacilitatorClient {
  if (!_facilitator) {
    _facilitator = new FacilitatorClient({ baseUrl: FACILITATOR_URL });
  }
  return _facilitator;
}

/**
 * Build payment requirements for a given service type
 */
export function buildRequirements(
  paymentType: PaymentType,
  resource: string,
  chainName = 'avalanche'
) {
  const priceUsd = getServicePrice(paymentType);
  const amountAtomic = usdToAtomicUnits(priceUsd);

  return buildPaymentRequirements({
    amount: amountAtomic,
    recipient: TREASURY_ADDRESS,
    resource,
    chainName,
    description: `Enigma ${paymentType.replace(/_/g, ' ').toLowerCase()}`,
    mimeType: 'application/json',
    timeoutSeconds: 300,
  });
}

/**
 * Create a 402 Payment Required response for Next.js
 */
export function create402(paymentType: PaymentType, resource: string) {
  const priceUsd = getServicePrice(paymentType);
  const amountAtomic = usdToAtomicUnits(priceUsd);

  return create402Response({
    amount: amountAtomic,
    recipient: TREASURY_ADDRESS,
    resource,
    chainName: 'avalanche',
    description: `Enigma ${paymentType.replace(/_/g, ' ').toLowerCase()}`,
    mimeType: 'application/json',
  });
}

/**
 * Extract and verify x402 payment from request headers
 * Returns payer address if valid, throws if invalid
 */
export async function verifyPaymentHeader(
  headers: Record<string, string | string[] | undefined>,
  paymentType: PaymentType,
  resource: string
) {
  const paymentHeader = extractPaymentFromHeaders(headers);

  if (!paymentHeader) {
    return null;
  }

  const requirements = buildRequirements(paymentType, resource);
  const facilitator = getFacilitator();

  const result = await facilitator.verifyAndSettle(paymentHeader, requirements);

  if (!result.verified) {
    throw new Error('Payment verification failed');
  }

  return {
    verified: result.verified,
    settled: result.settled,
    txHash: result.transactionHash,
  };
}

export { extractPaymentFromHeaders };
