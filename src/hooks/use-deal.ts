import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DealFilters {
  buyerAddress?: string;
  sellerAddress?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface Deal {
  id: string;
  serviceId: string;
  buyerAddress: string;
  sellerAddress: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface DealMessage {
  id: string;
  dealId: string;
  senderAddress: string;
  content: string;
  createdAt: string;
}

export interface CreateDealPayload {
  serviceId: string;
  buyerAddress: string;
  sellerAddress: string;
  amount: number;
  currency: string;
}

export interface UpdateDealStatusPayload {
  dealId: string;
  status: string;
}

export interface SendMessagePayload {
  dealId: string;
  senderAddress: string;
  content: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildDealParams(filters?: DealFilters): string {
  if (!filters) return '';
  const params = new URLSearchParams();
  if (filters.buyerAddress) params.set('buyerAddress', filters.buyerAddress);
  if (filters.sellerAddress) params.set('sellerAddress', filters.sellerAddress);
  if (filters.status) params.set('status', filters.status);
  if (filters.page !== undefined) params.set('page', String(filters.page));
  if (filters.limit !== undefined) params.set('limit', String(filters.limit));
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

/** Fetch a paginated / filtered list of deals. */
export function useDeals(filters?: DealFilters) {
  return useQuery<Deal[]>({
    queryKey: ['deals', filters],
    queryFn: async () => {
      const res = await fetch(`/api/v1/marketplace/deals${buildDealParams(filters)}`);
      if (!res.ok) throw new Error('Failed to fetch deals');
      const json = await res.json();
      return json.data;
    },
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });
}

/** Fetch a single deal by ID. */
export function useDeal(id: string) {
  return useQuery<Deal>({
    queryKey: ['deals', id],
    queryFn: async () => {
      const res = await fetch(`/api/v1/marketplace/deals/${id}`);
      if (!res.ok) throw new Error('Failed to fetch deal');
      const json = await res.json();
      return json.data;
    },
    enabled: !!id,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });
}

/** Create a new deal. Invalidates the deals cache on success. */
export function useCreateDeal() {
  const queryClient = useQueryClient();

  return useMutation<Deal, Error, CreateDealPayload>({
    mutationFn: async (payload) => {
      const res = await fetch('/api/v1/marketplace/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to create deal');
      const json = await res.json();
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
    },
  });
}

/** Update the status of an existing deal. Invalidates both deal list and individual deal caches. */
export function useUpdateDealStatus() {
  const queryClient = useQueryClient();

  return useMutation<Deal, Error, UpdateDealStatusPayload>({
    mutationFn: async ({ dealId, status }) => {
      const res = await fetch(`/api/v1/marketplace/deals/${dealId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed to update deal status');
      const json = await res.json();
      return json.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['deals', variables.dealId] });
    },
  });
}

/** Fetch messages for a deal. Polls every 5 seconds. */
export function useDealMessages(dealId: string) {
  return useQuery<DealMessage[]>({
    queryKey: ['deals', dealId, 'messages'],
    queryFn: async () => {
      const res = await fetch(`/api/v1/marketplace/deals/${dealId}/messages`);
      if (!res.ok) throw new Error('Failed to fetch deal messages');
      const json = await res.json();
      return json.data;
    },
    enabled: !!dealId,
    staleTime: 5_000,
    refetchInterval: 5_000,
  });
}

/** Send a message in a deal thread. Invalidates the messages cache on success. */
export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation<DealMessage, Error, SendMessagePayload>({
    mutationFn: async ({ dealId, senderAddress, content }) => {
      const res = await fetch(`/api/v1/marketplace/deals/${dealId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderAddress, content }),
      });
      if (!res.ok) throw new Error('Failed to send message');
      const json = await res.json();
      return json.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['deals', variables.dealId, 'messages'] });
    },
  });
}
