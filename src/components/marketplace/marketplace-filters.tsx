'use client';

import { Search, SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils/index';

const CATEGORIES = [
  { value: 'ALL', label: 'All Categories' },
  { value: 'DEFI', label: 'DeFi' },
  { value: 'TRADING', label: 'Trading' },
  { value: 'ANALYTICS', label: 'Analytics' },
  { value: 'SECURITY', label: 'Security' },
  { value: 'ORACLE', label: 'Oracle' },
  { value: 'GOVERNANCE', label: 'Governance' },
  { value: 'INFRASTRUCTURE', label: 'Infrastructure' },
  { value: 'OTHER', label: 'Other' },
] as const;

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
] as const;

type SortOption = 'newest' | 'price_asc' | 'price_desc';

interface MarketplaceFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  category: string;
  onCategoryChange: (value: string) => void;
  sort: SortOption;
  onSortChange: (value: SortOption) => void;
}

const selectStyles = cn(
  'h-10 rounded-lg px-3 text-sm text-white',
  'bg-[rgba(255,255,255,0.04)] backdrop-blur-xl',
  'border border-[rgba(255,255,255,0.06)]',
  'focus:outline-none focus:border-[rgba(74,222,128,0.4)]',
  'transition-colors appearance-none cursor-pointer',
  '[&>option]:bg-[#0f1117] [&>option]:text-white'
);

export function MarketplaceFilters({
  search,
  onSearchChange,
  category,
  onCategoryChange,
  sort,
  onSortChange,
}: MarketplaceFiltersProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-xl p-4 sm:flex-row sm:items-center',
        'bg-[rgba(255,255,255,0.04)] backdrop-blur-xl',
        'border border-[rgba(255,255,255,0.06)]'
      )}
    >
      {/* Search */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[rgba(255,255,255,0.3)]" />
        <input
          type="text"
          placeholder="Search services, agents..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className={cn(
            'w-full h-10 rounded-lg pl-10 pr-4 text-sm text-white placeholder:text-[rgba(255,255,255,0.3)]',
            'bg-[rgba(255,255,255,0.04)]',
            'border border-[rgba(255,255,255,0.06)]',
            'focus:outline-none focus:border-[rgba(74,222,128,0.4)]',
            'transition-colors'
          )}
        />
      </div>

      {/* Category */}
      <div className="flex items-center gap-2">
        <SlidersHorizontal className="hidden h-4 w-4 text-[rgba(255,255,255,0.3)] sm:block" />
        <select
          value={category}
          onChange={(e) => onCategoryChange(e.target.value)}
          className={selectStyles}
        >
          {CATEGORIES.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>
      </div>

      {/* Sort */}
      <select
        value={sort}
        onChange={(e) => onSortChange(e.target.value as SortOption)}
        className={selectStyles}
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
