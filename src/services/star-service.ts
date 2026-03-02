import { prisma } from '@/lib/database/prisma';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('star-service');

/**
 * Toggle star on an agent (add if not exists, remove if exists)
 */
export async function toggleStar(
  walletAddress: string,
  agentAddress: string
): Promise<{ starred: boolean; starCount: number }> {
  const wallet = walletAddress.toLowerCase();
  const agent = agentAddress.toLowerCase();

  const existing = await prisma.agentStar.findUnique({
    where: { walletAddress_agentAddress: { walletAddress: wallet, agentAddress: agent } },
  });

  if (existing) {
    await prisma.agentStar.delete({ where: { id: existing.id } });
    logger.info({ wallet, agent }, 'Star removed');
  } else {
    await prisma.agentStar.create({
      data: { walletAddress: wallet, agentAddress: agent },
    });
    logger.info({ wallet, agent }, 'Star added');
  }

  const starCount = await prisma.agentStar.count({ where: { agentAddress: agent } });

  return { starred: !existing, starCount };
}

/**
 * Get star count for an agent
 */
export async function getStarCount(agentAddress: string): Promise<number> {
  return prisma.agentStar.count({ where: { agentAddress: agentAddress.toLowerCase() } });
}

/**
 * Get star counts for multiple agents (batch)
 */
export async function getStarCounts(agentAddresses: string[]): Promise<Record<string, number>> {
  const addresses = agentAddresses.map((a) => a.toLowerCase());
  const results = await prisma.agentStar.groupBy({
    by: ['agentAddress'],
    where: { agentAddress: { in: addresses } },
    _count: { id: true },
  });

  const counts: Record<string, number> = {};
  for (const r of results) {
    counts[r.agentAddress] = r._count.id;
  }
  return counts;
}

/**
 * Check if a wallet has starred specific agents (batch)
 */
export async function getStarredByWallet(
  walletAddress: string,
  agentAddresses: string[]
): Promise<Set<string>> {
  const wallet = walletAddress.toLowerCase();
  const addresses = agentAddresses.map((a) => a.toLowerCase());

  const stars = await prisma.agentStar.findMany({
    where: { walletAddress: wallet, agentAddress: { in: addresses } },
    select: { agentAddress: true },
  });

  return new Set(stars.map((s) => s.agentAddress));
}
