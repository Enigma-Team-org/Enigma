import { prisma } from '@/lib/database/prisma';
import { createLogger } from '@/lib/utils/logger';
import { NotFoundError, ValidationError } from '@/lib/utils/errors';
import { hasValidPayment } from '@/services/payment-service';
import { calculateCombinedTrustScore } from '@/services/combined-trust-score-service';

const logger = createLogger('verification-service');

// ============================================
// TYPES
// ============================================

export interface VerificationCriterion {
  name: string;
  description: string;
  passed: boolean;
  detail: string;
}

export interface EligibilityResult {
  eligible: boolean;
  criteria: VerificationCriterion[];
  currentTier: string | null;
}

// ============================================
// CONSTANTS
// ============================================

const MIN_TRUST_SCORE = 60;
const MIN_ACCOUNT_AGE_DAYS = 7;

// ============================================
// ELIGIBILITY CHECK
// ============================================

/**
 * Check if an agent meets all automatic verification criteria.
 * Returns detailed breakdown of each criterion.
 */
export async function checkVerificationEligibility(agentAddress: string): Promise<EligibilityResult> {
  const agent = await prisma.agent.findUnique({
    where: { address: agentAddress.toLowerCase() },
    include: {
      reports: { where: { status: 'OPEN' } },
      sentinelValidations: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
  });

  if (!agent) {
    throw new NotFoundError(`Agent not found: ${agentAddress}`);
  }

  const criteria: VerificationCriterion[] = [];

  // 1. Registered in ERC-8004 (has token_id and registry_address)
  const hasRegistry = agent.token_id !== null && agent.registry_address !== null;
  criteria.push({
    name: 'erc8004_registered',
    description: 'Registered in ERC-8004 Identity Registry',
    passed: hasRegistry,
    detail: hasRegistry
      ? `Token #${agent.token_id} on ${agent.registry_address}`
      : 'Missing token_id or registry_address',
  });

  // 2. Valid metadata (name, description, services)
  const hasMetadata = Boolean(agent.name && agent.metadata);
  const metadata = agent.metadata as Record<string, unknown> | null;
  const hasServices = Array.isArray(metadata?.services) && (metadata?.services as unknown[]).length > 0;
  criteria.push({
    name: 'valid_metadata',
    description: 'Valid tokenURI with resolvable metadata',
    passed: hasMetadata && hasServices,
    detail: hasMetadata && hasServices
      ? `Name: ${agent.name}, ${(metadata?.services as unknown[]).length} service(s)`
      : 'Missing name, metadata, or services array',
  });

  // 3. Trust score v2 >= 60
  const combined = await calculateCombinedTrustScore(agentAddress.toLowerCase()).catch(() => null);
  const v2Score = combined?.v2Score ?? agent.trust_score;
  const hasMinScore = v2Score >= MIN_TRUST_SCORE;
  criteria.push({
    name: 'trust_score',
    description: `Trust score >= ${MIN_TRUST_SCORE}`,
    passed: hasMinScore,
    detail: `Current v2 score: ${v2Score}`,
  });

  // 4. No open reports
  const hasNoReports = agent.reports.length === 0;
  criteria.push({
    name: 'no_open_reports',
    description: 'No open reports',
    passed: hasNoReports,
    detail: hasNoReports ? 'Clean record' : `${agent.reports.length} open report(s)`,
  });

  // 5. Account age >= 7 days
  const ageDays = Math.floor((Date.now() - agent.created_at.getTime()) / (1000 * 60 * 60 * 24));
  const hasMinAge = ageDays >= MIN_ACCOUNT_AGE_DAYS;
  criteria.push({
    name: 'account_age',
    description: `Account age >= ${MIN_ACCOUNT_AGE_DAYS} days`,
    passed: hasMinAge,
    detail: `${ageDays} day(s) old`,
  });

  // 6. At least one service endpoint (MCP, A2A, web, or OASF)
  criteria.push({
    name: 'service_endpoint',
    description: 'At least one service endpoint defined',
    passed: hasServices,
    detail: hasServices
      ? `${(metadata?.services as unknown[]).length} endpoint(s) in metadata`
      : 'No service endpoints found',
  });

  // 7. Sentinel PASS
  const latestValidation = agent.sentinelValidations[0];
  const sentinelPass = latestValidation?.verdict === 'PASS';
  criteria.push({
    name: 'sentinel_pass',
    description: 'Sentinel validation verdict: PASS',
    passed: sentinelPass,
    detail: latestValidation
      ? `Verdict: ${latestValidation.verdict} (${latestValidation.totalScore}/${latestValidation.maxScore})`
      : 'No Sentinel validation found',
  });

  const eligible = criteria.every((c) => c.passed);

  logger.info(
    { agentAddress, eligible, passed: criteria.filter((c) => c.passed).length, total: criteria.length },
    'Checked verification eligibility',
  );

  return {
    eligible,
    criteria,
    currentTier: agent.verified_tier ?? null,
  };
}

// ============================================
// VERIFY AGENT (Premium)
// ============================================

/**
 * Verify an agent as Premium after payment confirmation.
 * Requires all automatic criteria to be met + valid AGENT_VERIFICATION payment.
 */
export async function verifyAgentPremium(
  agentAddress: string,
  payerAddress: string,
  txHash: string,
): Promise<{ success: boolean; tier: string; verifiedAt: Date }> {
  const normalizedAddress = agentAddress.toLowerCase();

  // Check eligibility first
  const eligibility = await checkVerificationEligibility(normalizedAddress);

  if (!eligibility.eligible) {
    const failed = eligibility.criteria.filter((c) => !c.passed).map((c) => c.name);
    throw new ValidationError(`Agent does not meet verification criteria: ${failed.join(', ')}`, {
      criteria: failed.join(', '),
    });
  }

  // Check payment
  const hasPaid = await hasValidPayment(payerAddress, 'AGENT_VERIFICATION', normalizedAddress);
  if (!hasPaid) {
    throw new ValidationError('No valid AGENT_VERIFICATION payment found for this agent');
  }

  // Already premium?
  const agent = await prisma.agent.findUnique({ where: { address: normalizedAddress } });
  if (agent?.verified_tier === 'PREMIUM') {
    return {
      success: true,
      tier: 'PREMIUM',
      verifiedAt: agent.verified_at!,
    };
  }

  // Update agent to PREMIUM
  const now = new Date();
  await prisma.agent.update({
    where: { address: normalizedAddress },
    data: {
      status: 'VERIFIED',
      verified_tier: 'PREMIUM',
      verified_at: now,
      verification_tx: txHash,
    },
  });

  logger.info({ agentAddress: normalizedAddress, payerAddress, txHash }, 'Agent verified as PREMIUM');

  return {
    success: true,
    tier: 'PREMIUM',
    verifiedAt: now,
  };
}
