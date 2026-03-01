'use client';

import { DollarSign, TrendingUp, Trophy, Zap } from 'lucide-react';
import { cn } from '@/lib/utils/index';

interface GdpKpisProps {
  kpis?: {
    totalEconomicVolume?: number;
    avgDailyVolume?: number;
    peakDay?: { date: string; amount: number };
    activityStreak?: number;
  };
  isLoading?: boolean;
}

function formatUsd(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

const kpiConfig = [
  {
    key: 'totalEconomicVolume' as const,
    label: 'Total Economic Volume',
    icon: DollarSign,
    iconColor: 'text-[#4ADE80]',
    format: (v: number) => formatUsd(v),
  },
  {
    key: 'avgDailyVolume' as const,
    label: 'Avg Daily Volume',
    icon: TrendingUp,
    iconColor: 'text-blue-400',
    format: (v: number) => formatUsd(v),
  },
  {
    key: 'peakDay' as const,
    label: 'Peak Day',
    icon: Trophy,
    iconColor: 'text-amber-400',
    format: (_v: unknown, kpis?: GdpKpisProps['kpis']) => {
      if (!kpis?.peakDay) return '--';
      return `${formatDate(kpis.peakDay.date)} (${formatUsd(kpis.peakDay.amount)})`;
    },
  },
  {
    key: 'activityStreak' as const,
    label: 'Activity Streak',
    icon: Zap,
    iconColor: 'text-orange-400',
    format: (v: number) => `${v} days`,
  },
];

function KpiSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-white/[0.06] bg-white/[0.04] p-5">
      <div className="mb-3 h-4 w-24 rounded bg-white/10" />
      <div className="h-7 w-32 rounded bg-white/10" />
    </div>
  );
}

export function GdpKpis({ kpis, isLoading }: GdpKpisProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <KpiSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {kpiConfig.map((config) => {
        const Icon = config.icon;
        let value: string;

        if (config.key === 'peakDay') {
          value = config.format(0, kpis);
        } else {
          const rawValue = kpis?.[config.key];
          value = rawValue != null ? config.format(rawValue as number) : '--';
        }

        return (
          <div
            key={config.key}
            className={cn(
              'group rounded-xl border border-white/[0.06] bg-white/[0.04] p-5',
              'backdrop-blur-sm transition-all duration-200 hover:border-white/[0.12] hover:bg-white/[0.06]'
            )}
          >
            <div className="mb-2 flex items-center gap-2">
              <Icon className={cn('h-4 w-4', config.iconColor)} />
              <span className="text-xs font-medium text-slate-400">{config.label}</span>
            </div>
            <div
              className={cn(
                'text-lg font-semibold text-white',
                config.key === 'totalEconomicVolume' && 'text-[#4ADE80]'
              )}
            >
              {value}
            </div>
          </div>
        );
      })}
    </div>
  );
}
