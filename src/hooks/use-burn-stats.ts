import { useQuery } from '@tanstack/react-query';

interface BurnPool {
  chainId: number;
  chainName: string;
  pendingUsd: number;
  totalBurnedUsd: number;
  totalBurnedNative: number;
  lastBurnAt: string | null;
}

interface BurnEvent {
  id: string;
  chainName: string;
  amountInUsd: number;
  nativeToken: string;
  amountBurned: number;
  txHash: string;
  createdAt: string;
}

interface BurnStats {
  totalBurnedUsd: number;
  totalPendingUsd: number;
  totalBurnCount: number;
  pools: BurnPool[];
  recentBurns: BurnEvent[];
}

export function useBurnStats() {
  return useQuery<BurnStats>({
    queryKey: ['burn-stats'],
    queryFn: async () => {
      const res = await fetch('/api/v1/burn/stats');
      if (!res.ok) throw new Error('Failed to fetch burn stats');
      const json = await res.json();
      return json.data;
    },
    staleTime: 30_000, // 30 seconds
    refetchInterval: 10_000, // Poll every 10s
  });
}
