import { verifyMessage } from 'viem';
import { randomUUID } from 'crypto';
import { UnauthorizedError } from './errors';
import { createLogger } from './logger';
import { prisma } from '@/lib/database/prisma';

const logger = createLogger('auth');

const NONCE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Generate a nonce for wallet signature authentication.
 * The nonce must be included in the signed message to prevent replay attacks.
 */
export async function generateNonce(address: string): Promise<string> {
  const nonce = randomUUID();
  const expiresAt = new Date(Date.now() + NONCE_TTL_MS);

  await prisma.authNonce.create({
    data: {
      nonce,
      address: address.toLowerCase(),
      expiresAt,
    },
  });

  logger.debug({ address, nonce }, 'Nonce generated');
  return nonce;
}

/**
 * Consume a nonce — marks it as used and validates it hasn't expired.
 * Returns true if the nonce is valid, throws otherwise.
 */
async function consumeNonce(nonce: string, address: string): Promise<void> {
  const record = await prisma.authNonce.findUnique({ where: { nonce } });

  if (!record) {
    throw new UnauthorizedError('Invalid or expired nonce');
  }

  if (record.used) {
    throw new UnauthorizedError('Nonce already used (possible replay attack)');
  }

  if (record.address !== address.toLowerCase()) {
    throw new UnauthorizedError('Nonce does not match address');
  }

  if (new Date() > record.expiresAt) {
    throw new UnauthorizedError('Nonce expired');
  }

  // Mark as used atomically
  await prisma.authNonce.update({
    where: { nonce },
    data: { used: true },
  });
}

/**
 * Clean up expired nonces (call periodically via cron)
 */
export async function cleanupExpiredNonces(): Promise<number> {
  const result = await prisma.authNonce.deleteMany({
    where: {
      OR: [
        { expiresAt: { lt: new Date() } },
        { used: true, createdAt: { lt: new Date(Date.now() - NONCE_TTL_MS) } },
      ],
    },
  });
  logger.info({ deleted: result.count }, 'Expired nonces cleaned up');
  return result.count;
}

/**
 * Build the message that must be signed (includes nonce for replay protection)
 */
export function buildSignMessage(nonce: string): string {
  return `Sign this message to verify your wallet ownership on Enigma\n\nNonce: ${nonce}`;
}

/**
 * Verify a wallet signature with nonce validation (anti-replay)
 *
 * @param address - The claimed wallet address
 * @param signature - The signature to verify
 * @param nonce - The nonce that was included in the signed message
 * @returns The verified wallet address (lowercase)
 * @throws {UnauthorizedError} If signature or nonce verification fails
 */
export async function verifyWalletSignature(
  address: string,
  signature: string,
  nonce?: string
): Promise<string> {
  try {
    // If nonce provided, validate and consume it (anti-replay)
    if (nonce) {
      await consumeNonce(nonce, address);
    }

    const message = nonce
      ? buildSignMessage(nonce)
      : 'Sign this message to verify your wallet ownership on Enigma';

    const isValid = await verifyMessage({
      address: address as `0x${string}`,
      message,
      signature: signature as `0x${string}`,
    });

    if (!isValid) {
      throw new UnauthorizedError('Invalid wallet signature');
    }

    logger.debug({ address, hasNonce: !!nonce }, 'Wallet signature verified');
    return address.toLowerCase();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      throw error;
    }
    logger.error({ address, error }, 'Signature verification failed');
    throw new UnauthorizedError('Invalid wallet signature');
  }
}
