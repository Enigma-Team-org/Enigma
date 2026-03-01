'use client';

import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from '@/lib/utils/index';
import { GdpKpis } from './gdp-kpis';
import { GdpChart } from './gdp-chart';

interface GdpHistoryEntry {
  date: string;
  paymentVolumeUsd: number;
  burnVolumeUsd: number;
  dealVolumeUsd: number;
}

interface GdpDashboardProps {
  dashboard?: {
    growthMetrics?: {
      paymentGrowth?: number;
      burnGrowth?: number;
      dealGrowth?: number;
    };
  };
  kpis?: {
    totalEconomicVolume?: number;
    avgDailyVolume?: number;
    peakDay?: { date: string; amount: number };
    activityStreak?: number;
  };
  history?: GdpHistoryEntry[];
  isLoading?: boolean;
}

interface GrowthCardConfig {
  label: string;
  key: 'paymentGrowth' | 'burnGrowth' | 'dealGrowth';
  color: string;
}

const growthCards: GrowthCardConfig[] = [
  { label: 'Payment Growth', key: 'paymentGrowth', color: '#4ADE80' },
  { label: 'Burn Growth', key: 'burnGrowth', color: '#FB923C' },
  { label: 'Deal Growth', key: 'dealGrowth', color: '#60A5FA' },
];

function GrowthSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-white/[0.06] bg-white/[0.04] p-5">
      <div className="mb-2 h-3 w-20 rounded bg-white/10" />
      <div className="h-6 w-16 rounded bg-white/10" />
    </div>
  );
}

export function GdpDashboard({ dashboard, kpis, history, isLoading }: GdpDashboardProps) {
  const growth = dashboard?.growthMetrics;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <GdpKpis kpis={kpis} isLoading={isLoading} />

      {/* Volume Chart */}
      <GdpChart data={history} isLoading={isLoading} />

      {/* Growth Metrics */}
      <div>
        <h3 className="mb-3 text-sm font-medium text-slate-400">Growth vs Yesterday</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {isLoading
            ? Array.from({ length: 3 }).map((_, i) => <GrowthSkeleton key={i} />)
            : growthCards.map((card) => {
                const value = growth?.[card.key] ?? 0;
                const isPositive = value >= 0;
                const Arrow = isPositive ? ArrowUpRight : ArrowDownRight;

                return (
                  <div
                    key={card.key}
                    className={cn(
                      'rounded-xl border border-white/[0.06] bg-white/[0.04] p-5',
                      'backdrop-blur-sm transition-all duration-200 hover:border-white/[0.12] hover:bg-white/[0.06]'
                    )}
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <div
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: card.color }}
                      />
                      <span className="text-xs font-medium text-slate-400">{card.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Arrow
                        className={cn(
                          'h-5 w-5',
                          isPositive ? 'text-emerald-400' : 'text-red-400'
                        )}
                      />
                      <span
                        className={cn(
                          'text-lg font-semibold',
                          isPositive ? 'text-emerald-400' : 'text-red-400'
                        )}
                      >
                        {isPositive ? '+' : ''}
                        {value.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                );
              })}
        </div>
      </div>
    </div>
  );
}
