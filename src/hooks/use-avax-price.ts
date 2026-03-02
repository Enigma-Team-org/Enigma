'use client';

import { useQuery } from '@tanstack/react-query';

async function fetchAvaxPrice(): Promise<number> {
  const res = await fetch(
    'https://api.coingecko.com/api/v3/simple/price?ids=avalanche-2&vs_currencies=usd'
  );
  const json = await res.json();
  return json['avalanche-2']?.usd ?? 0;
}

/**
 * Hook to get real-time AVAX/USD price
 * Refreshes every 60 seconds, cached for 30s
 */
export function useAvaxPrice() {
  return useQuery({
    queryKey: ['avax-price'],
    queryFn: fetchAvaxPrice,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

/**
 * Convert USD amount to AVAX equivalent
 */
export function usdToAvax(usdAmount: number, avaxPrice: number): string {
  if (avaxPrice <= 0) return '...';
  return (usdAmount / avaxPrice).toFixed(4);
}
