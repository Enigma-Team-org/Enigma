import { prisma } from '@/lib/database/prisma';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('signal-service');

export type SignalType =
  | 'NEW_ENTRY'       // Agent registered < 7 days ago
  | 'RISING_STAR'     // 3+ ratings in last 7 days
  | 'TOP_RATED'       // Average rating >= 4.5
  | 'MOST_ACTIVE'     // Most A2A transactions in last 7 days
  | 'SENTINEL_PERFECT' // Sentinel 100% score
  | 'PREMIUM';        // Premium verified tier

export interface AgentSignal {
  type: SignalType;
  label: string;
  color: string;    // tailwind color class
  bgColor: string;  // background
}

const SIGNAL_CONFIG: Record<SignalType, Omit<AgentSignal, 'type'>> = {
  NEW_ENTRY:        { label: 'New',        color: 'text-[#A78BFA]', bgColor: 'bg-[rgba(167,139,250,0.1)]' },
  RISING_STAR:      { label: 'Rising',     color: 'text-[#FCD34D]', bgColor: 'bg-[rgba(252,211,77,0.1)]' },
  TOP_RATED:        { label: 'Top Rated',  color: 'text-[#FB923C]', bgColor: 'bg-[rgba(251,146,60,0.1)]' },
  MOST_ACTIVE:      { label: 'Active',     color: 'text-[#22D3EE]', bgColor: 'bg-[rgba(34,211,238,0.1)]' },
  SENTINEL_PERFECT: { label: '100%',       color: 'text-[#4ADE80]', bgColor: 'bg-[rgba(74,222,128,0.1)]' },
  PREMIUM:          { label: 'Premium',    color: 'text-[#F59E0B]', bgColor: 'bg-[rgba(245,158,11,0.1)]' },
};

/**
 * Calculate signal badges for a set of agents (batch)
 * Returns a map of agentAddress -> signals[]
 */
export async function calculateSignals(
  agentAddresses: string[]
): Promise<Record<string, AgentSignal[]>> {
  if (agentAddresses.length === 0) return {};

  const addresses = agentAddresses.map((a) => a.toLowerCase());
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // Fetch all needed data in parallel
  const [agents, ratingCounts, avgRatings, txCounts, sentinelScores] = await Promise.all([
    // Agent basic info (for age + verified_tier)
    prisma.agent.findMany({
      where: { address: { in: addresses } },
      select: { address: true, created_at: true, verified_tier: true },
    }),

    // Ratings in last 7 days per agent
    prisma.rating.groupBy({
      by: ['agentId'],
      where: { agentId: { in: addresses }, createdAt: { gte: sevenDaysAgo } },
      _count: { id: true },
    }),

    // Average rating per agent (all time)
    prisma.rating.groupBy({
      by: ['agentId'],
      where: { agentId: { in: addresses } },
      _avg: { rating: true },
      _count: { id: true },
    }),

    // A2A transaction count in last 7 days
    prisma.agentTransaction.groupBy({
      by: ['fromAgentAddress'],
      where: { fromAgentAddress: { in: addresses }, createdAt: { gte: sevenDaysAgo } },
      _count: { id: true },
    }),

    // Latest sentinel score per agent
    prisma.sentinelValidation.findMany({
      where: { agentAddress: { in: addresses } },
      orderBy: { createdAt: 'desc' },
      distinct: ['agentAddress'],
      select: { agentAddress: true, totalScore: true, maxScore: true },
    }),
  ]);

  // Build lookup maps
  const agentMap = new Map(agents.map((a) => [a.address, a]));
  const recentRatingMap = new Map(ratingCounts.map((r) => [r.agentId, r._count.id]));
  const avgRatingMap = new Map(
    avgRatings
      .filter((r) => r._count.id >= 2) // need at least 2 ratings
      .map((r) => [r.agentId, r._avg.rating ?? 0])
  );
  const txCountMap = new Map(txCounts.map((t) => [t.fromAgentAddress, t._count.id]));
  const sentinelMap = new Map(sentinelScores.map((s) => [s.agentAddress, s]));

  // Find the most active agent for "MOST_ACTIVE" badge (relative)
  let maxTxCount = 0;
  let mostActiveAddress = '';
  for (const [addr, count] of txCountMap) {
    if (count > maxTxCount) {
      maxTxCount = count;
      mostActiveAddress = addr;
    }
  }

  // Calculate signals for each agent
  const result: Record<string, AgentSignal[]> = {};

  for (const addr of addresses) {
    const signals: AgentSignal[] = [];
    const agent = agentMap.get(addr);

    if (!agent) continue;

    // NEW_ENTRY: registered < 7 days ago
    if (agent.created_at.getTime() > sevenDaysAgo.getTime()) {
      signals.push({ type: 'NEW_ENTRY', ...SIGNAL_CONFIG.NEW_ENTRY });
    }

    // PREMIUM: premium verified tier
    if (agent.verified_tier === 'PREMIUM') {
      signals.push({ type: 'PREMIUM', ...SIGNAL_CONFIG.PREMIUM });
    }

    // RISING_STAR: 3+ ratings in last 7 days
    const recentRatings = recentRatingMap.get(addr) ?? 0;
    if (recentRatings >= 3) {
      signals.push({ type: 'RISING_STAR', ...SIGNAL_CONFIG.RISING_STAR });
    }

    // TOP_RATED: avg rating >= 4.5 (min 2 ratings)
    const avgRating = avgRatingMap.get(addr);
    if (avgRating !== undefined && avgRating >= 4.5) {
      signals.push({ type: 'TOP_RATED', ...SIGNAL_CONFIG.TOP_RATED });
    }

    // MOST_ACTIVE: agent with most transactions (only 1 gets this)
    if (addr === mostActiveAddress && maxTxCount >= 2) {
      signals.push({ type: 'MOST_ACTIVE', ...SIGNAL_CONFIG.MOST_ACTIVE });
    }

    // SENTINEL_PERFECT: 100% sentinel score
    const sentinel = sentinelMap.get(addr);
    if (sentinel && sentinel.totalScore === sentinel.maxScore && sentinel.maxScore > 0) {
      signals.push({ type: 'SENTINEL_PERFECT', ...SIGNAL_CONFIG.SENTINEL_PERFECT });
    }

    if (signals.length > 0) {
      result[addr] = signals;
    }
  }

  return result;
}
