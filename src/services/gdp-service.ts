import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/database/prisma';
import { createLogger } from '@/lib/utils/logger';

type Decimal = Prisma.Decimal;
const Decimal = Prisma.Decimal;

const log = createLogger('gdp-service');

/**
 * Get start and end of a given date (UTC boundaries)
 */
function getDateBoundaries(date: Date): { start: Date; end: Date } {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

/**
 * Calculate and upsert a GDP snapshot for a specific date.
 * Aggregates payments, burns, deals, agents, and services.
 */
export async function calculateDailySnapshot(date: Date) {
  const { start, end } = getDateBoundaries(date);

  log.info({ date: start.toISOString() }, 'Calculating daily GDP snapshot');

  const [payments, burns, deals, newAgents, activeAgents, totalServices] = await Promise.all([
    // Completed payments for the date
    prisma.payment.aggregate({
      where: {
        status: 'COMPLETED',
        createdAt: { gte: start, lte: end },
      },
      _count: { id: true },
      _sum: { amountUsd: true },
    }),
    // Burn records for the date
    prisma.burnRecord.aggregate({
      where: {
        createdAt: { gte: start, lte: end },
      },
      _count: { id: true },
      _sum: { amountInUsd: true },
    }),
    // Completed deals for the date
    prisma.deal.aggregate({
      where: {
        status: 'COMPLETED',
        completedAt: { gte: start, lte: end },
      },
      _count: { id: true },
      _sum: { agreedPriceUsd: true },
    }),
    // New agents registered on this date
    prisma.agent.count({
      where: {
        created_at: { gte: start, lte: end },
      },
    }),
    // Currently active agents (verified or pending)
    prisma.agent.count({
      where: {
        status: { in: ['VERIFIED', 'PENDING'] },
      },
    }),
    // Active services
    prisma.agentService.count({
      where: { isActive: true },
    }),
  ]);

  const snapshot = await prisma.gdpSnapshot.upsert({
    where: { date: start },
    update: {
      totalPayments: payments._count.id ?? 0,
      paymentVolumeUsd: payments._sum.amountUsd ?? new Decimal(0),
      totalBurns: burns._count.id ?? 0,
      burnVolumeUsd: burns._sum.amountInUsd ?? new Decimal(0),
      totalDeals: deals._count.id ?? 0,
      dealVolumeUsd: deals._sum.agreedPriceUsd ?? new Decimal(0),
      activeAgents,
      newAgents,
      totalServices,
    },
    create: {
      date: start,
      totalPayments: payments._count.id ?? 0,
      paymentVolumeUsd: payments._sum.amountUsd ?? new Decimal(0),
      totalBurns: burns._count.id ?? 0,
      burnVolumeUsd: burns._sum.amountInUsd ?? new Decimal(0),
      totalDeals: deals._count.id ?? 0,
      dealVolumeUsd: deals._sum.agreedPriceUsd ?? new Decimal(0),
      activeAgents,
      newAgents,
      totalServices,
    },
  });

  log.info(
    {
      date: start.toISOString(),
      totalPayments: snapshot.totalPayments,
      paymentVolumeUsd: snapshot.paymentVolumeUsd.toString(),
      totalBurns: snapshot.totalBurns,
      totalDeals: snapshot.totalDeals,
      activeAgents: snapshot.activeAgents,
    },
    'GDP snapshot saved'
  );

  return snapshot;
}

/**
 * Get the most recent GDP snapshot.
 */
export async function getLatestSnapshot() {
  return prisma.gdpSnapshot.findFirst({
    orderBy: { date: 'desc' },
  });
}

/**
 * Get the GDP dashboard: latest snapshot, all-time totals, and day-over-day growth.
 */
export async function getGdpDashboard() {
  const [latest, totals] = await Promise.all([
    getLatestSnapshot(),
    prisma.gdpSnapshot.aggregate({
      _sum: {
        paymentVolumeUsd: true,
        burnVolumeUsd: true,
        dealVolumeUsd: true,
      },
    }),
  ]);

  // Calculate growth: compare today vs yesterday
  let growth = { paymentGrowth: 0, burnGrowth: 0, dealGrowth: 0 };

  if (latest) {
    const previousDay = new Date(latest.date);
    previousDay.setDate(previousDay.getDate() - 1);
    const { start: prevStart } = getDateBoundaries(previousDay);

    const yesterday = await prisma.gdpSnapshot.findUnique({
      where: { date: prevStart },
    });

    if (yesterday) {
      growth = {
        paymentGrowth: calculateGrowthPct(
          Number(yesterday.paymentVolumeUsd),
          Number(latest.paymentVolumeUsd)
        ),
        burnGrowth: calculateGrowthPct(
          Number(yesterday.burnVolumeUsd),
          Number(latest.burnVolumeUsd)
        ),
        dealGrowth: calculateGrowthPct(
          Number(yesterday.dealVolumeUsd),
          Number(latest.dealVolumeUsd)
        ),
      };
    }
  }

  return {
    latest,
    totals: {
      paymentVolumeUsd: totals._sum.paymentVolumeUsd?.toString() ?? '0',
      burnVolumeUsd: totals._sum.burnVolumeUsd?.toString() ?? '0',
      dealVolumeUsd: totals._sum.dealVolumeUsd?.toString() ?? '0',
    },
    growth,
  };
}

/**
 * Get GDP history for the last N days (default 30), ordered by date ascending.
 */
export async function getGdpHistory(options: { days?: number } = {}) {
  const { days = 30 } = options;

  const since = new Date();
  since.setDate(since.getDate() - days);
  since.setHours(0, 0, 0, 0);

  return prisma.gdpSnapshot.findMany({
    where: {
      date: { gte: since },
    },
    orderBy: { date: 'asc' },
  });
}

/**
 * Get key performance indicators for GDP.
 */
export async function getGdpKpis() {
  const allSnapshots = await prisma.gdpSnapshot.findMany({
    orderBy: { date: 'asc' },
  });

  if (allSnapshots.length === 0) {
    return {
      totalEconomicVolume: '0',
      avgDailyVolume: '0',
      peakDay: null,
      currentStreak: 0,
    };
  }

  // Total economic volume (all-time)
  let totalEconomicVolume = new Decimal(0);
  let peakVolume = new Decimal(0);
  let peakDay: Date | null = null;

  for (const snap of allSnapshots) {
    const dayTotal = new Decimal(snap.paymentVolumeUsd)
      .plus(snap.burnVolumeUsd)
      .plus(snap.dealVolumeUsd);
    totalEconomicVolume = totalEconomicVolume.plus(dayTotal);

    if (dayTotal.greaterThan(peakVolume)) {
      peakVolume = dayTotal;
      peakDay = snap.date;
    }
  }

  // Average daily volume
  const firstDate = allSnapshots[0].date;
  const lastDate = allSnapshots[allSnapshots.length - 1].date;
  const daySpan = Math.max(
    1,
    Math.ceil((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
  );
  const avgDailyVolume = totalEconomicVolume.dividedBy(daySpan);

  // Current streak: consecutive days with > 0 activity (from most recent backwards)
  let currentStreak = 0;
  for (let i = allSnapshots.length - 1; i >= 0; i--) {
    const snap = allSnapshots[i];
    const dayTotal = new Decimal(snap.paymentVolumeUsd)
      .plus(snap.burnVolumeUsd)
      .plus(snap.dealVolumeUsd);

    if (dayTotal.greaterThan(0)) {
      currentStreak++;
    } else {
      break;
    }
  }

  return {
    totalEconomicVolume: totalEconomicVolume.toString(),
    avgDailyVolume: avgDailyVolume.toFixed(2),
    peakDay,
    currentStreak,
  };
}

/**
 * Calculate percentage growth between two values.
 */
function calculateGrowthPct(previous: number, current: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Number((((current - previous) / previous) * 100).toFixed(2));
}
