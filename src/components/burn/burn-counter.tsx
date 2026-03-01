'use client';

import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useEffect } from 'react';
import { Flame } from 'lucide-react';

interface BurnCounterProps {
  totalBurnedUsd: number;
}

export function BurnCounter({ totalBurnedUsd }: BurnCounterProps) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => `$${latest.toFixed(2)}`);

  useEffect(() => {
    const controls = animate(count, totalBurnedUsd, { duration: 2, ease: 'easeOut' });
    return controls.stop;
  }, [totalBurnedUsd, count]);

  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-[rgba(251,146,60,0.2)] bg-[rgba(251,146,60,0.04)] p-8">
      <Flame className="mb-3 h-10 w-10 text-[#FB923C]" />
      <motion.p className="font-data text-4xl font-bold text-white">{rounded}</motion.p>
      <p className="mt-1 text-sm text-[#475569]">Total Value Burned</p>
    </div>
  );
}
