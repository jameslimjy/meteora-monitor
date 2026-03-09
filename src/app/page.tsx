'use client'

import { usePoolFeed } from '@/hooks/usePoolFeed'
import { PoolFeed } from '@/components/PoolFeed'
import { FilterBar } from '@/components/FilterBar'
import { StatsBar } from '@/components/StatsBar'
import { ConnectionStatus } from '@/components/ConnectionStatus'

export default function Home() {
  const {
    pools,
    wsStatus,
    totalCount,
    dlmmCount,
    dammCount,
    recentCount,
    lastUpdated,
    isLoading,
    filters,
    setFilters,
  } = usePoolFeed()

  return (
    <div className="min-h-screen bg-[#0a0b0e]">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-[#1e2028] bg-[#0a0b0e]/95 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-bold text-[#f1f5f9] tracking-tight">
                <span className="text-orange-400">◈</span> Meteora Monitor
              </h1>
              <span className="text-xs text-[#64748b] hidden sm:block">
                Real-time pool creation feed
              </span>
            </div>
            <ConnectionStatus status={wsStatus} />
          </div>

          <StatsBar
            totalCount={totalCount}
            dlmmCount={dlmmCount}
            dammCount={dammCount}
            recentCount={recentCount}
            lastUpdated={lastUpdated}
          />
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-5xl mx-auto px-4 py-4">
        {/* Filter bar */}
        <div className="mb-4">
          <FilterBar filters={filters} onFiltersChange={setFilters} />
        </div>

        {/* Pool feed */}
        <PoolFeed pools={pools} isLoading={isLoading} />
      </main>
    </div>
  )
}
