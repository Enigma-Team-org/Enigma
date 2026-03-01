'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Bot,
  PlusCircle,
  BarChart2,
  BarChart3,
  Settings,
  Home,
  Shield,
  Activity,
  ChevronRight,
  GitBranch,
  BookOpen,
  Flame,
  Store,
  X,
} from 'lucide-react';
import { useAgentStats } from '@/hooks/use-agent-stats';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/',               label: 'Home',     icon: Home,            exact: true  },
  { href: '/scanner',        label: 'Overview', icon: LayoutDashboard, exact: true  },
  { href: '/scanner/agents', label: 'Agents',   icon: Bot,             exact: false },
  { href: '/burn',           label: 'Burn',     icon: Flame,           exact: true  },
  { href: '/marketplace',   label: 'Market',   icon: Store,           exact: false },
  { href: '/dashboard',     label: 'GDP',      icon: BarChart3,       exact: true  },
  { href: '/register',       label: 'Register', icon: PlusCircle,      exact: true  },
  { href: '/docs',           label: 'Docs',     icon: BookOpen,        exact: false },
] as const;

const disabledItems = [
  { label: 'Analytics', icon: BarChart2 },
  { label: 'Settings',  icon: Settings  },
];

interface DashboardSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function DashboardSidebar({ isOpen = false, onClose }: DashboardSidebarProps) {
  const pathname = usePathname();
  const { data: stats } = useAgentStats();

  const agentMatch = pathname.match(/\/agents\/(0x[a-fA-F0-9]{40})/i);
  const currentAgentAddress = agentMatch?.[1];

  const verifiedPct = stats && stats.total > 0
    ? Math.round((stats.verified / stats.total) * 100)
    : 0;

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-[rgba(0,0,0,0.6)] lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside className={cn(
        'flex h-screen w-60 flex-shrink-0 flex-col',
        'border-r border-[rgba(255,255,255,0.06)]',
        'bg-[rgba(11,15,20,0.98)] backdrop-blur-[20px]',
        // Mobile: fixed drawer slides in from left
        'fixed inset-y-0 left-0 z-50 transition-transform duration-200 ease-in-out',
        isOpen ? 'translate-x-0' : '-translate-x-full',
        // Desktop: always visible, static in flow
        'lg:relative lg:z-auto lg:translate-x-0',
      )}>

        {/* Mobile close button */}
        <button
          onClick={onClose}
          className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-lg text-[#475569] hover:text-white lg:hidden"
          aria-label="Close menu"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Org Card */}
        <div className="border-b border-[rgba(255,255,255,0.06)] p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center overflow-hidden">
              <Image src="/logo-f1-waves-dark.svg" alt="Enigma" width={32} height={32} className="object-contain" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">Enigma Platform</p>
              <p className="truncate text-[11px] text-[#64748B]">Avalanche Mainnet</p>
            </div>
          </div>
          <div className={cn(
            'mt-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1',
            'bg-[rgba(74,222,128,0.08)] border border-[rgba(74,222,128,0.15)]',
          )}>
            <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] font-medium text-primary">Mainnet</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-widest text-[#475569]">
            Navigation
          </p>

          {navItems.map((item) => {
            const active = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={`${item.href}-${item.label}`}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'group flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-all duration-150',
                  active
                    ? 'border-l-2 border-primary bg-[rgba(74,222,128,0.06)] pl-[10px] text-white'
                    : 'border-l-2 border-transparent pl-[10px] text-[#94A3B8] hover:bg-[rgba(255,255,255,0.04)] hover:text-white',
                )}
              >
                <Icon className={cn(
                  'h-4 w-4 flex-shrink-0 transition-colors',
                  active ? 'text-primary' : 'text-[#64748B] group-hover:text-[#94A3B8]',
                )} />
                <span className="flex-1">{item.label}</span>
                {active && <ChevronRight className="h-3 w-3 text-primary opacity-60" />}
              </Link>
            );
          })}

          {/* Contextual Trust Graph link when viewing a specific agent */}
          {currentAgentAddress && (
            <Link
              href={`/agents/${currentAgentAddress}/trust-graph` as '/'}
              onClick={onClose}
              className={cn(
                'group ml-3 flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-all duration-150',
                pathname.includes('/trust-graph')
                  ? 'border-l-2 border-primary bg-[rgba(74,222,128,0.06)] pl-[10px] text-white'
                  : 'border-l-2 border-transparent pl-[10px] text-[#94A3B8] hover:bg-[rgba(255,255,255,0.04)] hover:text-white',
              )}
            >
              <GitBranch className={cn(
                'h-4 w-4 flex-shrink-0 transition-colors',
                pathname.includes('/trust-graph') ? 'text-primary' : 'text-[#64748B] group-hover:text-[#94A3B8]',
              )} />
              <span className="flex-1">Trust Graph</span>
              {pathname.includes('/trust-graph') && <ChevronRight className="h-3 w-3 text-primary opacity-60" />}
            </Link>
          )}

          <div className="my-3 border-t border-[rgba(255,255,255,0.05)]" />
          <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-widest text-[#475569]">
            More
          </p>

          {disabledItems.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className={cn(
                  'flex cursor-not-allowed items-center gap-3 rounded-md px-3 py-2 text-sm',
                  'border-l-2 border-transparent pl-[10px] text-[#475569]',
                )}
              >
                <Icon className="h-4 w-4 flex-shrink-0 text-[#334155]" />
                <span className="flex-1">{item.label}</span>
                <span className={cn(
                  'rounded-sm px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide',
                  'bg-[rgba(255,255,255,0.04)] text-[#475569]',
                )}>
                  Soon
                </span>
              </div>
            );
          })}
        </nav>

        {/* Quick Stats */}
        <div className="border-t border-[rgba(255,255,255,0.06)] p-4">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-[#475569]">
            Quick Stats
          </p>
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-[#64748B]">
                <Bot className="h-3.5 w-3.5" />
                Total Agents
              </div>
              <span className="font-data text-sm font-semibold text-white">
                {stats?.total ?? '—'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-[#64748B]">
                <Shield className="h-3.5 w-3.5" />
                Verified
              </div>
              <span className="font-data text-sm font-semibold text-primary">
                {verifiedPct}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-[#64748B]">
                <Activity className="h-3.5 w-3.5" />
                Active 24h
              </div>
              <span className="font-data text-sm font-semibold text-white">
                {stats?.active24h ?? '—'}
              </span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
