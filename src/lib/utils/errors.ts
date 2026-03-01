/**
 * Custom error classes for consistent error handling
 * @see docs/standards/error-handling.md
 */

export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'PAYMENT_REQUIRED'
  | 'PAYMENT_FAILED'
  | 'RATE_LIMIT_EXCEEDED'
  | 'INTERNAL_ERROR'
  | 'BLOCKCHAIN_ERROR'
  | 'CONTRACT_NOT_FOUND'
  | 'RPC_ERROR'
  | 'TRANSACTION_FAILED';

export interface ErrorJson {
  error: {
    message: string;
    code: ErrorCode;
    statusCode: number;
    fields?: Record<string, string>;
  };
}

/**
 * Base error class for all application errors
 */
export class AppError extends Error {
  constructor(
    public override message: string,
    public statusCode: number,
    public code: ErrorCode,
    public fields?: Record<string, string>
  ) {
    super(message);
    this.name = 'AppError';
    Object.setPrototypeOf(this, AppError.prototype);
  }

  toJSON(): ErrorJson {
    return {
      error: {
        message: this.message,
        code: this.code,
        statusCode: this.statusCode,
        ...(this.fields && { fields: this.fields }),
      },
    };
  }
}

/**
 * Validation error for request validation failures (400)
 */
export class ValidationError extends AppError {
  constructor(message: string, fields?: Record<string, string>) {
    super(message, 400, 'VALIDATION_ERROR', fields);
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Not found error for missing resources (404)
 */
export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

/**
 * Unauthorized error for authentication failures (401)
 */
export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
    this.name = 'UnauthorizedError';
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}

/**
 * Forbidden error for authorization failures (403)
 */
export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403, 'FORBIDDEN');
    this.name = 'ForbiddenError';
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }
}

/**
 * Rate limit error for too many requests (429)
 */
export class RateLimitError extends AppError {
  constructor(
    message = 'Too many requests',
    public retryAfter: number = 60
  ) {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
    this.name = 'RateLimitError';
    Object.setPrototypeOf(this, RateLimitError.prototype);
  }
}

/**
 * Payment required error for x402 gated content (402)
 */
export class PaymentRequiredError extends AppError {
  constructor(
    message = 'Payment required',
    public price?: string,
    public paymentType?: string
  ) {
    super(message, 402, 'PAYMENT_REQUIRED');
    this.name = 'PaymentRequiredError';
    Object.setPrototypeOf(this, PaymentRequiredError.prototype);
  }
}

/**
 * Payment failed error (422)
 */
export class PaymentFailedError extends AppError {
  constructor(message = 'Payment verification failed') {
    super(message, 422, 'PAYMENT_FAILED');
    this.name = 'PaymentFailedError';
    Object.setPrototypeOf(this, PaymentFailedError.prototype);
  }
}

/**
 * Internal server error (500)
 */
export class InternalError extends AppError {
  constructor(message = 'Internal server error') {
    super(message, 500, 'INTERNAL_ERROR');
    this.name = 'InternalError';
    Object.setPrototypeOf(this, InternalError.prototype);
  }
}

/**
 * Base blockchain error for Web3/RPC issues (502)
 */
export class BlockchainError extends AppError {
  constructor(
    message: string,
    code: ErrorCode = 'BLOCKCHAIN_ERROR',
    statusCode = 502
  ) {
    super(message, statusCode, code);
    this.name = 'BlockchainError';
    Object.setPrototypeOf(this, BlockchainError.prototype);
  }
}

/**
 * Contract not found on blockchain
 */
export class ContractNotFoundError extends BlockchainError {
  constructor(address: string) {
    super(`Contract not found at address: ${address}`, 'CONTRACT_NOT_FOUND');
    this.name = 'ContractNotFoundError';
    Object.setPrototypeOf(this, ContractNotFoundError.prototype);
  }
}

/**
 * RPC communication error
 */
export class RPCError extends BlockchainError {
  constructor(message = 'RPC communication failed') {
    super(message, 'RPC_ERROR');
    this.name = 'RPCError';
    Object.setPrototypeOf(this, RPCError.prototype);
  }
}

/**
 * Transaction execution failed
 */
export class TransactionFailedError extends BlockchainError {
  constructor(
    message = 'Transaction failed',
    public txHash?: string
  ) {
    super(message, 'TRANSACTION_FAILED');
    this.name = 'TransactionFailedError';
    Object.setPrototypeOf(this, TransactionFailedError.prototype);
  }
}

/**
 * Type guard to check if an error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
