'use client';

import { BurnStats } from './burn-stats';
import { BurnByChain } from './burn-by-chain';
import { BurnFeed } from './burn-feed';
import { BurnCounter } from './burn-counter';

interface BurnDashboardProps {
  stats: {
    totalBurnedUsd: number;
    totalPendingUsd: number;
    totalBurnCount: number;
    pools: Array<{
      chainId: number;
      chainName: string;
      pendingUsd: number;
      totalBurnedUsd: number;
      totalBurnedNative: number;
      lastBurnAt: string | null;
    }>;
    recentBurns: Array<{
      id: string;
      chainName: string;
      amountInUsd: number;
      nativeToken: string;
      amountBurned: number;
      txHash: string;
      createdAt: string;
    }>;
  };
}

export function BurnDashboard({ stats }: BurnDashboardProps) {
  return (
    <div className="flex flex-col gap-6">
      <BurnCounter totalBurnedUsd={stats.totalBurnedUsd} />
      <BurnStats
        totalBurnedUsd={stats.totalBurnedUsd}
        totalPendingUsd={stats.totalPendingUsd}
        totalBurnCount={stats.totalBurnCount}
      />
      <div className="grid gap-6 md:grid-cols-2">
        <BurnByChain pools={stats.pools} />
        <BurnFeed burns={stats.recentBurns} />
      </div>
    </div>
  );
}
