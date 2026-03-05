'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  type TooltipProps,
} from 'recharts';
import { BarChart3 } from 'lucide-react';
import { useTrustDistribution } from '@/hooks/use-trust-distribution';
import { Spinner } from '@/components/shared/spinner';
import { cn } from '@/lib/utils';

// Colors gradient from red (low trust) to green (high trust)
const RANGE_COLORS: Record<string, string> = {
  '0-20': '#EF4444',   // Red
  '21-40': '#F97316',  // Orange
  '41-60': '#EAB308',  // Yellow
  '61-80': '#22C55E',  // Light green
  '81-100': '#4ADE80', // Primary green
};

function CustomTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  return (
    <div className={cn(
      'rounded-xl border border-[rgba(255,255,255,0.1)] px-4 py-3',
      'bg-[rgba(11,15,20,0.97)] shadow-[0_8px_32px_rgba(0,0,0,0.5)]',
    )}>
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[#64748B]">
        Trust Score {data.range}
      </p>
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-6">
          <span className="text-xs text-[#94A3B8]">Agents</span>
          <span className="font-data text-sm font-bold text-white">{data.count}</span>
        </div>
        <div className="flex items-center justify-between gap-6">
          <span className="text-xs text-[#94A3B8]">Percentage</span>
          <span className="font-data text-sm font-bold text-white">{data.percentage}%</span>
        </div>
      </div>
    </div>
  );
}

export function TrustDistributionChart() {
  const { data, isLoading } = useTrustDistribution();

  const distribution = data?.distribution ?? [];

  return (
    <div className="glass flex h-full flex-col gap-5 p-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-white">Trust Score Distribution</h2>
          <p className="mt-0.5 text-xs text-[#64748B]">Agent distribution by trust score range</p>
        </div>
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[rgba(74,222,128,0.1)]">
          <BarChart3 className="h-3.5 w-3.5 text-[#4ADE80]" />
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-[180px]">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <Spinner className="h-6 w-6 text-primary" />
          </div>
        ) : distribution.length === 0 ? (
          <div className="flex h-full items-center justify-center text-xs text-[#64748B]">
            No distribution data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={distribution}
              margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
            >
              <CartesianGrid
                stroke="rgba(255,255,255,0.04)"
                horizontal
                vertical={false}
              />
              <XAxis
                dataKey="range"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748B', fontSize: 10 }}
                dy={8}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#475569', fontSize: 10 }}
                width={40}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Bar
                dataKey="count"
                radius={[4, 4, 0, 0]}
                maxBarSize={48}
              >
                {distribution.map((entry) => (
                  <Cell
                    key={entry.range}
                    fill={RANGE_COLORS[entry.range] ?? '#4ADE80'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 border-t border-[rgba(255,255,255,0.06)] pt-3">
        {distribution.map((item) => (
          <div key={item.range} className="flex items-center gap-1.5">
            <div
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: RANGE_COLORS[item.range] }}
            />
            <span className="text-[10px] text-[#64748B]">
              {item.range}: {item.percentage}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
