'use client';

import { motion } from 'framer-motion';
import { Flame, TrendingUp, Coins } from 'lucide-react';

interface BurnStatsProps {
  totalBurnedUsd: number;
  totalPendingUsd: number;
  totalBurnCount: number;
}

export function BurnStats({ totalBurnedUsd, totalPendingUsd, totalBurnCount }: BurnStatsProps) {
  const stats = [
    { label: 'TOTAL BURNED', value: `$${totalBurnedUsd.toFixed(2)}`, icon: Flame, color: 'text-[#FB923C]' },
    { label: 'PENDING BURN', value: `$${totalPendingUsd.toFixed(4)}`, icon: Coins, color: 'text-[#FCD34D]' },
    { label: 'BURN COUNT', value: totalBurnCount.toString(), icon: TrendingUp, color: 'text-[#4ADE80]' },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {stats.map((stat, i) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] p-5"
          >
            <div className="mb-3 flex items-center gap-2">
              <Icon className={`h-4 w-4 ${stat.color}`} />
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#475569]">{stat.label}</p>
            </div>
            <p className="font-data text-2xl font-bold text-white">{stat.value}</p>
          </motion.div>
        );
      })}
    </div>
  );
}
