'use client';

import { type FC, useState } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { Wallet, X } from 'lucide-react';
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

  const handleConnect = (connectorIndex: number) => {
    const connector = connectors[connectorIndex];
    if (connector) {
      connect({ connector });
      setShowModal(false);
    }
  };

  const handleDisconnect = () => {
    disconnect();
  };

  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (isConnected && address) {
    return (
      <Button
        variant="outline"
        onClick={handleDisconnect}
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
      <Button onClick={() => setShowModal(true)} className={cn(className)}>
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
            <div className="flex flex-col gap-2">
              {connectors.map((connector, index) => (
                <button
                  key={connector.uid}
                  onClick={() => handleConnect(index)}
                  className="flex items-center gap-3 rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] px-4 py-3 text-left text-sm font-medium text-white transition-all hover:border-[#4ADE80]/30 hover:bg-[#4ADE80]/5"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[rgba(74,222,128,0.1)]">
                    <Wallet className="h-4 w-4 text-[#4ADE80]" />
                  </div>
                  <div>
                    <div>{connector.name}</div>
                    <div className="text-[10px] text-[#64748B]">
                      {connector.type === 'injected' ? 'Browser Extension' : 'Scan QR Code'}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
