import { NextResponse } from 'next/server';
import { getGdpDashboard, getGdpKpis } from '@/services/gdp-service';
import { logger } from '@/lib/utils/logger';

const log = logger.child({ module: 'api-gdp-dashboard' });

export async function GET() {
  try {
    const [dashboard, kpis] = await Promise.all([getGdpDashboard(), getGdpKpis()]);

    return NextResponse.json({ data: { ...dashboard, kpis }, error: null });
  } catch (error) {
    log.error({ error }, 'Failed to fetch GDP dashboard');
    return NextResponse.json(
      { data: null, error: { message: 'Internal server error', code: 'INTERNAL_ERROR' } },
      { status: 500 }
    );
  }
}
