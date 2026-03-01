import { useMutation, useQueryClient } from '@tanstack/react-query';

interface CreatePaymentParams {
  payerAddress: string;
  type: 'TRUST_SCORE_QUERY' | 'SENTINEL_VALIDATION' | 'DEEP_ANALYSIS';
  tokenAddress: string;
  chainId: number;
  agentAddress?: string;
}

interface VerifyPaymentParams {
  paymentId: string;
  txHash: string;
}

export function useCreatePayment() {
  return useMutation({
    mutationFn: async (params: CreatePaymentParams) => {
      const res = await fetch('/api/v1/payments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message ?? 'Failed to create payment');
      }
      const json = await res.json();
      return json.data;
    },
  });
}

export function useVerifyPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: VerifyPaymentParams) => {
      const res = await fetch('/api/v1/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message ?? 'Payment verification failed');
      }
      const json = await res.json();
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-history'] });
    },
  });
}
