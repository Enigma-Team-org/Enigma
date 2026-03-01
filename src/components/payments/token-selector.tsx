'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils/index';

const TOKENS = [
  { symbol: 'USDC', name: 'USD Coin', logo: '/tokens/usdc.svg' },
  { symbol: 'EURC', name: 'Euro Coin', logo: '/tokens/eurc.svg' },
] as const;

interface TokenSelectorProps {
  selected: string;
  onSelect: (symbol: string) => void;
  className?: string;
}

export function TokenSelector({ selected, onSelect, className }: TokenSelectorProps) {
  return (
    <div className={cn('flex gap-2', className)}>
      {TOKENS.map((token) => (
        <button
          key={token.symbol}
          onClick={() => onSelect(token.symbol)}
          className={cn(
            'relative flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-all',
            selected === token.symbol
              ? 'border-[rgba(74,222,128,0.3)] bg-[rgba(74,222,128,0.08)] text-[#4ADE80]'
              : 'border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] text-[#64748B] hover:bg-[rgba(255,255,255,0.04)]'
          )}
        >
          {selected === token.symbol && (
            <motion.div
              layoutId="token-indicator"
              className="absolute inset-0 rounded-lg border border-[rgba(74,222,128,0.3)]"
              transition={{ type: 'spring', duration: 0.3 }}
            />
          )}
          <span className="relative">{token.symbol}</span>
        </button>
      ))}
    </div>
  );
}
