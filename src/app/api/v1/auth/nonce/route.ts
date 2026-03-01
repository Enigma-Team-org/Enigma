import { NextRequest } from 'next/server';
import { successResponse, handleError } from '@/lib/utils/api-helpers';
import { ValidationError } from '@/lib/utils/errors';
import { generateNonce, buildSignMessage } from '@/lib/utils/auth';
import { addressSchema } from '@/lib/utils/validation';
import { createLogger } from '@/lib/utils/logger';

export const dynamic = 'force-dynamic';

const logger = createLogger('api-auth-nonce');

/**
 * POST /api/v1/auth/nonce
 *
 * Generate a nonce for wallet signature authentication.
 * The client must sign a message containing this nonce.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { address } = body;

    if (!address) {
      throw new ValidationError('Address is required', { address: 'Must provide wallet address' });
    }

    const addrResult = addressSchema.safeParse(address);
    if (!addrResult.success) {
      throw new ValidationError('Invalid address format', {
        address: 'Must be a valid Ethereum address (0x...)',
      });
    }

    const nonce = await generateNonce(address);
    const message = buildSignMessage(nonce);

    logger.info({ address: address.toLowerCase() }, 'Nonce generated for authentication');

    return successResponse({ nonce, message }, 200);
  } catch (error) {
    logger.error({ error }, 'Error generating nonce');
    return handleError(error);
  }
}
