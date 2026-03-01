import { prisma } from '@/lib/database/prisma';
import { createLogger } from '@/lib/utils/logger';
import { calculateTrustScore, type TrustScoreBreakdown } from './trust-score-service';
import { calculateTRACERScore, type AgentData, type TRACERBreakdown } from './tracer-score-service';
import { getLatestValidation } from './centinela/sentinel-validator';

const logger = createLogger('combined-trust-score');

/**
 * Combined Trust Score v2 Weights
 * Infrastructure(50%) + Community(20%) + Correlation(15%) + RL(15%)
 */
export const COMBINED_WEIGHTS = {
  infrastructure: 0.50,
  community: 0.20,
  correlation: 0.15,
  rl: 0.15,
} as const;

export interface CombinedScoreBreakdown {
  v1Score: number;
  v2Score: number;
  tracerScore: number;
  sentinelScore: number | null;
  sentinelVerdict: string | null;
  classification: string;
  pillars: {
    infrastructure: { score: number; weighted: number };
    community: { score: number; weighted: number };
    correlation: { score: number; weighted: number };
    rl: { score: number; weighted: number };
  };
  tracerDimensions: {
    trust: { score: number; weight: number; contribution: number };
    reliability: { score: number; weight: number; contribution: number };
    autonomy: { score: number; weight: number; contribution: number };
    capability: { score: number; weight: number; contribution: number };
    economics: { score: number; weight: number; contribution: number };
    reputation: { score: number; weight: number; contribution: number };
  };
  lastUpdated: Date;
}

/**
 * Calculate Infrastructure pillar (50%)
 * Combines v1 reliability metrics + TRACER reliability + Sentinel validation
 */
function calculateInfrastructure(
  v1: TrustScoreBreakdown,
  tracer: TRACERBreakdown,
  sentinelNormalized: number | null
): number {
  const uptimeV1 = v1.breakdown.uptime.score;
  const proxyV1 = v1.breakdown.proxy.score;
  const reliabilityTracer = tracer.dimensions.reliability.score;
  const ozMatch = v1.breakdown.ozMatch.score;

  if (sentinelNormalized !== null) {
    // With Sentinel data: blend all 5 signals
    const score = Math.round(
      uptimeV1 * 0.20 +
      reliabilityTracer * 0.20 +
      proxyV1 * 0.15 +
      ozMatch * 0.10 +
      sentinelNormalized * 0.35 // Sentinel is the strongest infra signal
    );
    return Math.min(score, 100);
  }

  // Without Sentinel: original 4-signal blend
  const score = Math.round(
    uptimeV1 * 0.30 +
    reliabilityTracer * 0.30 +
    proxyV1 * 0.25 +
    ozMatch * 0.15
  );

  return Math.min(score, 100);
}

/**
 * Calculate Community pillar (20%)
 * Ratings + TRACER reputation
 */
function calculateCommunity(
  v1: TrustScoreBreakdown,
  tracer: TRACERBreakdown
): number {
  const ratingsV1 = v1.breakdown.ratings.score;
  const reputationTracer = tracer.dimensions.reputation.score;

  const score = Math.round(ratingsV1 * 0.55 + reputationTracer * 0.45);
  return Math.min(score, 100);
}

/**
 * Calculate Correlation pillar (15%)
 * Cross-validation of multiple dimensions
 */
function calculateCorrelation(tracer: TRACERBreakdown): number {
  const trust = tracer.dimensions.trust.score;
  const capability = tracer.dimensions.capability.score;
  const economics = tracer.dimensions.economics.score;
  const autonomy = tracer.dimensions.autonomy.score;

  // Average of cross-dimensional signals
  const avg = (trust + capability + economics + autonomy) / 4;

  // Penalize high variance (inconsistent signals)
  const values = [trust, capability, economics, autonomy];
  const variance = values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);
  const consistencyBonus = Math.max(0, 20 - stdDev * 0.3);

  const score = Math.round(avg * 0.7 + consistencyBonus * 1.5);
  return Math.min(score, 100);
}

/**
 * Calculate Reinforcement Learning pillar (15%)
 * Historical trend + consistency over time
 */
async function calculateRL(agentAddress: string): Promise<number> {
  const snapshots = await prisma.trustScore.findMany({
    where: { agentId: agentAddress },
    orderBy: { calculatedAt: 'asc' },
    take: 20,
    select: { overallScore: true, calculatedAt: true },
  });

  if (snapshots.length < 2) {
    return 50; // Default for agents with insufficient history
  }

  const scores = snapshots.map((s) => s.overallScore * 100);

  // Trend: compare recent avg vs older avg
  const mid = Math.floor(scores.length / 2);
  const olderAvg = scores.slice(0, mid).reduce((a, b) => a + b, 0) / mid;
  const recentAvg = scores.slice(mid).reduce((a, b) => a + b, 0) / (scores.length - mid);

  const trendScore = recentAvg >= olderAvg
    ? Math.min(60 + (recentAvg - olderAvg) * 2, 80)
    : Math.max(20, 60 - (olderAvg - recentAvg) * 2);

  // Consistency: low variance = higher score
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  const variance = scores.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / scores.length;
  const cv = avg > 0 ? Math.sqrt(variance) / avg : 1;
  const consistencyScore = cv < 0.05 ? 100 : cv < 0.15 ? 80 : cv < 0.30 ? 60 : 40;

  return Math.round(trendScore * 0.5 + consistencyScore * 0.5);
}

/**
 * Extract infra signals from Sentinel validation checks
 */
function extractSentinelInfra(validation: { checks: unknown } | null): {
  healthPassed: boolean;
  tlsPassed: boolean;
  latencyMs: number | null;
  a2aPassed: boolean;
  mcpPassed: boolean;
  metadataComplete: boolean;
} {
  const defaults = {
    healthPassed: false,
    tlsPassed: false,
    latencyMs: null as number | null,
    a2aPassed: false,
    mcpPassed: false,
    metadataComplete: false,
  };

  if (!validation?.checks || !Array.isArray(validation.checks)) return defaults;

  const checks = validation.checks as Array<{ check: string; passed: boolean; details: string }>;

  for (const c of checks) {
    switch (c.check) {
      case 'HEALTH_2XX': defaults.healthPassed = c.passed; break;
      case 'TLS_VALID': defaults.tlsPassed = c.passed; break;
      case 'LATENCY_P95_OK': {
        defaults.latencyMs = null;
        // Extract latency from details like "p95 latency: 342ms"
        const match = c.details.match(/(\d+)ms/);
        if (match) defaults.latencyMs = parseInt(match[1]);
        break;
      }
      case 'A2A_CARD_ACCESSIBLE': defaults.a2aPassed = c.passed; break;
      case 'MCP_ENDPOINT_OK': defaults.mcpPassed = c.passed; break;
      case 'METADATA_COMPLETE': defaults.metadataComplete = c.passed; break;
    }
  }

  return defaults;
}

/**
 * Build AgentData for TRACER calculation from DB
 * Enriches with Sentinel validation data when available
 */
async function buildAgentDataForTracer(agentAddress: string): Promise<AgentData> {
  const agent = await prisma.agent.findUnique({
    where: { address: agentAddress },
    include: {
      ratings: { select: { rating: true } },
      heartbeatLogs: {
        where: { timestamp: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
        select: { result: true, responseTimeMs: true },
      },
      transactionVolumes: {
        where: { period: 'DAY' },
        select: { volumeAvax: true, txCount: true },
      },
      trustScores: { select: { id: true } },
    },
  });

  if (!agent) throw new Error(`Agent not found: ${agentAddress}`);

  // Get Sentinel data to enrich TRACER inputs
  const sentinelValidation = await getLatestValidation(agentAddress);
  const sentinel = extractSentinelInfra(sentinelValidation);

  const totalHeartbeatsAllTime = await prisma.heartbeatLog.count({
    where: { agentAddress },
  });

  const heartbeatCount = agent.heartbeatLogs.length;
  const passedHeartbeats = agent.heartbeatLogs.filter((h) => h.result === 'PASS').length;

  const responseTimes = agent.heartbeatLogs
    .filter((h) => h.responseTimeMs !== null)
    .map((h) => h.responseTimeMs as number);

  let avgResponseTimeMs = responseTimes.length > 0
    ? responseTimes.reduce((s, t) => s + t, 0) / responseTimes.length
    : 0;

  // If no heartbeat data but Sentinel has latency, use that
  if (responseTimes.length === 0 && sentinel.latencyMs !== null) {
    avgResponseTimeMs = sentinel.latencyMs;
  }

  let responseTimeStdDev = 0;
  if (responseTimes.length > 1) {
    const variance = responseTimes.reduce(
      (sum, t) => sum + Math.pow(t - avgResponseTimeMs, 2), 0
    ) / responseTimes.length;
    responseTimeStdDev = Math.sqrt(variance);
  }

  // Calculate uptime: prefer heartbeat data, fallback to Sentinel health check
  let uptime24h: number;
  if (heartbeatCount > 0) {
    uptime24h = (passedHeartbeats / heartbeatCount) * 100;
  } else if (sentinelValidation) {
    // Use Sentinel health + TLS as uptime proxy
    uptime24h = sentinel.healthPassed ? (sentinel.tlsPassed ? 95 : 70) : 0;
  } else {
    uptime24h = 0; // Unknown = 0, not 100
  }

  // Derive heartbeat-like counts from Sentinel for agents with no heartbeats
  const effectiveHeartbeatCount = heartbeatCount > 0 ? heartbeatCount : (sentinelValidation ? 1 : 0);
  const effectivePassedHeartbeats = heartbeatCount > 0 ? passedHeartbeats
    : (sentinel.healthPassed ? 1 : 0);
  const effectiveTotalHeartbeats = totalHeartbeatsAllTime > 0
    ? totalHeartbeatsAllTime
    : (sentinelValidation ? 1 : 0);

  const volumeData = agent.transactionVolumes[0];
  const metadata = (agent.metadata as Record<string, unknown>) || {};
  const capabilities = (metadata.capabilities as Record<string, unknown>) || {};
  const services = (metadata.services as Array<Record<string, unknown>>) || [];

  // Enrich capability detection with Sentinel data
  const hasA2a = sentinel.a2aPassed || !!(capabilities.a2a || metadata.a2a);
  const hasMcp = sentinel.mcpPassed;

  // Skills: count verified skills from Sentinel (A2A + MCP count as verified)
  const declaredSkills = services.map((s) => (s.name as string) || '').filter(Boolean);
  const verifiedSkills = services
    .filter((s) => s.verified === true)
    .map((s) => (s.name as string) || '')
    .filter(Boolean);

  // If Sentinel verified A2A/MCP, add to verified skills
  if (sentinel.a2aPassed && !verifiedSkills.includes('a2a')) verifiedSkills.push('a2a');
  if (sentinel.mcpPassed && !verifiedSkills.includes('mcp')) verifiedSkills.push('mcp');
  if (sentinel.a2aPassed && !declaredSkills.includes('a2a')) declaredSkills.push('a2a');
  if (sentinel.mcpPassed && !declaredSkills.includes('mcp')) declaredSkills.push('mcp');

  return {
    address: agentAddress,
    isProxy: agent.is_proxy,
    proxyType: agent.proxy_type,
    uptime24h,
    avgResponseTimeMs,
    responseTimeStdDev,
    heartbeatCount: effectiveHeartbeatCount,
    passedHeartbeats: effectivePassedHeartbeats,
    totalHeartbeatsAllTime: effectiveTotalHeartbeats,
    volumeAvax: volumeData ? Number(volumeData.volumeAvax) : 0,
    txCount: volumeData?.txCount || 0,
    ratings: agent.ratings.map((r) => r.rating),
    daysSinceRegistration: Math.floor(
      (Date.now() - agent.created_at.getTime()) / (1000 * 60 * 60 * 24)
    ),
    hasVerifiedWallet: !!agent.billing_address,
    isOpenSource: !!(metadata.open_source || metadata.openSource || capabilities.open_source),
    hasAudits: !!(metadata.audited || metadata.audit || capabilities.audited),
    skillsDeclared: declaredSkills,
    skillsVerified: verifiedSkills,
    canDelegate: hasA2a,
    hasAutoRecovery: !!(capabilities.auto_recovery || capabilities.autoRecovery),
    delegatedTasksCount: Number(capabilities.delegated_tasks || 0),
    trustScoreSnapshots: agent.trustScores.length,
  };
}

/**
 * Calculate Combined Trust Score v2 for an agent
 */
export async function calculateCombinedTrustScore(
  agentAddress: string
): Promise<CombinedScoreBreakdown> {
  const normalizedAddress = agentAddress.toLowerCase();

  logger.info({ address: normalizedAddress }, 'Calculating Combined Trust Score v2');

  // Calculate v1
  const v1 = await calculateTrustScore(normalizedAddress);

  // Calculate TRACER
  const agentData = await buildAgentDataForTracer(normalizedAddress);
  const tracer = calculateTRACERScore(agentData);

  // Get Sentinel validation if available
  const sentinelValidation = await getLatestValidation(normalizedAddress);
  const sentinelNormalized = sentinelValidation
    ? Math.round((sentinelValidation.totalScore / sentinelValidation.maxScore) * 100)
    : null;

  // Calculate 4 pillars
  const infrastructure = calculateInfrastructure(v1, tracer, sentinelNormalized);
  const community = calculateCommunity(v1, tracer);
  const correlation = calculateCorrelation(tracer);
  const rl = await calculateRL(normalizedAddress);

  // Combine
  const v2Score = Math.round(
    infrastructure * COMBINED_WEIGHTS.infrastructure +
    community * COMBINED_WEIGHTS.community +
    correlation * COMBINED_WEIGHTS.correlation +
    rl * COMBINED_WEIGHTS.rl
  );

  const classification = v2Score >= 90 ? 'excellent'
    : v2Score >= 75 ? 'good'
    : v2Score >= 60 ? 'acceptable'
    : v2Score >= 40 ? 'poor'
    : 'unreliable';

  logger.info({
    address: normalizedAddress,
    v1: v1.score,
    tracer: tracer.score,
    sentinel: sentinelNormalized,
    v2: v2Score,
    classification,
  });

  return {
    v1Score: v1.score,
    v2Score,
    tracerScore: tracer.score,
    sentinelScore: sentinelValidation?.totalScore ?? null,
    sentinelVerdict: sentinelValidation?.verdict ?? null,
    classification,
    pillars: {
      infrastructure: {
        score: infrastructure,
        weighted: Math.round(infrastructure * COMBINED_WEIGHTS.infrastructure),
      },
      community: {
        score: community,
        weighted: Math.round(community * COMBINED_WEIGHTS.community),
      },
      correlation: {
        score: correlation,
        weighted: Math.round(correlation * COMBINED_WEIGHTS.correlation),
      },
      rl: {
        score: rl,
        weighted: Math.round(rl * COMBINED_WEIGHTS.rl),
      },
    },
    tracerDimensions: {
      trust: { score: tracer.dimensions.trust.score, weight: tracer.dimensions.trust.weight, contribution: tracer.dimensions.trust.contribution },
      reliability: { score: tracer.dimensions.reliability.score, weight: tracer.dimensions.reliability.weight, contribution: tracer.dimensions.reliability.contribution },
      autonomy: { score: tracer.dimensions.autonomy.score, weight: tracer.dimensions.autonomy.weight, contribution: tracer.dimensions.autonomy.contribution },
      capability: { score: tracer.dimensions.capability.score, weight: tracer.dimensions.capability.weight, contribution: tracer.dimensions.capability.contribution },
      economics: { score: tracer.dimensions.economics.score, weight: tracer.dimensions.economics.weight, contribution: tracer.dimensions.economics.contribution },
      reputation: { score: tracer.dimensions.reputation.score, weight: tracer.dimensions.reputation.weight, contribution: tracer.dimensions.reputation.contribution },
    },
    lastUpdated: new Date(),
  };
}
