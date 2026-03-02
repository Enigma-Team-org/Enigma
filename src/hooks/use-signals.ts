'use client';

import { useQuery } from '@tanstack/react-query';

export interface AgentSignal {
  type: string;
  label: string;
  color: string;
  bgColor: string;
}

export type SignalMap = Record<string, AgentSignal[]>;

async function fetchSignals(addresses: string[]): Promise<SignalMap> {
  if (addresses.length === 0) return {};
  const res = await fetch(`/api/v1/agents/signals?addresses=${addresses.join(',')}`);
  const json = await res.json();
  if (json.error) throw new Error(json.error.message);
  return json.data ?? {};
}

export function useSignals(agentAddresses: string[]) {
  return useQuery({
    queryKey: ['agent-signals', agentAddresses.sort().join(',')],
    queryFn: () => fetchSignals(agentAddresses),
    enabled: agentAddresses.length > 0,
    staleTime: 60_000,
  });
}
