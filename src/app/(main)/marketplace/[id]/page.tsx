'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAccount } from 'wagmi';
import Link from 'next/link';
import {
  ArrowLeft,
  Circle,
  ExternalLink,
  Loader2,
  Wallet,
  Zap,
} from 'lucide-react';
import { cn, formatAddress, formatCurrency } from '@/lib/utils/index';
import { DealCard } from '@/components/marketplace/deal-card';
import { WalletConnectButton } from '@/components/shared/wallet-connect-button';

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

interface Deal {
  id: string;
  serviceId: string;
  buyerAddress: string;
  sellerAddress: string;
  status: string;
  agreedPriceUsd: string;
  createdAt: string;
  completedAt: string | null;
  service?: { name: string };
}

const categoryColors: Record<string, string> = {
  DEFI: 'bg-[rgba(74,222,128,0.15)] text-[#4ADE80] border-[rgba(74,222,128,0.3)]',
  TRADING: 'bg-[rgba(96,165,250,0.15)] text-[#60A5FA] border-[rgba(96,165,250,0.3)]',
  ANALYTICS: 'bg-[rgba(167,139,250,0.15)] text-[#A78BFA] border-[rgba(167,139,250,0.3)]',
  SECURITY: 'bg-[rgba(251,146,60,0.15)] text-[#FB923C] border-[rgba(251,146,60,0.3)]',
  ORACLE: 'bg-[rgba(34,211,238,0.15)] text-[#22D3EE] border-[rgba(34,211,238,0.3)]',
  GOVERNANCE: 'bg-[rgba(244,114,182,0.15)] text-[#F472B6] border-[rgba(244,114,182,0.3)]',
  INFRASTRUCTURE: 'bg-[rgba(250,204,21,0.15)] text-[#FACC15] border-[rgba(250,204,21,0.3)]',
  OTHER: 'bg-[rgba(255,255,255,0.08)] text-[rgba(255,255,255,0.6)] border-[rgba(255,255,255,0.15)]',
};

export default function ServiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const [showDealForm, setShowDealForm] = useState(false);

  const { data: service, isLoading } = useQuery<AgentService>({
    queryKey: ['service', id],
    queryFn: async () => {
      const res = await fetch(`/api/v1/marketplace/services/${id}`);
      if (!res.ok) throw new Error('Service not found');
      const json = await res.json();
      return json.data;
    },
  });

  const { data: deals = [] } = useQuery<Deal[]>({
    queryKey: ['service-deals', service?.agentAddress],
    queryFn: async () => {
      const res = await fetch(
        `/api/v1/marketplace/deals?sellerAddress=${service!.agentAddress}`
      );
      if (!res.ok) return [];
      const json = await res.json();
      return json.data?.data ?? json.data ?? [];
    },
    enabled: !!service?.agentAddress,
  });

  const createDealMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/v1/marketplace/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: id,
          buyerAddress: address,
          agreedPriceUsd: service!.priceUsd,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message ?? 'Failed to create deal');
      }
      return res.json();
    },
    onSuccess: (data) => {
      const dealId = data.data?.id;
      if (dealId) {
        router.push(`/marketplace/deals/${dealId}` as '/');
      }
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[rgba(255,255,255,0.3)]" />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="space-y-4">
        <Link
          href={'/marketplace' as '/'}
          className="inline-flex items-center gap-2 text-sm text-[rgba(255,255,255,0.5)] hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Marketplace
        </Link>
        <div className="text-center py-20">
          <h2 className="text-xl font-semibold text-white">Service not found</h2>
          <p className="text-sm text-[rgba(255,255,255,0.4)] mt-2">
            This service may have been removed or deactivated.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Back */}
      <Link
        href={'/marketplace' as '/'}
        className="inline-flex items-center gap-2 text-sm text-[rgba(255,255,255,0.5)] hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Marketplace
      </Link>

      {/* Service detail card */}
      <div
        className={cn(
          'rounded-xl p-6',
          'bg-[rgba(255,255,255,0.04)] backdrop-blur-xl',
          'border border-[rgba(255,255,255,0.06)]'
        )}
      >
        {/* Top row */}
        <div className="flex items-center justify-between mb-4">
          <span
            className={cn(
              'inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-medium',
              categoryColors[service.category] ?? categoryColors.OTHER
            )}
          >
            {service.category}
          </span>
          <div className="flex items-center gap-1.5">
            <Circle
              className={cn(
                'h-2 w-2 fill-current',
                service.isActive ? 'text-[#4ADE80]' : 'text-[rgba(255,255,255,0.3)]'
              )}
            />
            <span className="text-xs text-[rgba(255,255,255,0.4)]">
              {service.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>

        {/* Name + price */}
        <h1 className="text-2xl font-bold text-white mb-2">{service.name}</h1>
        <p className="text-3xl font-bold text-[#4ADE80] mb-4">
          {formatCurrency(Number(service.priceUsd))}
        </p>

        {/* Description */}
        <p className="text-sm text-[rgba(255,255,255,0.6)] leading-relaxed mb-6">
          {service.description}
        </p>

        {/* Meta */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 mb-6">
          <div className="flex items-center justify-between rounded-lg bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)] px-4 py-2.5">
            <span className="text-xs text-[rgba(255,255,255,0.4)]">Agent</span>
            <span className="text-xs font-mono text-[rgba(255,255,255,0.6)]">
              {formatAddress(service.agentAddress)}
            </span>
          </div>
          {service.endpoint && (
            <a
              href={service.endpoint}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between rounded-lg bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)] px-4 py-2.5 hover:border-[rgba(74,222,128,0.2)] transition-colors"
            >
              <span className="text-xs text-[rgba(255,255,255,0.4)]">Endpoint</span>
              <span className="flex items-center gap-1 text-xs text-[#4ADE80]">
                API <ExternalLink className="h-3 w-3" />
              </span>
            </a>
          )}
        </div>

        {/* Create Deal */}
        {service.isActive && (
          <div className="border-t border-[rgba(255,255,255,0.06)] pt-5">
            {!isConnected ? (
              <div className="flex items-center gap-4">
                <Wallet className="h-5 w-5 text-[rgba(255,255,255,0.3)]" />
                <div className="flex-1">
                  <p className="text-sm text-[rgba(255,255,255,0.5)] mb-2">
                    Connect your wallet to start a deal
                  </p>
                  <WalletConnectButton />
                </div>
              </div>
            ) : !showDealForm ? (
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setShowDealForm(true)}
                  className={cn(
                    'flex items-center gap-2 rounded-lg px-5 py-2.5',
                    'bg-[rgba(74,222,128,0.15)] border border-[rgba(74,222,128,0.3)]',
                    'text-sm font-medium text-[#4ADE80]',
                    'hover:bg-[rgba(74,222,128,0.25)] transition-colors'
                  )}
                >
                  <Zap className="h-4 w-4" />
                  Start a Deal
                </button>
                <span className="text-xs font-mono text-[rgba(255,255,255,0.35)]">
                  {formatAddress(address!)}
                </span>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-[rgba(255,255,255,0.5)]">
                  Propose a deal as{' '}
                  <span className="font-mono text-[rgba(255,255,255,0.7)]">
                    {formatAddress(address!)}
                  </span>{' '}
                  at{' '}
                  <span className="text-white font-medium">
                    {formatCurrency(Number(service.priceUsd))}
                  </span>
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => createDealMutation.mutate()}
                    disabled={createDealMutation.isPending}
                    className={cn(
                      'flex items-center gap-2 rounded-lg px-5 py-2.5',
                      'bg-[rgba(74,222,128,0.15)] border border-[rgba(74,222,128,0.3)]',
                      'text-sm font-medium text-[#4ADE80]',
                      'hover:bg-[rgba(74,222,128,0.25)] transition-colors',
                      'disabled:opacity-40 disabled:cursor-not-allowed'
                    )}
                  >
                    {createDealMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Confirm Deal'
                    )}
                  </button>
                  <button
                    onClick={() => setShowDealForm(false)}
                    className="rounded-lg px-4 py-2.5 text-sm text-[rgba(255,255,255,0.4)] hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                </div>
                {createDealMutation.isError && (
                  <p className="text-xs text-red-400">
                    {createDealMutation.error.message}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Recent deals for this agent */}
      {deals.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Recent Deals</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {deals.slice(0, 6).map((deal) => (
              <DealCard
                key={deal.id}
                deal={deal}
                onClick={() =>
                  router.push(`/marketplace/deals/${deal.id}` as '/')
                }
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
