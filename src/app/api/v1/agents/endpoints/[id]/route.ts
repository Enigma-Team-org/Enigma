import { NextRequest, NextResponse } from 'next/server';
import { updateEndpointSchema } from '@/lib/utils/endpoint-validation';
import { getEndpointById, updateEndpoint } from '@/services/endpoint-service';
import { NotFoundError } from '@/lib/utils/errors';
import { logger } from '@/lib/utils/logger';

const log = logger.child({ module: 'api-agents-endpoints-detail' });

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const endpoint = await getEndpointById(id);

    return NextResponse.json({
      data: endpoint,
      error: null,
    });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { data: null, error: { message: error.message, code: 'NOT_FOUND' } },
        { status: 404 },
      );
    }
    log.error({ error }, 'Failed to get endpoint');
    return NextResponse.json(
      { data: null, error: { message: 'Internal server error', code: 'INTERNAL_ERROR' } },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = updateEndpointSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: { message: 'Validation failed', code: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors } },
        { status: 400 },
      );
    }

    const endpoint = await updateEndpoint(id, parsed.data);

    return NextResponse.json({
      data: endpoint,
      error: null,
    });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { data: null, error: { message: error.message, code: 'NOT_FOUND' } },
        { status: 404 },
      );
    }
    log.error({ error }, 'Failed to update endpoint');
    return NextResponse.json(
      { data: null, error: { message: 'Internal server error', code: 'INTERNAL_ERROR' } },
      { status: 500 },
    );
  }
}
