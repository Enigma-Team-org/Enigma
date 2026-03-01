import { useQuery } from '@tanstack/react-query';

interface PaymentHistoryOptions {
  page?: number;
  limit?: number;
}

export function usePaymentHistory(address: string | undefined, options: PaymentHistoryOptions = {}) {
  const { page = 1, limit = 20 } = options;

  return useQuery({
    queryKey: ['payment-history', address, page, limit],
    queryFn: async () => {
      const params = new URLSearchParams({
        address: address!,
        page: String(page),
        limit: String(limit),
      });
      const res = await fetch(`/api/v1/payments/history?${params}`);
      if (!res.ok) throw new Error('Failed to fetch payment history');
      const json = await res.json();
      return json.data;
    },
    enabled: !!address,
    staleTime: 60 * 1000, // 1 minute
  });
}
