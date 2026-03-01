import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ServiceFilters {
  category?: string;
  agentAddress?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export interface Service {
  id: string;
  agentAddress: string;
  name: string;
  description: string;
  category: string;
  price: number;
  currency: string;
  endpoint: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceStats {
  totalServices: number;
  activeServices: number;
  categories: Record<string, number>;
}

export interface CreateServicePayload {
  agentAddress: string;
  name: string;
  description: string;
  category: string;
  price: number;
  currency: string;
  endpoint: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildServiceParams(filters?: ServiceFilters): string {
  if (!filters) return '';
  const params = new URLSearchParams();
  if (filters.category) params.set('category', filters.category);
  if (filters.agentAddress) params.set('agentAddress', filters.agentAddress);
  if (filters.isActive !== undefined) params.set('isActive', String(filters.isActive));
  if (filters.page !== undefined) params.set('page', String(filters.page));
  if (filters.limit !== undefined) params.set('limit', String(filters.limit));
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

/** Fetch a paginated / filtered list of marketplace services. */
export function useServices(filters?: ServiceFilters) {
  return useQuery<Service[]>({
    queryKey: ['services', filters],
    queryFn: async () => {
      const res = await fetch(`/api/v1/marketplace/services${buildServiceParams(filters)}`);
      if (!res.ok) throw new Error('Failed to fetch services');
      const json = await res.json();
      return json.data;
    },
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });
}

/** Fetch a single service by ID. */
export function useService(id: string) {
  return useQuery<Service>({
    queryKey: ['services', id],
    queryFn: async () => {
      const res = await fetch(`/api/v1/marketplace/services/${id}`);
      if (!res.ok) throw new Error('Failed to fetch service');
      const json = await res.json();
      return json.data;
    },
    enabled: !!id,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });
}

/** Create a new marketplace service listing. Invalidates the services cache on success. */
export function useCreateService() {
  const queryClient = useQueryClient();

  return useMutation<Service, Error, CreateServicePayload>({
    mutationFn: async (payload) => {
      const res = await fetch('/api/v1/marketplace/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to create service');
      const json = await res.json();
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
    },
  });
}

/** Fetch aggregate service statistics. */
export function useServiceStats() {
  return useQuery<ServiceStats>({
    queryKey: ['services', 'stats'],
    queryFn: async () => {
      const res = await fetch('/api/v1/marketplace/services?stats=true');
      if (!res.ok) throw new Error('Failed to fetch service stats');
      const json = await res.json();
      return json.data;
    },
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });
}
