'use client';

import { PackageOpen } from 'lucide-react';
import { cn } from '@/lib/utils/index';
import { ServiceCard } from './service-card';

interface Service {
  id: string;
  agentAddress: string;
  name: string;
  description: string;
  category: string;
  priceUsd: string;
  isActive: boolean;
}

interface ServiceGridProps {
  services: Service[];
  isLoading?: boolean;
}

function SkeletonCard() {
  return (
    <div
      className={cn(
        'rounded-xl p-5',
        'bg-[rgba(255,255,255,0.04)] backdrop-blur-xl',
        'border border-[rgba(255,255,255,0.06)]',
        'animate-pulse'
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="h-5 w-20 rounded-md bg-[rgba(255,255,255,0.08)]" />
        <div className="h-3 w-12 rounded bg-[rgba(255,255,255,0.06)]" />
      </div>
      <div className="h-5 w-3/4 rounded bg-[rgba(255,255,255,0.08)] mb-2" />
      <div className="space-y-1.5 mb-4">
        <div className="h-3 w-full rounded bg-[rgba(255,255,255,0.06)]" />
        <div className="h-3 w-5/6 rounded bg-[rgba(255,255,255,0.06)]" />
      </div>
      <div className="flex items-center justify-between pt-3 border-t border-[rgba(255,255,255,0.06)]">
        <div className="h-6 w-16 rounded bg-[rgba(255,255,255,0.08)]" />
        <div className="h-3 w-24 rounded bg-[rgba(255,255,255,0.06)]" />
      </div>
    </div>
  );
}

export function ServiceGrid({ services, isLoading }: ServiceGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (services.length === 0) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center py-20 rounded-xl',
          'bg-[rgba(255,255,255,0.04)] backdrop-blur-xl',
          'border border-[rgba(255,255,255,0.06)]'
        )}
      >
        <PackageOpen className="h-12 w-12 text-[rgba(255,255,255,0.2)] mb-4" />
        <h3 className="text-lg font-semibold text-white mb-1">No services found</h3>
        <p className="text-sm text-[rgba(255,255,255,0.4)]">
          Try adjusting your filters or check back later.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {services.map((service) => (
        <ServiceCard key={service.id} service={service} />
      ))}
    </div>
  );
}
