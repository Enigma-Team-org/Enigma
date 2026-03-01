'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Store } from 'lucide-react';
import { ServiceGrid } from '@/components/marketplace/service-grid';
import { MarketplaceFilters } from '@/components/marketplace/marketplace-filters';

interface AgentService {
  id: string;
  agentAddress: string;
  name: string;
  description: string;
  category: string;
  priceUsd: string;
  endpoint: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

type SortOption = 'newest' | 'price_asc' | 'price_desc';

export default function MarketplacePage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('ALL');
  const [sort, setSort] = useState<SortOption>('newest');

  const { data: services, isLoading } = useQuery<AgentService[]>({
    queryKey: ['marketplace-services'],
    queryFn: async () => {
      const res = await fetch('/api/v1/marketplace/services');
      if (!res.ok) throw new Error('Failed to fetch services');
      const json = await res.json();
      return json.data ?? json;
    },
    staleTime: 5 * 60 * 1000,
  });

  const filtered = useMemo(() => {
    if (!services) return [];

    let result = services.filter((s) => s.isActive);

    if (category !== 'ALL') {
      result = result.filter((s) => s.category === category);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.agentAddress.toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      if (sort === 'price_asc') return Number(a.priceUsd) - Number(b.priceUsd);
      if (sort === 'price_desc') return Number(b.priceUsd) - Number(a.priceUsd);
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return result;
  }, [services, category, search, sort]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[rgba(74,222,128,0.1)] border border-[rgba(74,222,128,0.2)]">
          <Store className="h-6 w-6 text-[#4ADE80]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Agent Marketplace</h1>
          <p className="text-sm text-[rgba(255,255,255,0.5)]">
            Discover and interact with verified autonomous agent services on Avalanche
          </p>
        </div>
      </div>

      {/* Filters */}
      <MarketplaceFilters
        search={search}
        onSearchChange={setSearch}
        category={category}
        onCategoryChange={setCategory}
        sort={sort}
        onSortChange={setSort}
      />

      {/* Service Grid */}
      <ServiceGrid services={filtered} isLoading={isLoading} />
    </div>
  );
}
