'use client';

import Link from 'next/link';
import { ArrowUpRight, Circle } from 'lucide-react';
import { cn, formatAddress, formatCurrency } from '@/lib/utils/index';

interface ServiceCardProps {
  service: {
    id: string;
    agentAddress: string;
    name: string;
    description: string;
    category: string;
    priceUsd: string;
    isActive: boolean;
  };
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

export function ServiceCard({ service }: ServiceCardProps) {
  const truncatedDesc =
    service.description.length > 120
      ? service.description.slice(0, 120) + '...'
      : service.description;

  return (
    <Link href={`/marketplace/${service.id}` as '/'}>
      <div
        className={cn(
          'group relative rounded-xl p-5',
          'bg-[rgba(255,255,255,0.04)] backdrop-blur-xl',
          'border border-[rgba(255,255,255,0.06)]',
          'transition-all duration-300',
          'hover:bg-[rgba(255,255,255,0.07)] hover:border-[rgba(74,222,128,0.2)]',
          'hover:shadow-[0_0_30px_rgba(74,222,128,0.05)]',
          'cursor-pointer'
        )}
      >
        {/* Top row: category + status */}
        <div className="flex items-center justify-between mb-3">
          <span
            className={cn(
              'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium',
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

        {/* Name */}
        <h3 className="text-base font-semibold text-white mb-1.5 group-hover:text-[#4ADE80] transition-colors">
          {service.name}
        </h3>

        {/* Description */}
        <p className="text-sm text-[rgba(255,255,255,0.45)] leading-relaxed mb-4">
          {truncatedDesc}
        </p>

        {/* Bottom row: price + agent */}
        <div className="flex items-center justify-between pt-3 border-t border-[rgba(255,255,255,0.06)]">
          <span className="text-lg font-bold text-white">
            {formatCurrency(Number(service.priceUsd))}
          </span>

          <span className="text-xs font-mono text-[rgba(255,255,255,0.35)]">
            {formatAddress(service.agentAddress)}
          </span>
        </div>

        {/* Hover arrow */}
        <ArrowUpRight
          className={cn(
            'absolute top-4 right-4 h-4 w-4 text-[rgba(255,255,255,0.2)]',
            'opacity-0 group-hover:opacity-100 transition-opacity'
          )}
        />
      </div>
    </Link>
  );
}
