'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface GdpHistoryEntry {
  date: string;
  paymentVolumeUsd: number;
  burnVolumeUsd: number;
  dealVolumeUsd: number;
}

interface GdpChartProps {
  data?: GdpHistoryEntry[];
  isLoading?: boolean;
}

function formatAxisDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatUsd(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(2)}`;
}

interface TooltipPayloadEntry {
  name: string;
  value: number;
  color: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border border-white/[0.06] bg-[#0f1117]/95 px-4 py-3 shadow-xl backdrop-blur-sm">
      <p className="mb-2 text-xs font-medium text-slate-400">
        {label ? formatAxisDate(label) : ''}
      </p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center justify-between gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-slate-300">{entry.name}</span>
          </div>
          <span className="font-medium text-white">{formatUsd(entry.value)}</span>
        </div>
      ))}
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="flex h-[350px] items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.04]">
      <div className="animate-pulse text-sm text-slate-500">Loading chart data...</div>
    </div>
  );
}

export function GdpChart({ data, isLoading }: GdpChartProps) {
  if (isLoading || !data) {
    return <ChartSkeleton />;
  }

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.04] p-6 backdrop-blur-sm">
      <h3 className="mb-4 text-sm font-medium text-slate-400">GDP Volume Over Time</h3>
      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis
            dataKey="date"
            tickFormatter={formatAxisDate}
            tick={{ fontSize: 12, fill: '#64748B' }}
            axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
            tickLine={false}
          />
          <YAxis
            tickFormatter={formatUsd}
            tick={{ fontSize: 12, fill: '#64748B' }}
            axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
            tickLine={false}
            width={60}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="bottom"
            height={36}
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }}
          />
          <Line
            type="monotone"
            dataKey="paymentVolumeUsd"
            name="Payments"
            stroke="#4ADE80"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: '#4ADE80', stroke: '#0f1117', strokeWidth: 2 }}
          />
          <Line
            type="monotone"
            dataKey="burnVolumeUsd"
            name="Burns"
            stroke="#FB923C"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: '#FB923C', stroke: '#0f1117', strokeWidth: 2 }}
          />
          <Line
            type="monotone"
            dataKey="dealVolumeUsd"
            name="Deals"
            stroke="#60A5FA"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: '#60A5FA', stroke: '#0f1117', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
