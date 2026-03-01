import { prisma } from '@/lib/database/prisma';
import { publicClient } from '@/lib/blockchain/client';
import { ENIGMA_BURN_ABI, BURN_CONTRACT_ADDRESSES } from '@/lib/blockchain/abis/enigma-burn';
import { logger } from '@/lib/utils/logger';
import { formatUnits } from 'viem';

const log = logger.child({ module: 'burn-service' });

const DEAD_ADDRESS = '0x000000000000000000000000000000000000dEaD';
const MIN_BURN_USD = 1.0; // Minimum $1 to trigger burn

/**
 * Get or create burn pool for a chain
 */
async function getOrCreatePool(chainId: number, chainName: string) {
  let pool = await prisma.burnPool.findUnique({ where: { chainId } });
  if (!pool) {
    pool = await prisma.burnPool.create({
      data: { chainId, chainName, pendingUsd: 0, totalBurnedUsd: 0, totalBurnedNative: 0 },
    });
  }
  return pool;
}

/**
 * Accumulate burn amount from a payment fee
 */
export async function accumulateBurn(chainId: number, chainName: string, burnUsd: number) {
  const pool = await getOrCreatePool(chainId, chainName);

  await prisma.burnPool.update({
    where: { chainId },
    data: {
      pendingUsd: { increment: burnUsd },
    },
  });

  log.info({ chainId, burnUsd, newPending: Number(pool.pendingUsd) + burnUsd }, 'Burn accumulated');
}

/**
 * Get burn stats across all chains
 */
export async function getBurnStats() {
  const pools = await prisma.burnPool.findMany();
  const recentBurns = await prisma.burnRecord.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  const totalBurnedUsd = pools.reduce((sum, p) => sum + Number(p.totalBurnedUsd), 0);
  const totalPendingUsd = pools.reduce((sum, p) => sum + Number(p.pendingUsd), 0);
  const totalBurnCount = await prisma.burnRecord.count();

  return {
    totalBurnedUsd,
    totalPendingUsd,
    totalBurnCount,
    pools: pools.map((p) => ({
      chainId: p.chainId,
      chainName: p.chainName,
      pendingUsd: Number(p.pendingUsd),
      totalBurnedUsd: Number(p.totalBurnedUsd),
      totalBurnedNative: Number(p.totalBurnedNative),
      lastBurnAt: p.lastBurnAt,
    })),
    recentBurns: recentBurns.map((b) => ({
      id: b.id,
      chainName: b.chainName,
      amountInUsd: Number(b.amountInUsd),
      nativeToken: b.nativeToken,
      amountBurned: Number(b.amountBurned),
      txHash: b.txHash,
      createdAt: b.createdAt,
    })),
  };
}

/**
 * Get burn feed (paginated recent burns)
 */
export async function getBurnFeed(options: { page?: number; limit?: number } = {}) {
  const { page = 1, limit = 20 } = options;
  const skip = (page - 1) * limit;

  const [burns, total] = await Promise.all([
    prisma.burnRecord.findMany({
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.burnRecord.count(),
  ]);

  return {
    burns: burns.map((b) => ({
      id: b.id,
      chainId: b.chainId,
      chainName: b.chainName,
      stablecoinIn: b.stablecoinIn,
      amountInUsd: Number(b.amountInUsd),
      nativeToken: b.nativeToken,
      amountBurned: Number(b.amountBurned),
      txHash: b.txHash,
      createdAt: b.createdAt,
    })),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

/**
 * Index burn events from the contract (called by cron)
 */
export async function indexBurnEvents(chainId: number = 43114) {
  const contractAddress = BURN_CONTRACT_ADDRESSES[chainId];
  if (!contractAddress || contractAddress === '0x0000000000000000000000000000000000000000') {
    log.warn({ chainId }, 'No burn contract deployed for chain');
    return { indexed: 0 };
  }

  // Get last indexed block
  const lastBurn = await prisma.burnRecord.findFirst({
    where: { chainId },
    orderBy: { createdAt: 'desc' },
  });

  const fromBlock = lastBurn ? 'latest' : BigInt(0);

  try {
    const logs = await publicClient.getLogs({
      address: contractAddress,
      event: {
        type: 'event',
        name: 'BurnExecuted',
        inputs: [
          { name: 'burnId', type: 'uint256', indexed: true },
          { name: 'usdcAmount', type: 'uint256', indexed: false },
          { name: 'nativeAmount', type: 'uint256', indexed: false },
          { name: 'timestamp', type: 'uint256', indexed: false },
        ],
      },
      fromBlock: fromBlock === 'latest' ? undefined : fromBlock,
    });

    let indexed = 0;
    for (const logEntry of logs) {
      const args = logEntry.args;
      if (!args.usdcAmount || !args.nativeAmount) continue;

      const txHash = logEntry.transactionHash;
      const exists = await prisma.burnRecord.findUnique({ where: { txHash } });
      if (exists) continue;

      await prisma.burnRecord.create({
        data: {
          chainId,
          chainName: chainId === 43114 ? 'Avalanche' : 'Base',
          stablecoinIn: 'USDC',
          amountInUsd: formatUnits(args.usdcAmount, 6),
          nativeToken: chainId === 43114 ? 'AVAX' : 'ETH',
          amountBurned: formatUnits(args.nativeAmount, 18),
          txHash,
        },
      });

      indexed++;
    }

    log.info({ chainId, indexed }, 'Burn events indexed');
    return { indexed };
  } catch (error) {
    log.error({ error, chainId }, 'Failed to index burn events');
    return { indexed: 0 };
  }
}
