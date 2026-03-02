import { NextRequest, NextResponse } from 'next/server';
import { discoverEndpointsSchema } from '@/lib/utils/endpoint-validation';
import { discoverEndpoints } from '@/services/endpoint-service';
import { logger } from '@/lib/utils/logger';

const log = logger.child({ module: 'api-agents-discover' });

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const parsed = discoverEndpointsSchema.safeParse({
      capability: searchParams.get('capability') ?? undefined,
      maxPrice: searchParams.get('maxPrice') ?? undefined,
      minTrust: searchParams.get('minTrust') ?? undefined,
      type: searchParams.get('type') ?? undefined,
      page: searchParams.get('page') ?? '1',
      limit: searchParams.get('limit') ?? '20',
    });

    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: { message: 'Validation failed', code: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors } },
        { status: 400 },
      );
    }

    const result = await discoverEndpoints(parsed.data);

    return NextResponse.json({
      data: result,
      error: null,
    });
  } catch (error) {
    log.error({ error }, 'Failed to discover endpoints');
    return NextResponse.json(
      { data: null, error: { message: 'Internal server error', code: 'INTERNAL_ERROR' } },
      { status: 500 },
    );
  }
}
