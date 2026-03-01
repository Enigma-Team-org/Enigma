'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { ArrowLeft, Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { cn, formatAddress, formatCurrency } from '@/lib/utils/index';
import { format } from 'date-fns';
import { DealChat } from '@/components/marketplace/deal-chat';

interface Deal {
  id: string;
  serviceId: string;
  buyerAddress: string;
  sellerAddress: string;
  status: string;
  agreedPriceUsd: string;
  escrowTxHash: string | null;
  completionTxHash: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  service?: {
    id: string;
    name: string;
    category: string;
    agentAddress: string;
  };
}

const statusConfig: Record<
  string,
  { label: string; className: string; icon: typeof Clock }
> = {
  PROPOSED: {
    label: 'Proposed',
    className:
      'bg-[rgba(255,255,255,0.08)] text-[rgba(255,255,255,0.6)] border-[rgba(255,255,255,0.15)]',
    icon: Clock,
  },
  ACCEPTED: {
    label: 'Accepted',
    className:
      'bg-[rgba(96,165,250,0.15)] text-[#60A5FA] border-[rgba(96,165,250,0.3)]',
    icon: Clock,
  },
  IN_PROGRESS: {
    label: 'In Progress',
    className:
      'bg-[rgba(250,204,21,0.15)] text-[#FACC15] border-[rgba(250,204,21,0.3)]',
    icon: Clock,
  },
  COMPLETED: {
    label: 'Completed',
    className:
      'bg-[rgba(74,222,128,0.15)] text-[#4ADE80] border-[rgba(74,222,128,0.3)]',
    icon: CheckCircle2,
  },
  CANCELLED: {
    label: 'Cancelled',
    className:
      'bg-[rgba(239,68,68,0.15)] text-[#EF4444] border-[rgba(239,68,68,0.3)]',
    icon: XCircle,
  },
  DISPUTED: {
    label: 'Disputed',
    className:
      'bg-[rgba(239,68,68,0.15)] text-[#EF4444] border-[rgba(239,68,68,0.3)]',
    icon: XCircle,
  },
};

export default function DealDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    data: deal,
    isLoading,
    error,
  } = useQuery<Deal>({
    queryKey: ['deal', id],
    queryFn: async () => {
      const res = await fetch(`/api/v1/marketplace/deals/${id}`);
      if (!res.ok) throw new Error('Deal not found');
      const json = await res.json();
      return json.data;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      const res = await fetch(`/api/v1/marketplace/deals/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed to update');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deal', id] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[rgba(255,255,255,0.3)]" />
      </div>
    );
  }

  if (error || !deal) {
    return (
      <div className="space-y-4">
        <Link
          href={'/marketplace' as '/'}
          className="inline-flex items-center gap-2 text-sm text-[rgba(255,255,255,0.5)] hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Marketplace
        </Link>
        <div className="text-center py-20">
          <h2 className="text-xl font-semibold text-white">Deal not found</h2>
        </div>
      </div>
    );
  }

  const status = statusConfig[deal.status] ?? statusConfig.PROPOSED;
  const StatusIcon = status.icon;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Back */}
      <Link
        href={
          deal.service
            ? (`/marketplace/${deal.serviceId}` as '/')
            : ('/marketplace' as '/')
        }
        className="inline-flex items-center gap-2 text-sm text-[rgba(255,255,255,0.5)] hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Service
      </Link>

      {/* Deal header */}
      <div
        className={cn(
          'rounded-xl p-6',
          'bg-[rgba(255,255,255,0.04)] backdrop-blur-xl',
          'border border-[rgba(255,255,255,0.06)]'
        )}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-white mb-1">
              {deal.service?.name ?? `Deal ${deal.id.slice(0, 8)}...`}
            </h1>
            <p className="text-xs text-[rgba(255,255,255,0.4)] font-mono">
              Deal ID: {deal.id}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <StatusIcon className="h-4 w-4" />
            <span
              className={cn(
                'inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-medium',
                status.className
              )}
            >
              {status.label}
            </span>
          </div>
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 mb-5">
          <div className="flex items-center justify-between rounded-lg bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)] px-4 py-2.5">
            <span className="text-xs text-[rgba(255,255,255,0.4)]">Buyer</span>
            <span className="text-xs font-mono text-[rgba(255,255,255,0.6)]">
              {formatAddress(deal.buyerAddress)}
            </span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)] px-4 py-2.5">
            <span className="text-xs text-[rgba(255,255,255,0.4)]">Seller</span>
            <span className="text-xs font-mono text-[rgba(255,255,255,0.6)]">
              {formatAddress(deal.sellerAddress)}
            </span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)] px-4 py-2.5">
            <span className="text-xs text-[rgba(255,255,255,0.4)]">
              Agreed Price
            </span>
            <span className="text-sm font-bold text-white">
              {formatCurrency(Number(deal.agreedPriceUsd))}
            </span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)] px-4 py-2.5">
            <span className="text-xs text-[rgba(255,255,255,0.4)]">Created</span>
            <span className="text-xs text-[rgba(255,255,255,0.6)]">
              {format(new Date(deal.createdAt), 'MMM d, yyyy HH:mm')}
            </span>
          </div>
        </div>

        {/* Action buttons */}
        {['PROPOSED', 'ACCEPTED', 'IN_PROGRESS'].includes(deal.status) && (
          <div className="flex items-center gap-3 border-t border-[rgba(255,255,255,0.06)] pt-4">
            {deal.status === 'PROPOSED' && (
              <button
                onClick={() => updateStatusMutation.mutate('ACCEPTED')}
                disabled={updateStatusMutation.isPending}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-4 py-2',
                  'bg-[rgba(96,165,250,0.15)] border border-[rgba(96,165,250,0.3)]',
                  'text-sm font-medium text-[#60A5FA]',
                  'hover:bg-[rgba(96,165,250,0.25)] transition-colors',
                  'disabled:opacity-40'
                )}
              >
                Accept Deal
              </button>
            )}
            {deal.status === 'ACCEPTED' && (
              <button
                onClick={() => updateStatusMutation.mutate('IN_PROGRESS')}
                disabled={updateStatusMutation.isPending}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-4 py-2',
                  'bg-[rgba(250,204,21,0.15)] border border-[rgba(250,204,21,0.3)]',
                  'text-sm font-medium text-[#FACC15]',
                  'hover:bg-[rgba(250,204,21,0.25)] transition-colors',
                  'disabled:opacity-40'
                )}
              >
                Start Work
              </button>
            )}
            {deal.status === 'IN_PROGRESS' && (
              <button
                onClick={() => updateStatusMutation.mutate('COMPLETED')}
                disabled={updateStatusMutation.isPending}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-4 py-2',
                  'bg-[rgba(74,222,128,0.15)] border border-[rgba(74,222,128,0.3)]',
                  'text-sm font-medium text-[#4ADE80]',
                  'hover:bg-[rgba(74,222,128,0.25)] transition-colors',
                  'disabled:opacity-40'
                )}
              >
                <CheckCircle2 className="h-4 w-4" />
                Mark Completed
              </button>
            )}
            <button
              onClick={() => updateStatusMutation.mutate('CANCELLED')}
              disabled={updateStatusMutation.isPending}
              className={cn(
                'flex items-center gap-2 rounded-lg px-4 py-2',
                'bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.2)]',
                'text-sm font-medium text-[rgba(239,68,68,0.7)]',
                'hover:bg-[rgba(239,68,68,0.15)] transition-colors',
                'disabled:opacity-40'
              )}
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Chat */}
      <DealChat dealId={deal.id} currentAddress={deal.buyerAddress} />
    </div>
  );
}
