'use client';

import { useQuery } from '@tanstack/react-query';

export interface ActivityEvent {
  id: string;
  type: string;
  agentAddress: string;
  agentName: string;
  detail: string;
  timestamp: string;
  meta?: Record<string, unknown>;
}

async function fetchFeed(limit: number): Promise<ActivityEvent[]> {
  const res = await fetch(`/api/v1/agents/feed?limit=${limit}`);
  const json = await res.json();
  if (json.error) throw new Error(json.error.message);
  return json.data ?? [];
}

export function useActivityFeed(limit = 20) {
  return useQuery({
    queryKey: ['activity-feed', limit],
    queryFn: () => fetchFeed(limit),
    refetchInterval: 30_000, // refresh every 30s for "live" feel
    staleTime: 15_000,
  });
}
