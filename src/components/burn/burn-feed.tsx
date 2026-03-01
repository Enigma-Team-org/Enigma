'use client';

import { motion } from 'framer-motion';
import { Flame, ExternalLink } from 'lucide-react';

interface BurnEvent {
  id: string;
  chainName: string;
  amountInUsd: number;
  nativeToken: string;
  amountBurned: number;
  txHash: string;
  createdAt: string;
}

interface BurnFeedProps {
  burns: BurnEvent[];
}

function formatTime(dateString: string): string {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.floor(diffHours / 24)}d ago`;
}

function getExplorerUrl(chainName: string, txHash: string): string {
  return chainName === 'Avalanche'
    ? `https://snowtrace.io/tx/${txHash}`
    : `https://basescan.org/tx/${txHash}`;
}

export function BurnFeed({ burns }: BurnFeedProps) {
  if (burns.length === 0) {
    return (
      <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] p-8 text-center">
        <Flame className="mx-auto mb-2 h-8 w-8 text-[#475569]" />
        <p className="text-sm text-[#475569]">No burns recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)]">
      <div className="border-b border-[rgba(255,255,255,0.06)] px-5 py-3">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-[#475569]">Recent Burns</p>
      </div>
      <div className="divide-y divide-[rgba(255,255,255,0.04)]">
        {burns.map((burn, i) => (
          <motion.div
            key={burn.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-center gap-3 px-5 py-3"
          >
            <Flame className="h-4 w-4 shrink-0 text-[#FB923C]" />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-white">
                {burn.amountBurned.toFixed(4)} {burn.nativeToken}
                <span className="ml-1 text-[#475569]">burned on {burn.chainName}</span>
              </p>
              <p className="font-data text-[10px] text-[#475569]">${burn.amountInUsd.toFixed(2)} USDC</p>
            </div>
            <span className="shrink-0 text-[10px] text-[#475569]">{formatTime(burn.createdAt)}</span>
            <a
              href={getExplorerUrl(burn.chainName, burn.txHash)}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 text-[#475569] hover:text-white"
            >
              <ExternalLink className="h-3 w-3" />
            </a>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
