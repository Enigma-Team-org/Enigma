'use client';

import { useQuery } from '@tanstack/react-query';
import { Flame } from 'lucide-react';
import { BurnDashboard } from '@/components/burn';
import { Spinner } from '@/components/shared/spinner';

export default function BurnPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['burn-stats'],
    queryFn: async () => {
      const res = await fetch('/api/v1/burn/stats');
      if (!res.ok) throw new Error('Failed to fetch burn stats');
      const json = await res.json();
      return json.data;
    },
    refetchInterval: 10_000, // Poll every 10s
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <Flame className="h-6 w-6 text-[#FB923C]" />
          <h1 className="text-2xl font-bold text-white">Burn Dashboard</h1>
        </div>
        <p className="mt-1 text-sm text-[#64748B]">
          Track USDC burned through the Enigma Economy. 10% of all platform fees are permanently removed.
        </p>
      </div>

      {isLoading && (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Spinner size="lg" />
        </div>
      )}

      {isError && (
        <div className="rounded-xl border border-[rgba(251,113,133,0.2)] bg-[rgba(251,113,133,0.06)] p-6 text-center">
          <p className="text-sm text-[#FB7185]">Failed to load burn data. Please try again.</p>
        </div>
      )}

      {data && <BurnDashboard stats={data} />}
    </div>
  );
}
