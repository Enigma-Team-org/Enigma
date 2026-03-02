'use client';

import { type FC, useState, useCallback } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { Wallet, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/index';

interface WalletConnectButtonProps {
  className?: string;
}

export const WalletConnectButton: FC<WalletConnectButtonProps> = ({
  className,
}) => {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = useCallback((connectorIndex: number) => {
    const connector = connectors[connectorIndex];
    if (!connector) return;

    setError(null);
    connect(
      { connector },
      {
        onSuccess: () => setShowModal(false),
        onError: (err) => {
          console.error('Wallet connection error:', err);
          if (err.message?.includes('user rejected')) {
            setError('Connection rejected by user');
          } else if (err.message?.includes('No provider')) {
            setError('No wallet found. Install MetaMask or Core Wallet.');
          } else {
            setError(err.message || 'Failed to connect wallet');
          }
        },
      },
    );
  }, [connect, connectors]);

  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (isConnected && address) {
    return (
      <Button
        variant="outline"
        onClick={() => disconnect()}
        className={cn(className)}
      >
        {truncateAddress(address)}
      </Button>
    );
  }

  if (isPending) {
    return (
      <Button disabled className={cn(className)}>
        Connecting...
      </Button>
    );
  }

  return (
    <>
      <Button onClick={() => { setError(null); setShowModal(true); }} className={cn(className)}>
        <Wallet className="mr-1.5 h-3.5 w-3.5" />
        Connect Wallet
      </Button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />
          <div className="relative z-10 w-full max-w-sm rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#0a0f1a] p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Connect Wallet</h3>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg p-1 text-[#64748B] hover:bg-[rgba(255,255,255,0.05)] hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mb-5 text-sm text-[#64748B]">
              Choose a wallet to connect to Enigma Platform
            </p>

            {error && (
              <div className="mb-4 flex items-start gap-2 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex flex-col gap-2">
              {connectors.map((connector, index) => {
                const isInjected = connector.type === 'injected';
                return (
                  <button
                    key={connector.uid}
                    onClick={() => handleConnect(index)}
                    className="flex items-center gap-3 rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] px-4 py-3 text-left text-sm font-medium text-white transition-all hover:border-[#4ADE80]/30 hover:bg-[#4ADE80]/5"
                  >
                    <div className={cn(
                      'flex h-9 w-9 items-center justify-center rounded-lg',
                      isInjected ? 'bg-[rgba(251,191,36,0.1)]' : 'bg-[rgba(74,222,128,0.1)]'
                    )}>
                      <Wallet className={cn('h-4 w-4', isInjected ? 'text-amber-400' : 'text-[#4ADE80]')} />
                    </div>
                    <div>
                      <div>{connector.name}</div>
                      <div className="text-[10px] text-[#64748B]">
                        {isInjected ? 'Browser Extension (MetaMask, Core)' : 'Scan QR Code'}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <p className="mt-4 text-center text-[10px] text-[#475569]">
              Avalanche C-Chain (Mainnet & Fuji)
            </p>
          </div>
        </div>
      )}
    </>
  );
};
