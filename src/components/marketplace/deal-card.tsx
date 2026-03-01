'use client';

import { cn, formatAddress, formatCurrency } from '@/lib/utils/index';
import { format } from 'date-fns';

interface DealCardProps {
  deal: {
    id: string;
    serviceId: string;
    buyerAddress: string;
    sellerAddress: string;
    status: string;
    agreedPriceUsd: string;
    createdAt: string;
    completedAt: string | null;
    service?: {
      name: string;
    };
  };
  onClick?: () => void;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  COMPLETED: {
    label: 'Completed',
    className: 'bg-[rgba(74,222,128,0.15)] text-[#4ADE80] border-[rgba(74,222,128,0.3)]',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    className: 'bg-[rgba(250,204,21,0.15)] text-[#FACC15] border-[rgba(250,204,21,0.3)]',
  },
  ACCEPTED: {
    label: 'Accepted',
    className: 'bg-[rgba(96,165,250,0.15)] text-[#60A5FA] border-[rgba(96,165,250,0.3)]',
  },
  PROPOSED: {
    label: 'Proposed',
    className:
      'bg-[rgba(255,255,255,0.08)] text-[rgba(255,255,255,0.6)] border-[rgba(255,255,255,0.15)]',
  },
  CANCELLED: {
    label: 'Cancelled',
    className: 'bg-[rgba(239,68,68,0.15)] text-[#EF4444] border-[rgba(239,68,68,0.3)]',
  },
  DISPUTED: {
    label: 'Disputed',
    className: 'bg-[rgba(239,68,68,0.15)] text-[#EF4444] border-[rgba(239,68,68,0.3)]',
  },
};

export function DealCard({ deal, onClick }: DealCardProps) {
  const status = statusConfig[deal.status] ?? statusConfig.PROPOSED;

  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-xl p-5',
        'bg-[rgba(255,255,255,0.04)] backdrop-blur-xl',
        'border border-[rgba(255,255,255,0.06)]',
        'transition-all duration-300',
        onClick && 'cursor-pointer hover:bg-[rgba(255,255,255,0.07)] hover:border-[rgba(74,222,128,0.2)]'
      )}
    >
      {/* Top: service name + status */}
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-sm font-semibold text-white truncate pr-3">
          {deal.service?.name ?? `Service ${deal.serviceId.slice(0, 8)}...`}
        </h3>
        <span
          className={cn(
            'inline-flex shrink-0 items-center rounded-md border px-2 py-0.5 text-xs font-medium',
            status.className
          )}
        >
          {status.label}
        </span>
      </div>

      {/* Addresses */}
      <div className="space-y-1.5 mb-4">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[rgba(255,255,255,0.4)]">Buyer</span>
          <span className="font-mono text-[rgba(255,255,255,0.6)]">
            {formatAddress(deal.buyerAddress)}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-[rgba(255,255,255,0.4)]">Seller</span>
          <span className="font-mono text-[rgba(255,255,255,0.6)]">
            {formatAddress(deal.sellerAddress)}
          </span>
        </div>
      </div>

      {/* Bottom: price + date */}
      <div className="flex items-center justify-between pt-3 border-t border-[rgba(255,255,255,0.06)]">
        <span className="text-base font-bold text-white">
          {formatCurrency(Number(deal.agreedPriceUsd))}
        </span>
        <span className="text-xs text-[rgba(255,255,255,0.35)]">
          {format(new Date(deal.createdAt), 'MMM d, yyyy')}
        </span>
      </div>
    </div>
  );
}
