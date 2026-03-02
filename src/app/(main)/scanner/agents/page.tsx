'use client';

import { useState } from 'react';
import { Bot, SlidersHorizontal, X, LayoutList, LayoutGrid } from 'lucide-react';
import { useAgents } from '@/hooks/use-agents';
import { useAgentSparklines } from '@/hooks/use-agent-sparklines';
import { useSignals } from '@/hooks/use-signals';
import { AgentTable } from '@/components/scanner/agent-table';
import { AgentCard } from '@/components/scanner/agent-card';
import { Filters, type FilterValues } from '@/components/scanner/filters';
import { SearchBar } from '@/components/scanner/search-bar';
import { EmptyState } from '@/components/scanner/empty-state';
import { ErrorState } from '@/components/scanner/error-state';
import { AgentTableSkeleton } from '@/components/scanner/agent-table-skeleton';
import { Spinner } from '@/components/shared/spinner';
import { cn } from '@/lib/utils';
import { type AgentStatus } from '@prisma/client';

const DEFAULT_FILTERS: FilterValues = { service: undefined, status: undefined, trustScoreRange: [0, 100] };

type ViewMode = 'list' | 'grid';

function Pagination({ page, meta, onPage }: {
  page: number;
  meta?: { page: number; totalPages: number; total: number };
  onPage: (p: number) => void;
}) {
  if (!meta || meta.totalPages <= 1) return null;

  // Generate visible page numbers (window of 5)
  const start = Math.max(1, Math.min(page - 2, meta.totalPages - 4));
  const end = Math.min(meta.totalPages, start + 4);
  const pageNumbers = Array.from({ length: end - start + 1 }, (_, i) => start + i);

  const btnCls = cn(
    'flex h-7 min-w-7 items-center justify-center rounded-lg px-2 text-xs transition-all',
    'border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)]',
    'text-[#94A3B8] hover:bg-[rgba(255,255,255,0.06)] hover:text-white',
    'disabled:cursor-not-allowed disabled:opacity-30',
  );

  return (
    <div className="flex items-center justify-between border-t border-[rgba(255,255,255,0.06)] px-5 py-3">
      <span className="font-data text-xs text-[#64748B]">{meta.total} agents</span>
      <div className="flex items-center gap-1">
        {/* First */}
        <button disabled={page <= 1} onClick={() => onPage(1)} className={btnCls}>«</button>
        {/* Prev */}
        <button disabled={page <= 1} onClick={() => onPage(page - 1)} className={btnCls}>‹</button>

        {/* Page numbers */}
        {pageNumbers.map((p) => (
          <button
            key={p}
            onClick={() => onPage(p)}
            className={cn(
              btnCls,
              p === page && 'border-[rgba(74,222,128,0.3)] bg-[rgba(74,222,128,0.08)] text-[#4ADE80]',
            )}
          >
            {p}
          </button>
        ))}

        {/* Next */}
        <button disabled={page >= meta.totalPages} onClick={() => onPage(page + 1)} className={btnCls}>›</button>
        {/* Last */}
        <button disabled={page >= meta.totalPages} onClick={() => onPage(meta.totalPages)} className={btnCls}>»</button>
      </div>
    </div>
  );
}

export default function AgentsPage() {
  const [filters, setFilters] = useState<FilterValues>(DEFAULT_FILTERS);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  const isFiltered = !!filters.service || !!filters.status || filters.trustScoreRange[0] > 0 || filters.trustScoreRange[1] < 100;

  const { data, isLoading, isError, refetch } = useAgents({
    ...(filters.service       && { service: filters.service }),
    ...(filters.status        && { status: filters.status as AgentStatus }),
    ...(filters.trustScoreRange[0] > 0  && { minTrustScore: filters.trustScoreRange[0] }),
    ...(filters.trustScoreRange[1] < 100 && { maxTrustScore: filters.trustScoreRange[1] }),
    ...(search                && { search }),
    ...(filters.sortBy        && { sortBy: filters.sortBy }),
    ...(filters.sortOrder     && { sortOrder: filters.sortOrder }),
    page,
    limit: viewMode === 'grid' ? 24 : 25,
  });

  const agents = data?.agents ?? [];
  const meta   = data?.pagination;

  // Fetch real sparkline data and signals for the currently visible agents
  const agentAddresses = agents.map((a) => a.address);
  const { data: sparklinesData } = useAgentSparklines(agentAddresses);
  const sparklines = sparklinesData ?? {};
  const { data: signalsData } = useSignals(agentAddresses);
  const signals = signalsData ?? {};

  const handleReset = () => {
    setFilters(DEFAULT_FILTERS);
    setSearch('');
    setPage(1);
  };

  return (
    <div className="flex flex-col gap-4 p-4 sm:gap-6 sm:p-6">

      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[rgba(74,222,128,0.1)] border border-[rgba(74,222,128,0.2)]">
          <Bot className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h1 className="text-base font-semibold text-white">Agent Registry</h1>
          <p className="text-xs text-[#64748B]">
            {meta?.total ?? agents.length} agents indexed on Avalanche
          </p>
        </div>
      </div>

      {/* Table + Filters */}
      <div className="flex gap-4">

        {/* Main panel */}
        <div className="glass flex min-w-0 flex-1 flex-col overflow-hidden">

          {/* Toolbar */}
          <div className="flex items-center gap-2 border-b border-[rgba(255,255,255,0.06)] px-5 py-3">
            <div className="flex-1">
              <SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1); }} />
            </div>

            {/* View toggle */}
            <div className="flex rounded-lg border border-[rgba(255,255,255,0.08)] overflow-hidden">
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  'flex h-8 w-8 items-center justify-center transition-colors',
                  viewMode === 'list'
                    ? 'bg-[rgba(74,222,128,0.1)] text-[#4ADE80]'
                    : 'text-[#64748B] hover:text-white hover:bg-[rgba(255,255,255,0.04)]',
                )}
                title="List view"
              >
                <LayoutList className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  'flex h-8 w-8 items-center justify-center transition-colors',
                  viewMode === 'grid'
                    ? 'bg-[rgba(74,222,128,0.1)] text-[#4ADE80]'
                    : 'text-[#64748B] hover:text-white hover:bg-[rgba(255,255,255,0.04)]',
                )}
                title="Grid view"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Filter toggle (mobile/medium) */}
            <button
              onClick={() => setShowFilters(f => !f)}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all xl:hidden',
                'border',
                showFilters || isFiltered
                  ? 'border-[rgba(74,222,128,0.3)] bg-[rgba(74,222,128,0.06)] text-primary'
                  : 'border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] text-[#94A3B8] hover:text-white',
              )}
            >
              {showFilters ? <X className="h-3.5 w-3.5" /> : <SlidersHorizontal className="h-3.5 w-3.5" />}
              Filters
              {isFiltered && (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-[#0B0F14]">!</span>
              )}
            </button>
          </div>

          {/* Inline filter panel (mobile) */}
          {showFilters && (
            <div className="border-b border-[rgba(255,255,255,0.06)] px-5 py-4 xl:hidden">
              <Filters values={filters} onChange={(f) => { setFilters(f); setPage(1); }} />
            </div>
          )}

          {/* Content */}
          <div className="min-w-0">
            {isLoading ? (
              viewMode === 'grid' ? (
                <div className="flex justify-center py-16">
                  <Spinner size="md" />
                </div>
              ) : (
                <AgentTableSkeleton rows={10} />
              )
            ) : isError ? (
              <ErrorState onRetry={() => refetch()} />
            ) : agents.length === 0 ? (
              <EmptyState
                variant={search || isFiltered ? 'no-results' : 'no-agents'}
                onResetFilters={handleReset}
              />
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 lg:grid-cols-4">
                {agents.map((agent) => (
                  <AgentCard key={agent.address} agent={agent} sparklines={sparklines} signals={signals} />
                ))}
              </div>
            ) : (
              <AgentTable agents={agents} sparklines={sparklines} signals={signals} />
            )}
          </div>

          <Pagination page={page} meta={meta} onPage={setPage} />
        </div>

        {/* Right panel: persistent Filters on xl */}
        <div className="hidden w-64 flex-shrink-0 xl:block">
          <div className="glass p-4">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-[#475569]">
              Filters
            </p>
            <Filters values={filters} onChange={(f) => { setFilters(f); setPage(1); }} />
          </div>
        </div>
      </div>
    </div>
  );
}
