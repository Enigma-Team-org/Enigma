'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface StarInfo {
  starCount: number;
  starred: boolean;
}

/**
 * Fetch star info for a single agent
 */
async function fetchStarInfo(agentAddress: string, wallet?: string): Promise<StarInfo> {
  const params = wallet ? `?wallet=${wallet}` : '';
  const res = await fetch(`/api/v1/agents/${agentAddress}/star${params}`);
  const json = await res.json();
  if (json.error) throw new Error(json.error.message);
  return json.data;
}

/**
 * Fetch star counts for multiple agents (batch)
 */
async function fetchStarCounts(
  agentAddresses: string[],
  wallet?: string
): Promise<Record<string, StarInfo>> {
  const params = new URLSearchParams();
  params.set('addresses', agentAddresses.join(','));
  if (wallet) params.set('wallet', wallet);

  const res = await fetch(`/api/v1/agents/stars?${params}`);
  const json = await res.json();
  if (json.error) throw new Error(json.error.message);
  return json.data;
}

/**
 * Hook for a single agent's star info
 */
export function useAgentStar(agentAddress: string, wallet?: string) {
  return useQuery({
    queryKey: ['agent-star', agentAddress, wallet],
    queryFn: () => fetchStarInfo(agentAddress, wallet),
    staleTime: 30_000,
  });
}

/**
 * Hook for batch star counts (for agent list views)
 */
export function useStarCounts(agentAddresses: string[], wallet?: string) {
  return useQuery({
    queryKey: ['star-counts', agentAddresses.sort().join(','), wallet],
    queryFn: () => fetchStarCounts(agentAddresses, wallet),
    enabled: agentAddresses.length > 0,
    staleTime: 30_000,
  });
}

/**
 * Mutation hook for toggling star
 */
export function useToggleStar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ agentAddress, walletAddress }: { agentAddress: string; walletAddress: string }) => {
      const res = await fetch(`/api/v1/agents/${agentAddress}/star`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error.message);
      return json.data as { starred: boolean; starCount: number };
    },
    onSuccess: (data, variables) => {
      // Invalidate star queries to refresh counts
      queryClient.invalidateQueries({ queryKey: ['agent-star', variables.agentAddress] });
      queryClient.invalidateQueries({ queryKey: ['star-counts'] });
    },
  });
}
