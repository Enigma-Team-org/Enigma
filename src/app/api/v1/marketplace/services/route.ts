import { NextRequest, NextResponse } from 'next/server';
import { listServicesSchema, createServiceSchema } from '@/lib/utils/marketplace-validation';
import { listServices, createService } from '@/services/marketplace-service';
import { logger } from '@/lib/utils/logger';

const log = logger.child({ module: 'api-marketplace-services' });

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const parsed = listServicesSchema.safeParse({
      category: searchParams.get('category') ?? undefined,
      agentAddress: searchParams.get('agentAddress') ?? undefined,
      isActive: searchParams.get('isActive') ?? undefined,
      page: searchParams.get('page') ?? '1',
      limit: searchParams.get('limit') ?? '20',
    });

    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: { message: 'Validation failed', code: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors } },
        { status: 400 }
      );
    }

    const result = await listServices(parsed.data);

    return NextResponse.json({
      data: result,
      error: null,
    });
  } catch (error) {
    log.error({ error }, 'Failed to list services');
    return NextResponse.json(
      { data: null, error: { message: 'Internal server error', code: 'INTERNAL_ERROR' } },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createServiceSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: { message: 'Validation failed', code: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors } },
        { status: 400 }
      );
    }

    const service = await createService(parsed.data);

    return NextResponse.json({
      data: service,
      error: null,
    }, { status: 201 });
  } catch (error) {
    log.error({ error }, 'Failed to create service');
    return NextResponse.json(
      { data: null, error: { message: 'Internal server error', code: 'INTERNAL_ERROR' } },
      { status: 500 }
    );
  }
}
