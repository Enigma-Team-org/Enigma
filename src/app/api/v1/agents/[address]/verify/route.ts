import { NextRequest } from 'next/server';
import { successResponse, handleError } from '@/lib/utils/api-helpers';
import { ValidationError } from '@/lib/utils/errors';
import { addressSchema } from '@/lib/utils/validation';
import { createLogger } from '@/lib/utils/logger';
import { checkVerificationEligibility, verifyAgentPremium } from '@/services/verification-service';

export const dynamic = 'force-dynamic';

const logger = createLogger('api-verify');

/**
 * GET /api/v1/agents/:address/verify
 *
 * Check verification eligibility — returns criteria checklist.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params;

    const addrResult = addressSchema.safeParse(address);
    if (!addrResult.success) {
      throw new ValidationError('Invalid address format', {
        address: 'Must be a valid Ethereum address (0x...)',
      });
    }

    const eligibility = await checkVerificationEligibility(address);

    return successResponse(eligibility);
  } catch (error) {
    logger.error({ error }, 'Error checking verification eligibility');
    return handleError(error);
  }
}

/**
 * POST /api/v1/agents/:address/verify
 *
 * Execute Premium verification after payment.
 * Body: { payerAddress: string, txHash: string }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params;

    const addrResult = addressSchema.safeParse(address);
    if (!addrResult.success) {
      throw new ValidationError('Invalid address format', {
        address: 'Must be a valid Ethereum address (0x...)',
      });
    }

    const body = await request.json();
    const { payerAddress, txHash } = body;

    if (!payerAddress || !txHash) {
      const fields: Record<string, string> = {};
      if (!payerAddress) fields.payerAddress = 'Required';
      if (!txHash) fields.txHash = 'Required';
      throw new ValidationError('Missing required fields', fields);
    }

    const result = await verifyAgentPremium(address, payerAddress, txHash);

    return successResponse(result);
  } catch (error) {
    logger.error({ error }, 'Verification failed');
    return handleError(error);
  }
}
