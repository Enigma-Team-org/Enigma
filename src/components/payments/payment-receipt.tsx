'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, Check, Copy } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils/index';

interface PaymentReceiptProps {
  isOpen: boolean;
  onClose: () => void;
  receipt: {
    paymentId: string;
    type: string;
    amountUsd: string;
    tokenSymbol: string;
    chainName: string;
    txHash?: string;
    status: string;
    completedAt?: string;
  } | null;
}

function formatPaymentType(type: string): string {
  return type.replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
}

export function PaymentReceipt({ isOpen, onClose, receipt }: PaymentReceiptProps) {
  const [copied, setCopied] = useState(false);

  if (!receipt) return null;

  const handleCopyTx = () => {
    if (receipt.txHash) {
      navigator.clipboard.writeText(receipt.txHash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const explorerUrl = receipt.txHash
    ? receipt.chainName === 'Avalanche'
      ? `https://snowtrace.io/tx/${receipt.txHash}`
      : `https://basescan.org/tx/${receipt.txHash}`
    : null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[rgba(0,0,0,0.6)] backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-x-4 top-[20%] z-50 mx-auto max-w-md rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(15,20,28,0.98)] p-6 shadow-2xl backdrop-blur-[20px]"
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Payment Receipt</h3>
              <button onClick={onClose} className="text-[#475569] hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mb-4 flex items-center justify-center">
              <div className={cn(
                'flex h-12 w-12 items-center justify-center rounded-full',
                receipt.status === 'COMPLETED'
                  ? 'bg-[rgba(74,222,128,0.15)]'
                  : 'bg-[rgba(251,113,133,0.15)]'
              )}>
                <Check className={cn(
                  'h-6 w-6',
                  receipt.status === 'COMPLETED' ? 'text-[#4ADE80]' : 'text-[#FB7185]'
                )} />
              </div>
            </div>

            <div className="mb-4 text-center">
              <p className="text-2xl font-bold text-white">${receipt.amountUsd}</p>
              <p className="mt-1 text-xs text-[#64748B]">
                {formatPaymentType(receipt.type)} · {receipt.tokenSymbol} on {receipt.chainName}
              </p>
            </div>

            <div className="space-y-2 rounded-lg border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] p-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[#475569]">Status</span>
                <span className={cn(
                  'rounded px-1.5 py-0.5 text-[10px] font-semibold',
                  receipt.status === 'COMPLETED'
                    ? 'bg-[rgba(74,222,128,0.1)] text-[#4ADE80]'
                    : 'bg-[rgba(251,113,133,0.1)] text-[#FB7185]'
                )}>
                  {receipt.status}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[#475569]">Payment ID</span>
                <span className="font-data text-[10px] text-[#94A3B8]">{receipt.paymentId.slice(0, 12)}...</span>
              </div>
              {receipt.txHash && (
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[#475569]">Tx Hash</span>
                  <button onClick={handleCopyTx} className="inline-flex items-center gap-1 text-[10px] text-[#94A3B8] hover:text-white">
                    {receipt.txHash.slice(0, 10)}...{receipt.txHash.slice(-4)}
                    {copied ? <Check className="h-3 w-3 text-[#4ADE80]" /> : <Copy className="h-3 w-3" />}
                  </button>
                </div>
              )}
              {receipt.completedAt && (
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[#475569]">Date</span>
                  <span className="text-[10px] text-[#94A3B8]">
                    {new Date(receipt.completedAt).toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            {explorerUrl && (
              <a
                href={explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-4 py-2.5 text-xs font-medium text-white transition-colors hover:bg-[rgba(255,255,255,0.08)]"
              >
                View on Explorer
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
