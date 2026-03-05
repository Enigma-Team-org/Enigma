'use client';

import { useQuery } from '@tanstack/react-query';

export interface TrustDistribution {
  range: string;
  min: number;
  max: number;
  count: number;
  percentage: number;
}

interface DistributionResponse {
  distribution: TrustDistribution[];
  total: number;
}

async function fetchDistribution(): Promise<DistributionResponse> {
  const res = await fetch('/api/v1/agents/distribution');
  const json = await res.json();

  if (!res.ok || json.error) {
    throw new Error(json.error?.message ?? 'Failed to fetch distribution');
  }

  return json.data;
}

export function useTrustDistribution() {
  return useQuery({
    queryKey: ['trust-distribution'],
    queryFn: fetchDistribution,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000,
  });
}
