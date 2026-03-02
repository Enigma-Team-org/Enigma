'use client';

import { useRouter } from 'next/navigation';
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { ArrowUpDown, Database, Shield, ShieldAlert, ShieldCheck, ShieldX, Clock, Star, Award } from 'lucide-react';
import { useState } from 'react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { type Agent } from '@/hooks/use-agents';
import { type SparklineMap } from '@/hooks/use-agent-sparklines';
import { type SignalMap } from '@/hooks/use-signals';
import { cn } from '@/lib/utils/index';

interface AgentTableProps {
  agents: Agent[];
  sparklines?: SparklineMap;
  signals?: SignalMap;
  onSortChange?: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
}

function getTrustScoreColor(score: number): string {
  if (score >= 80) return 'text-[#4ADE80] bg-[rgba(74,222,128,0.1)]';
  if (score >= 60) return 'text-[#22D3EE] bg-[rgba(34,211,238,0.1)]';
  if (score >= 40) return 'text-[#FCD34D] bg-[rgba(252,211,77,0.1)]';
  return 'text-[#FB7185] bg-[rgba(251,113,133,0.1)]';
}

function getTrustScoreLineColor(score: number): string {
  if (score >= 80) return '#4ADE80';
  if (score >= 60) return '#22D3EE';
  if (score >= 40) return '#FCD34D';
  return '#FB7185';
}

function getStatusConfig(status: string, verifiedTier?: string | null) {
  if (verifiedTier === 'PREMIUM') {
    return { icon: Award, className: 'bg-[rgba(245,158,11,0.1)] text-[#F59E0B] border-[rgba(245,158,11,0.2)]', label: 'PREMIUM' };
  }
  const configs: Record<string, { icon: typeof ShieldCheck; className: string; label: string }> = {
    VERIFIED:  { icon: ShieldCheck, className: 'bg-[rgba(74,222,128,0.1)] text-[#4ADE80] border-[rgba(74,222,128,0.2)]', label: 'VERIFIED' },
    PENDING:   { icon: Clock,       className: 'bg-[rgba(252,211,77,0.1)] text-[#FCD34D] border-[rgba(252,211,77,0.2)]', label: 'PENDING' },
    FLAGGED:   { icon: ShieldAlert, className: 'bg-[rgba(251,113,133,0.1)] text-[#FB7185] border-[rgba(251,113,133,0.2)]', label: 'FLAGGED' },
    SUSPENDED: { icon: ShieldX,     className: 'bg-[rgba(251,113,133,0.08)] text-[#FB7185] border-[rgba(251,113,133,0.15)]', label: 'SUSPENDED' },
  };
  return configs[status] || {
    icon: Shield,
    className: 'bg-[rgba(255,255,255,0.05)] text-[#64748B] border-[rgba(255,255,255,0.1)]',
    label: status,
  };
}

function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function mockSparkData(address: string, score: number) {
  const seed = address.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return Array.from({ length: 10 }, (_, i) => {
    const v = ((seed * (i + 1) * 7919) % 21) - 10;
    return { v: Math.max(0, Math.min(100, score + v)) };
  });
}

function MiniSparkline({ address, score, realData }: {
  address: string;
  score: number;
  realData?: { v: number }[];
}) {
  const data = (realData && realData.length >= 2) ? realData : mockSparkData(address, score);
  const color = getTrustScoreLineColor(score);
  return (
    <div className="h-7 w-20">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
          <Line type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Service protocol dots — compact inline indicators */
const KNOWN_PROTOCOLS = ['web', 'A2A', 'MCP', 'OASF'] as const;
const protocolColors: Record<string, string> = {
  web:  '#22D3EE',
  a2a:  '#FCD34D',
  mcp:  '#4ADE80',
  oasf: '#A78BFA',
};

function ProtocolDots({ services }: { services: string[] }) {
  const matched = KNOWN_PROTOCOLS.filter((p) =>
    services.some((s) => s.toLowerCase() === p.toLowerCase())
  );
  const extra = services.length - matched.length;

  return (
    <div className="flex items-center gap-1">
      {matched.map((p) => (
        <span
          key={p}
          title={p}
          className="inline-flex h-[18px] items-center rounded px-1 text-[9px] font-bold"
          style={{
            background: `${protocolColors[p.toLowerCase()]}18`,
            color: protocolColors[p.toLowerCase()],
          }}
        >
          {p}
        </span>
      ))}
      {extra > 0 && (
        <span className="text-[9px] text-[#475569]">+{extra}</span>
      )}
    </div>
  );
}

// X (Twitter) share icon SVG
const XIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.736l7.737-8.843L1.254 2.25H8.08l4.259 5.632zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

// ── Static column definitions ─────────────────────────────────────────────────

const columns: ColumnDef<Agent>[] = [
  {
    id: 'rank',
    header: '#',
    cell: ({ row }) => (
      <span className="font-data text-[11px] font-bold text-[#475569]">
        {row.original.rank ? `#${row.original.rank}` : ''}
      </span>
    ),
    size: 36,
  },
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="h-auto p-0 text-[10px] font-semibold uppercase tracking-widest text-[#475569] hover:bg-transparent hover:text-white"
      >
        Agent
        <ArrowUpDown className="ml-1 h-2.5 w-2.5" />
      </Button>
    ),
    cell: ({ row }) => {
      const image = row.original.metadata?.image;
      const services = row.original.services ?? [];
      return (
        <div className="flex items-center gap-2.5">
          {/* Avatar */}
          <div className="relative h-7 w-7 shrink-0">
            {image ? (
              <img
                src={image}
                alt={row.original.name}
                className="h-7 w-7 rounded-lg object-cover ring-1 ring-[rgba(255,255,255,0.08)]"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const fallback = e.currentTarget.nextElementSibling as HTMLElement | null;
                  if (fallback) { fallback.classList.remove('hidden'); fallback.classList.add('flex'); }
                }}
              />
            ) : null}
            <div
              className={cn(
                'h-7 w-7 items-center justify-center rounded-lg bg-[rgba(255,255,255,0.04)] text-[9px] font-bold text-[#475569] ring-1 ring-[rgba(255,255,255,0.08)]',
                image ? 'hidden' : 'flex',
              )}
            >
              {row.original.name.slice(0, 2).toUpperCase()}
            </div>
          </div>
          {/* Name + address + protocols */}
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1">
              <span className="text-[13px] font-medium text-white leading-tight">{row.original.name}</span>
              {row.original.metadata && (
                <Database className="h-2.5 w-2.5 shrink-0 text-[#334155]" />
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="font-data text-[10px] text-[#475569]">
                {truncateAddress(row.original.address)}
              </span>
              {services.length > 0 && <ProtocolDots services={services} />}
            </div>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: 'trust_score',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="h-auto p-0 text-[10px] font-semibold uppercase tracking-widest text-[#475569] hover:bg-transparent hover:text-white"
      >
        Score
        <ArrowUpDown className="ml-1 h-2.5 w-2.5" />
      </Button>
    ),
    cell: ({ row }) => {
      const score = row.original.trust_score;
      return (
        <span className={cn('font-data inline-flex items-center justify-center rounded-md px-2 py-0.5 text-xs font-bold', getTrustScoreColor(score))}>
          {score}
        </span>
      );
    },
    size: 64,
  },
  {
    accessorKey: 'status',
    header: () => (
      <span className="text-[10px] font-semibold uppercase tracking-widest text-[#475569]">Status</span>
    ),
    cell: ({ row }) => {
      const config = getStatusConfig(row.original.status, row.original.verified_tier);
      const Icon = config.icon;
      return (
        <Badge variant="outline" className={cn('gap-1 text-[9px] px-1.5 py-0', config.className)}>
          <Icon className="h-2.5 w-2.5" />
          {config.label}
        </Badge>
      );
    },
    size: 90,
  },
];

// ── AgentTable ────────────────────────────────────────────────────────────────

export function AgentTable({ agents, sparklines = {}, signals = {}, onSortChange }: AgentTableProps) {
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([]);

  // Signals column — compact inline
  const signalsColumn: ColumnDef<Agent> = {
    id: 'signals',
    header: () => (
      <span className="text-[10px] font-semibold uppercase tracking-widest text-[#475569]">Signals</span>
    ),
    cell: ({ row }) => {
      const agentSignals = signals[row.original.address] ?? [];
      if (agentSignals.length === 0) return null;
      return (
        <div className="flex items-center gap-1">
          {agentSignals.slice(0, 2).map((sig) => (
            <span
              key={sig.type}
              className={cn('rounded px-1 py-0 text-[8px] font-bold leading-[16px]', sig.bgColor, sig.color)}
            >
              {sig.label}
            </span>
          ))}
          {agentSignals.length > 2 && (
            <span className="text-[9px] text-[#475569]">+{agentSignals.length - 2}</span>
          )}
        </div>
      );
    },
    size: 100,
  };

  // Trend column — sparkline
  const trendColumn: ColumnDef<Agent> = {
    id: 'trend',
    header: () => (
      <span className="text-[10px] font-semibold uppercase tracking-widest text-[#475569]">Trend</span>
    ),
    cell: ({ row }) => (
      <MiniSparkline
        address={row.original.address}
        score={row.original.trust_score}
        realData={sparklines[row.original.address]}
      />
    ),
    size: 88,
  };

  // Stars + Share combined column
  const actionsColumn: ColumnDef<Agent> = {
    id: 'actions',
    header: () => null,
    cell: ({ row }) => {
      const agent = row.original;
      const count = agent.star_count ?? 0;
      const handleShare = (e: React.MouseEvent) => {
        e.stopPropagation();
        const url  = `${window.location.origin}/agents/${agent.address}`;
        const text = `\uD83D\uDD0D ${agent.name} — Trust Score: ${agent.trust_score}/100\n\u2705 ${agent.status}\n\nVerified on Enigma \u00B7 Avalanche`;
        window.open(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
          '_blank',
          'noopener,noreferrer,width=600,height=500',
        );
      };
      return (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5 text-[#475569]" title={`${count} stars`}>
            <Star className={cn('h-3 w-3', count > 0 && 'fill-[#FCD34D] text-[#FCD34D]')} />
            {count > 0 && <span className="font-data text-[10px]">{count}</span>}
          </div>
          <button
            onClick={handleShare}
            title="Share on X"
            className="flex items-center justify-center rounded p-1 text-[#334155] transition-colors hover:bg-[rgba(29,161,242,0.08)] hover:text-[#1D9BF0]"
          >
            <XIcon />
          </button>
        </div>
      );
    },
    size: 64,
  };

  const table = useReactTable({
    data: agents,
    columns: [...columns, signalsColumn, trendColumn, actionsColumn],
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: (updater) => {
      const newSorting = typeof updater === 'function' ? updater(sorting) : updater;
      setSorting(newSorting);
      if (onSortChange && newSorting.length > 0) {
        const { id, desc } = newSorting[0];
        onSortChange(id, desc ? 'desc' : 'asc');
      }
    },
    state: { sorting },
  });

  return (
    <div className="overflow-x-auto rounded-md border border-[rgba(255,255,255,0.06)]">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow
              key={headerGroup.id}
              className="border-b border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] hover:bg-transparent"
            >
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id} style={{ width: header.getSize() }} className="py-2 text-[rgba(255,255,255,0.5)]">
                  {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow
              key={row.id}
              data-href={`/agents/${row.original.address}`}
              onClick={() => router.push(`/agents/${row.original.address}`)}
              className="cursor-pointer border-b border-[rgba(255,255,255,0.04)] transition-colors duration-150 hover:bg-[rgba(74,222,128,0.03)]"
            >
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id} className="py-2">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
