'use client';

import { useState, useEffect, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';
import { cn } from '@/lib/utils/index';
import { PaymentButton } from './payment-button';
import { TokenSelector } from './token-selector';
import { SERVICE_PRICES, getTokenAddress, SUPPORTED_TOKENS } from '@/lib/x402/config';

interface PaywallGateProps {
  agentAddress: string;
  paymentType: 'TRUST_SCORE_QUERY' | 'SENTINEL_VALIDATION' | 'DEEP_ANALYSIS' | 'AGENT_VERIFICATION';
  children: ReactNode;
  label?: string;
  description?: string;
  className?: string;
}

function getCacheKey(payerAddress: string, paymentType: string, agentAddress: string) {
  return `enigma_payment_${payerAddress}_${paymentType}_${agentAddress}`;
}

function checkCachedPayment(paymentType: string, agentAddress: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const payerAddress = localStorage.getItem('enigma_wallet_address') ?? '';
    if (!payerAddress) return false;
    const key = getCacheKey(payerAddress, paymentType, agentAddress);
    const cached = localStorage.getItem(key);
    if (!cached) return false;
    const { expiresAt } = JSON.parse(cached);
    if (Date.now() > expiresAt) {
      localStorage.removeItem(key);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

function cachePayment(paymentType: string, agentAddress: string) {
  try {
    const payerAddress = localStorage.getItem('enigma_wallet_address') ?? '';
    if (!payerAddress) return;
    const key = getCacheKey(payerAddress, paymentType, agentAddress);
    localStorage.setItem(key, JSON.stringify({ expiresAt: Date.now() + 24 * 60 * 60 * 1000 }));
  } catch {}
}

export function PaywallGate({
  agentAddress,
  paymentType,
  children,
  label = 'Unlock',
  description,
  className,
}: PaywallGateProps) {
  const [isPaid, setIsPaid] = useState(false);
  const [selectedToken, setSelectedToken] = useState('USDC');

  const priceInfo = SERVICE_PRICES.find((p) => p.type === paymentType);
  const priceUsd = priceInfo?.priceUsd ?? '0.00';

  useEffect(() => {
    if (checkCachedPayment(paymentType, agentAddress)) {
      setIsPaid(true);
    }
  }, [paymentType, agentAddress]);

  const handlePay = async () => {
    const chainId = 43114; // Avalanche
    const tokenAddress = getTokenAddress(selectedToken, chainId);
    if (!tokenAddress) throw new Error('Token not supported on this chain');

    const payerAddress = localStorage.getItem('enigma_wallet_address');
    if (!payerAddress) throw new Error('Wallet not connected');

    // Create payment intent
    const createRes = await fetch('/api/v1/payments/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        payerAddress,
        type: paymentType,
        tokenAddress,
        chainId,
        agentAddress,
      }),
    });

    if (!createRes.ok) {
      const err = await createRes.json();
      throw new Error(err.error?.message ?? 'Failed to create payment');
    }

    const { data } = await createRes.json();

    // In production this would trigger wagmi signTypedData + send to facilitator
    // For now, simulate verification with a placeholder tx hash
    const verifyRes = await fetch('/api/v1/payments/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        paymentId: data.paymentId,
        txHash: '0x' + '0'.repeat(64), // placeholder — real flow uses wagmi
      }),
    });

    if (!verifyRes.ok) {
      throw new Error('Payment verification failed');
    }

    cachePayment(paymentType, agentAddress);
    setIsPaid(true);
  };

  if (isPaid) {
    return <>{children}</>;
  }

  return (
    <div className={cn('relative', className)}>
      {/* Blurred content preview */}
      <div className="pointer-events-none select-none blur-sm opacity-40">
        {children}
      </div>

      {/* Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-xl bg-[rgba(0,0,0,0.6)] backdrop-blur-sm"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(167,139,250,0.15)]">
          <Lock className="h-5 w-5 text-[#A78BFA]" />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-white">{label}</p>
          {description && <p className="mt-1 text-xs text-[#64748B]">{description}</p>}
        </div>
        <TokenSelector selected={selectedToken} onSelect={setSelectedToken} />
        <PaymentButton
          label={label}
          priceUsd={priceUsd}
          onPay={handlePay}
        />
      </motion.div>
    </div>
  );
}
