'use client';

import { useState } from 'react';
import {
  ExternalLink,
  Copy,
  Check,
  Shield,
  Code2,
  Activity,
  Layers,
  AlertCircle,
  Zap,
  TrendingUp,
  Lock,
  Unlock,
  Server,
  Database,
  BarChart3,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { AgentDetail } from '@/hooks/use-agent';

interface ReputationContractProps {
  agent: AgentDetail;
}

export function ReputationContract({ agent }: ReputationContractProps) {
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [copiedImpl, setCopiedImpl] = useState(false);

  const handleCopy = (text: string, type: 'address' | 'impl') => {
    navigator.clipboard.writeText(text);
    if (type === 'address') {
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
    } else {
      setCopiedImpl(true);
      setTimeout(() => setCopiedImpl(false), 2000);
    }
  };

  const snowtraceUrl = `https://snowtrace.io/address/${agent.address}`;

  // Proxy status
  const getProxyStatus = () => {
    if (!agent.proxy.detected || agent.proxy.type === 'NONE') {
      return {
        color: 'emerald',
        label: 'Direct Contract',
        description: 'Immutable deployment',
        icon: Unlock,
      };
    }
    if (agent.proxy.type === 'CUSTOM') {
      return {
        color: 'rose',
        label: 'Custom Proxy',
        description: 'Non-standard upgradeable',
        icon: AlertCircle,
      };
    }
    return {
      color: 'amber',
      label: agent.proxy.type,
      description: 'Standard upgradeable',
      icon: Lock,
    };
  };

  const proxyStatus = getProxyStatus();
  const ozMatchScore = agent.trustScore.pillars.infrastructure.score;
  const ozComponents: string[] = [];
  const uptimePercentage = agent.uptime.percentage;

  return (
    <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-[#0F1117] via-[#1A1625] to-[#0F1117] border border-purple-500/20">
      {/* Animated mesh gradient background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Content */}
      <div className="relative">
        {/* Header Section */}
        <div className="border-b border-white/5 bg-gradient-to-r from-purple-500/5 via-transparent to-blue-500/5">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative h-14 w-14 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 p-0.5">
                  <div className="h-full w-full rounded-xl bg-[#0F1117] flex items-center justify-center">
                    <Code2 className="h-7 w-7 text-purple-400" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-0.5">Contract Inspector</h3>
                  <p className="text-sm text-white/50">On-chain analysis & metrics</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/50 transition-all"
              >
                <a href={snowtraceUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2 text-purple-400" />
                  <span className="text-white/80">Snowtrace</span>
                </a>
              </Button>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Contract Address Bar */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/5 to-purple-500/0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative flex items-center gap-4 p-4 bg-white/[0.02] hover:bg-white/[0.04] rounded-xl border border-white/5 hover:border-purple-500/30 transition-all">
              <Server className="h-5 w-5 text-purple-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-white/40 mb-1 uppercase tracking-wider font-medium">Contract Address</p>
                <code className="text-sm text-white/90 font-mono break-all">{agent.address}</code>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCopy(agent.address, 'address')}
                className="h-9 px-3 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 hover:border-purple-500/40 shrink-0"
              >
                {copiedAddress ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400 mr-1.5" />
                    <span className="text-xs text-emerald-400 font-medium">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 text-purple-300 mr-1.5" />
                    <span className="text-xs text-purple-300 font-medium">Copy</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Main Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Proxy Status */}
            <MetricCard
              icon={proxyStatus.icon}
              iconColor={proxyStatus.color}
              label="Proxy Status"
              value={proxyStatus.label}
              description={proxyStatus.description}
            />

            {/* Security Score */}
            <MetricCard
              icon={Shield}
              iconColor="emerald"
              label="Security Score"
              value={`${ozMatchScore}/100`}
              description={ozComponents.length > 0 ? `${ozComponents.length} OZ patterns` : 'No patterns detected'}
            />

            {/* Uptime */}
            <MetricCard
              icon={Zap}
              iconColor={uptimePercentage >= 99 ? 'emerald' : uptimePercentage >= 95 ? 'amber' : 'rose'}
              label="Uptime (7d)"
              value={`${uptimePercentage.toFixed(1)}%`}
              description={`${agent.uptime.averageResponseTimeMs}ms avg response`}
            />

            {/* Volume */}
            <MetricCard
              icon={TrendingUp}
              iconColor="cyan"
              label="Volume (30d)"
              value={agent.volumes.month ? `${parseFloat(agent.volumes.month.volumeAvax).toFixed(2)} AVAX` : 'No data'}
              description={agent.volumes.month ? `${agent.volumes.month.txCount} transactions` : 'No activity'}
            />
          </div>

          {/* Detailed Sections */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Proxy Details (if proxy) */}
            {agent.proxy.detected && agent.proxy.implementationAddress && (
              <DetailCard
                icon={Layers}
                title="Proxy Implementation"
                color="amber"
              >
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-white/40 mb-1">Type</p>
                    <p className="text-sm text-white/90 font-medium">{agent.proxy.type}</p>
                  </div>
                  <div>
                    <p className="text-xs text-white/40 mb-1">Implementation Address</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-xs text-white/70 font-mono break-all bg-black/20 px-2 py-1.5 rounded">
                        {agent.proxy.implementationAddress}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopy(agent.proxy.implementationAddress!, 'impl')}
                        className="h-7 w-7 p-0 bg-white/5 hover:bg-white/10"
                      >
                        {copiedImpl ? (
                          <Check className="h-3 w-3 text-emerald-400" />
                        ) : (
                          <Copy className="h-3 w-3 text-white/50" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </DetailCard>
            )}

            {/* Security Patterns */}
            {ozComponents.length > 0 && (
              <DetailCard
                icon={Shield}
                title="Security Patterns"
                color="emerald"
              >
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-white/40 mb-2">OpenZeppelin Components</p>
                    <div className="flex flex-wrap gap-1.5">
                      {ozComponents.map((comp) => (
                        <span
                          key={comp}
                          className="px-2.5 py-1 text-xs rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-medium"
                        >
                          {comp}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </DetailCard>
            )}

            {/* Transaction Volume Details */}
            {agent.volumes.month && (
              <DetailCard
                icon={BarChart3}
                title="Transaction Activity"
                color="cyan"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/50">Total Volume</span>
                    <span className="text-sm text-white/90 font-semibold">{parseFloat(agent.volumes.month.volumeAvax).toFixed(2)} AVAX</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/50">USD Value</span>
                    <span className="text-sm text-white/70">${parseFloat(agent.volumes.month.volumeUsd).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/50">Transactions</span>
                    <span className="text-sm text-cyan-400 font-medium">{agent.volumes.month.txCount.toLocaleString()}</span>
                  </div>
                </div>
              </DetailCard>
            )}

            {/* ERC-8004 Registry */}
            {agent.registryAddress && agent.tokenId !== null && (
              <DetailCard
                icon={Database}
                title="ERC-8004 Identity"
                color="purple"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/50">Token ID</span>
                    <div className="flex items-center gap-2">
                      <span className="text-lg text-purple-300 font-bold">#{agent.tokenId}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="h-7 w-7 p-0 bg-purple-500/10 hover:bg-purple-500/20"
                      >
                        <a
                          href={`https://snowtrace.io/token/${agent.registryAddress}?a=${agent.tokenId}#inventory`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-3.5 w-3.5 text-purple-300" />
                        </a>
                      </Button>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-white/40 mb-1">Registry Contract</p>
                    <code className="text-xs text-purple-300/80 font-mono break-all block bg-black/20 px-2 py-1.5 rounded">
                      {agent.registryAddress}
                    </code>
                  </div>
                </div>
              </DetailCard>
            )}
          </div>

          {/* Uptime Details */}
          <div className="p-4 bg-white/[0.02] rounded-xl border border-white/5">
            <div className="flex items-center gap-3 mb-3">
              <Activity className="h-4 w-4 text-white/40" />
              <h4 className="text-sm font-semibold text-white/80">Uptime Metrics (7 Days)</h4>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-white/40 mb-1">Total Pings</p>
                <p className="text-lg font-bold text-white">{agent.uptime.totalPings}</p>
              </div>
              <div>
                <p className="text-xs text-white/40 mb-1">Successful</p>
                <p className="text-lg font-bold text-emerald-400">{agent.uptime.successfulPings}</p>
              </div>
              <div>
                <p className="text-xs text-white/40 mb-1">Failed</p>
                <p className="text-lg font-bold text-rose-400">{agent.uptime.failedPings}</p>
              </div>
              <div>
                <p className="text-xs text-white/40 mb-1">Timeouts</p>
                <p className="text-lg font-bold text-amber-400">{agent.uptime.timeoutPings}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Metric Card Component
function MetricCard({
  icon: Icon,
  iconColor,
  label,
  value,
  description,
}: {
  icon: LucideIcon;
  iconColor: string;
  label: string;
  value: string;
  description: string;
}) {
  const colorClasses = {
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    rose: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  };

  const valueColors = {
    emerald: 'text-emerald-300',
    amber: 'text-amber-300',
    rose: 'text-rose-300',
    cyan: 'text-cyan-300',
    purple: 'text-purple-300',
  };

  return (
    <div className="group p-4 bg-white/[0.02] hover:bg-white/[0.04] rounded-xl border border-white/5 hover:border-white/10 transition-all">
      <div className="flex items-center gap-3 mb-3">
        <div className={cn('p-2 rounded-lg border', colorClasses[iconColor as keyof typeof colorClasses])}>
          <Icon className="h-4 w-4" />
        </div>
        <span className="text-xs font-medium text-white/50 uppercase tracking-wider">{label}</span>
      </div>
      <p className={cn('text-xl font-bold mb-1', valueColors[iconColor as keyof typeof valueColors])}>{value}</p>
      <p className="text-xs text-white/40">{description}</p>
    </div>
  );
}

// Detail Card Component
function DetailCard({
  icon: Icon,
  title,
  color,
  children,
}: {
  icon: LucideIcon;
  title: string;
  color: string;
  children: React.ReactNode;
}) {
  const colorClasses = {
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    rose: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  };

  return (
    <div className="p-4 bg-white/[0.02] rounded-xl border border-white/5">
      <div className="flex items-center gap-3 mb-4">
        <div className={cn('p-2 rounded-lg border', colorClasses[color as keyof typeof colorClasses])}>
          <Icon className="h-4 w-4" />
        </div>
        <h4 className="text-sm font-semibold text-white/80">{title}</h4>
      </div>
      {children}
    </div>
  );
}
