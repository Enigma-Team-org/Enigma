import { NextRequest, NextResponse } from 'next/server';
import { registerEndpointSchema } from '@/lib/utils/endpoint-validation';
import { registerEndpoint } from '@/services/endpoint-service';
import { NotFoundError } from '@/lib/utils/errors';
import { logger } from '@/lib/utils/logger';

const log = logger.child({ module: 'api-agents-register-endpoint' });

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = registerEndpointSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: { message: 'Validation failed', code: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors } },
        { status: 400 },
      );
    }

    const endpoint = await registerEndpoint(parsed.data);

    return NextResponse.json({
      data: endpoint,
      error: null,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { data: null, error: { message: error.message, code: 'NOT_FOUND' } },
        { status: 404 },
      );
    }
    log.error({ error }, 'Failed to register endpoint');
    return NextResponse.json(
      { data: null, error: { message: 'Internal server error', code: 'INTERNAL_ERROR' } },
      { status: 500 },
    );
  }
}
