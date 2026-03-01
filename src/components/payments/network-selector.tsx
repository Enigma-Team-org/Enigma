'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils/index';

const NETWORKS = [
  { chainId: 43114, name: 'Avalanche', native: 'AVAX', color: '#E84142' },
  { chainId: 8453, name: 'Base', native: 'ETH', color: '#0052FF' },
] as const;

interface NetworkSelectorProps {
  selected: number;
  onSelect: (chainId: number) => void;
  className?: string;
}

export function NetworkSelector({ selected, onSelect, className }: NetworkSelectorProps) {
  return (
    <div className={cn('flex gap-2', className)}>
      {NETWORKS.map((network) => (
        <button
          key={network.chainId}
          onClick={() => onSelect(network.chainId)}
          className={cn(
            'relative flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-all',
            selected === network.chainId
              ? 'border-[rgba(74,222,128,0.3)] bg-[rgba(74,222,128,0.08)] text-white'
              : 'border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] text-[#64748B] hover:bg-[rgba(255,255,255,0.04)]'
          )}
        >
          {selected === network.chainId && (
            <motion.div
              layoutId="network-indicator"
              className="absolute inset-0 rounded-lg border border-[rgba(74,222,128,0.3)]"
              transition={{ type: 'spring', duration: 0.3 }}
            />
          )}
          <div
            className="relative h-2 w-2 rounded-full"
            style={{ backgroundColor: network.color }}
          />
          <span className="relative">{network.name}</span>
        </button>
      ))}
    </div>
  );
}
