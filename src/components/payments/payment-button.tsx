'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils/index';
import { Loader2, Check, AlertCircle } from 'lucide-react';

type PaymentState = 'idle' | 'loading' | 'success' | 'error';

interface PaymentButtonProps {
  label: string;
  priceUsd: string;
  onPay: () => Promise<void>;
  disabled?: boolean;
  className?: string;
}

export function PaymentButton({ label, priceUsd, onPay, disabled, className }: PaymentButtonProps) {
  const [state, setState] = useState<PaymentState>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleClick = async () => {
    if (state === 'loading' || state === 'success') return;
    setState('loading');
    setErrorMsg('');

    try {
      await onPay();
      setState('success');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Payment failed');
      setState('error');
      setTimeout(() => setState('idle'), 3000);
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <motion.button
        onClick={handleClick}
        disabled={disabled || state === 'loading' || state === 'success'}
        whileTap={{ scale: 0.98 }}
        className={cn(
          'relative flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-all',
          state === 'success'
            ? 'border border-[rgba(74,222,128,0.3)] bg-[rgba(74,222,128,0.1)] text-[#4ADE80]'
            : state === 'error'
              ? 'border border-[rgba(251,113,133,0.3)] bg-[rgba(251,113,133,0.1)] text-[#FB7185]'
              : 'border border-[rgba(74,222,128,0.3)] bg-[rgba(74,222,128,0.08)] text-[#4ADE80] hover:bg-[rgba(74,222,128,0.15)]',
          (disabled || state === 'loading') && 'cursor-not-allowed opacity-50',
          className
        )}
      >
        <AnimatePresence mode="wait">
          {state === 'loading' && (
            <motion.span key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Loader2 className="h-4 w-4 animate-spin" />
            </motion.span>
          )}
          {state === 'success' && (
            <motion.span key="success" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }}>
              <Check className="h-4 w-4" />
            </motion.span>
          )}
          {state === 'error' && (
            <motion.span key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <AlertCircle className="h-4 w-4" />
            </motion.span>
          )}
        </AnimatePresence>
        <span>
          {state === 'loading' ? 'Processing...' : state === 'success' ? 'Paid!' : state === 'error' ? 'Failed' : `${label} · $${priceUsd}`}
        </span>
      </motion.button>
      {errorMsg && <p className="text-[10px] text-[#FB7185]">{errorMsg}</p>}
    </div>
  );
}
