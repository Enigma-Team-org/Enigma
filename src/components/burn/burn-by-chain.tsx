'use client';

import { cn } from '@/lib/utils/index';

interface ChainData {
  chainId: number;
  chainName: string;
  totalBurnedUsd: number;
  totalBurnedNative: number;
  pendingUsd: number;
}

interface BurnByChainProps {
  pools: ChainData[];
}

const CHAIN_COLORS: Record<string, string> = {
  Avalanche: 'bg-[#E84142]',
  Base: 'bg-[#0052FF]',
};

export function BurnByChain({ pools }: BurnByChainProps) {
  const maxBurned = Math.max(...pools.map((p) => p.totalBurnedUsd), 1);

  return (
    <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] p-5">
      <p className="mb-4 text-[10px] font-semibold uppercase tracking-widest text-[#475569]">Burn by Chain</p>
      <div className="space-y-4">
        {pools.map((pool) => (
          <div key={pool.chainId}>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-xs font-medium text-white">{pool.chainName}</span>
              <span className="font-data text-xs text-[#94A3B8]">
                {pool.totalBurnedNative.toFixed(4)} {pool.chainName === 'Avalanche' ? 'AVAX' : 'ETH'}
                <span className="ml-1 text-[#475569]">(${pool.totalBurnedUsd.toFixed(2)})</span>
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-[rgba(255,255,255,0.06)]">
              <div
                className={cn('h-full rounded-full transition-all duration-700', CHAIN_COLORS[pool.chainName] ?? 'bg-[#64748B]')}
                style={{ width: `${Math.max((pool.totalBurnedUsd / maxBurned) * 100, 2)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
