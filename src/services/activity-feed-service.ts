import { prisma } from '@/lib/database/prisma';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('activity-feed-service');

export type ActivityEventType =
  | 'AGENT_REGISTERED'
  | 'AGENT_VERIFIED'
  | 'RATING_RECEIVED'
  | 'SENTINEL_PASS'
  | 'SENTINEL_FAIL'
  | 'HEARTBEAT_OK'
  | 'HEARTBEAT_FAIL'
  | 'TRANSACTION'
  | 'ENDPOINT_ADDED'
  | 'STAR_ADDED';

export interface ActivityEvent {
  id: string;
  type: ActivityEventType;
  agentAddress: string;
  agentName: string;
  detail: string;
  timestamp: string;
  meta?: Record<string, unknown>;
}

/**
 * Fetch recent activity events across all event sources
 * Combines ratings, sentinel validations, heartbeats, transactions, and new agents
 */
export async function getActivityFeed(limit = 20): Promise<ActivityEvent[]> {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // last 7 days

  const [recentRatings, recentValidations, recentHeartbeats, recentTransactions, recentAgents, recentStars] =
    await Promise.all([
      // Recent ratings
      prisma.rating.findMany({
        where: { createdAt: { gte: since } },
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: { agent: { select: { name: true, address: true } } },
      }),
      // Recent sentinel validations
      prisma.sentinelValidation.findMany({
        where: { createdAt: { gte: since } },
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: { agent: { select: { name: true, address: true } } },
      }),
      // Recent heartbeats (only failures to avoid noise)
      prisma.heartbeatLog.findMany({
        where: { timestamp: { gte: since }, result: { not: 'PASS' } },
        orderBy: { timestamp: 'desc' },
        take: 5,
        include: { agent: { select: { name: true, address: true } } },
      }),
      // Recent A2A transactions
      prisma.agentTransaction.findMany({
        where: { createdAt: { gte: since } },
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: {
          fromAgent: { select: { name: true, address: true } },
          toAgent: { select: { name: true, address: true } },
        },
      }),
      // Recently registered agents
      prisma.agent.findMany({
        where: { created_at: { gte: since } },
        orderBy: { created_at: 'desc' },
        take: limit,
        select: { address: true, name: true, status: true, created_at: true, verified_tier: true },
      }),
      // Recent stars
      prisma.agentStar.findMany({
        where: { createdAt: { gte: since } },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { agent: { select: { name: true, address: true } } },
      }),
    ]);

  const events: ActivityEvent[] = [];

  // Map ratings
  for (const r of recentRatings) {
    events.push({
      id: `rating-${r.id}`,
      type: 'RATING_RECEIVED',
      agentAddress: r.agent.address,
      agentName: r.agent.name,
      detail: `Rated ${r.rating}/5${r.review ? ` — "${r.review.slice(0, 60)}"` : ''}`,
      timestamp: r.createdAt.toISOString(),
      meta: { rating: r.rating, reviewer: r.userAddress },
    });
  }

  // Map sentinel validations
  for (const v of recentValidations) {
    events.push({
      id: `sentinel-${v.id}`,
      type: v.verdict === 'PASS' ? 'SENTINEL_PASS' : 'SENTINEL_FAIL',
      agentAddress: v.agent.address,
      agentName: v.agent.name,
      detail: `Sentinel ${v.verdict} — ${v.totalScore}/${v.maxScore}`,
      timestamp: v.createdAt.toISOString(),
      meta: { score: v.totalScore, maxScore: v.maxScore, verdict: v.verdict },
    });
  }

  // Map failed heartbeats
  for (const h of recentHeartbeats) {
    events.push({
      id: `heartbeat-${h.id}`,
      type: 'HEARTBEAT_FAIL',
      agentAddress: h.agent.address,
      agentName: h.agent.name,
      detail: `Heartbeat ${h.result}${h.errorMessage ? ` — ${h.errorMessage.slice(0, 50)}` : ''}`,
      timestamp: h.timestamp.toISOString(),
    });
  }

  // Map transactions
  for (const tx of recentTransactions) {
    events.push({
      id: `tx-${tx.id}`,
      type: 'TRANSACTION',
      agentAddress: tx.fromAgent.address,
      agentName: tx.fromAgent.name,
      detail: `${tx.fromAgent.name} → ${tx.toAgent.name} ($${tx.amount} ${tx.token})`,
      timestamp: tx.createdAt.toISOString(),
      meta: { to: tx.toAgent.address, amount: tx.amount.toString(), token: tx.token },
    });
  }

  // Map new agents
  for (const a of recentAgents) {
    if (a.status === 'VERIFIED' && a.verified_tier) {
      events.push({
        id: `verified-${a.address}`,
        type: 'AGENT_VERIFIED',
        agentAddress: a.address,
        agentName: a.name,
        detail: `Verified (${a.verified_tier})`,
        timestamp: a.created_at.toISOString(),
      });
    } else {
      events.push({
        id: `registered-${a.address}`,
        type: 'AGENT_REGISTERED',
        agentAddress: a.address,
        agentName: a.name,
        detail: 'New agent indexed from ERC-8004 registry',
        timestamp: a.created_at.toISOString(),
      });
    }
  }

  // Map stars
  for (const s of recentStars) {
    events.push({
      id: `star-${s.id}`,
      type: 'STAR_ADDED',
      agentAddress: s.agent.address,
      agentName: s.agent.name,
      detail: `Starred by ${s.walletAddress.slice(0, 6)}...${s.walletAddress.slice(-4)}`,
      timestamp: s.createdAt.toISOString(),
      meta: { wallet: s.walletAddress },
    });
  }

  // Sort all events by timestamp DESC and return top N
  events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return events.slice(0, limit);
}
