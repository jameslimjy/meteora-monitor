'use client'

import { Filters } from '@/types/pool'

interface FilterBarProps {
  filters: Filters
  onFiltersChange: (filters: Filters) => void
}

const POOL_TYPE_OPTIONS: { label: string; value: Filters['poolType'] }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'DLMM', value: 'DLMM' },
  { label: 'DAMM v2', value: 'DAMM_V2' },
]

const BIN_STEP_OPTIONS = [
  { label: 'Any', value: 'any' },
  { label: '1 bps', value: '1' },
  { label: '2 bps', value: '2' },
  { label: '5 bps', value: '5' },
  { label: '10 bps', value: '10' },
  { label: '20 bps', value: '20' },
  { label: '50 bps', value: '50' },
  { label: '100 bps', value: '100' },
]

const defaultFilters: Filters = {
  poolType: 'ALL',
  search: '',
  minTvl: '',
  binStep: 'any',
}

export function FilterBar({ filters, onFiltersChange }: FilterBarProps) {
  const update = (partial: Partial<Filters>) => {
    onFiltersChange({ ...filters, ...partial })
  }

  const isDefault =
    filters.poolType === defaultFilters.poolType &&
    filters.search === defaultFilters.search &&
    filters.minTvl === defaultFilters.minTvl &&
    filters.binStep === defaultFilters.binStep

  return (
    <div className="flex flex-wrap items-center gap-3 px-4 py-3 bg-[#111318] border border-[#1e2028] rounded-lg">
      {/* Pool type pills */}
      <div className="flex items-center gap-1">
        {POOL_TYPE_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => update({ poolType: opt.value })}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              filters.poolType === opt.value
                ? opt.value === 'DLMM'
                  ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
                  : opt.value === 'DAMM_V2'
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                  : 'bg-[#1e2028] text-[#f1f5f9] border border-[#2e3038]'
                : 'bg-transparent text-[#64748b] border border-[#1e2028] hover:border-[#2e3038] hover:text-[#f1f5f9]'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="w-px h-4 bg-[#1e2028]" />

      {/* Search */}
      <input
        type="text"
        placeholder="Search token, address..."
        value={filters.search}
        onChange={e => update({ search: e.target.value })}
        className="bg-[#0a0b0e] border border-[#1e2028] rounded px-3 py-1.5 text-xs text-[#f1f5f9] placeholder-[#64748b] focus:outline-none focus:border-[#3b82f6] w-48"
      />

      {/* Min TVL */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-[#64748b]">Min TVL $</span>
        <input
          type="number"
          placeholder="0"
          value={filters.minTvl}
          onChange={e => update({ minTvl: e.target.value })}
          className="bg-[#0a0b0e] border border-[#1e2028] rounded px-2 py-1.5 text-xs text-[#f1f5f9] placeholder-[#64748b] focus:outline-none focus:border-[#3b82f6] w-24"
        />
      </div>

      {/* Bin Step (DLMM only) */}
      {(filters.poolType === 'ALL' || filters.poolType === 'DLMM') && (
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-[#64748b]">Bin Step</span>
          <select
            value={filters.binStep}
            onChange={e => update({ binStep: e.target.value })}
            className="bg-[#0a0b0e] border border-[#1e2028] rounded px-2 py-1.5 text-xs text-[#f1f5f9] focus:outline-none focus:border-[#3b82f6]"
          >
            {BIN_STEP_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Reset */}
      {!isDefault && (
        <button
          onClick={() => onFiltersChange(defaultFilters)}
          className="ml-auto px-3 py-1 rounded text-xs text-[#64748b] border border-[#1e2028] hover:text-[#f1f5f9] hover:border-[#2e3038] transition-colors"
        >
          Reset
        </button>
      )}
    </div>
  )
}
