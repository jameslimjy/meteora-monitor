'use client'

import { usePoolFeed } from '@/hooks/usePoolFeed'
import { usePumpSwapFeed } from '@/hooks/usePumpSwapFeed'
import { DualFeed } from '@/components/DualFeed'
import { FilterBar } from '@/components/FilterBar'
import { ConnectionStatus } from '@/components/ConnectionStatus'

export default function Home() {
  const {
    pools: meteoraPools,
    wsStatus,
    totalCount,
    dlmmCount,
    dammCount,
    recentCount,
    lastUpdated: meteoraUpdated,
    isLoading: meteoraLoading,
    filters,
    setFilters,
  } = usePoolFeed()

  const {
    pools: pumpSwapPools,
    isLoading: pumpSwapLoading,
    lastUpdated: pumpSwapUpdated,
    totalCount: pumpSwapCount,
  } = usePumpSwapFeed()

  const formatTime = (d: Date | null) =>
    d ? d.toLocaleTimeString('en-US', { hour12: false }) : '—'

  // Count matched tokens between PumpSwap and Meteora (excluding SOL/stables)
  const EXCLUDED = new Set([
    'So11111111111111111111111111111111111111112',
    'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
  ])
  const pumpTokens = new Set(
    pumpSwapPools.map(p => p.base_token.address).filter(a => !EXCLUDED.has(a))
  )
  const meteoraTokens = new Set(
    meteoraPools
      .map(p =>
        EXCLUDED.has(p.token_x.address) ? p.token_y.address : p.token_x.address
      )
      .filter(a => !EXCLUDED.has(a))
  )
  const matchCount = [...pumpTokens].filter(t => meteoraTokens.has(t)).length

  return (
    <div className="min-h-screen bg-[#0a0b0e]">
      {/* ═══ Header ═══ */}
      <header className="sticky top-0 z-20 border-b border-[#1e2028] bg-[#0a0b0e]/95 backdrop-blur-sm">
        <div className="max-w-[1600px] mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-bold text-[#f1f5f9] tracking-tight">
                <span className="text-orange-400">◈</span> Pool Monitor
              </h1>
              <span className="text-xs text-[#64748b] hidden sm:block">
                PumpSwap + Meteora — Real-time pool creation feed
              </span>
            </div>
            <ConnectionStatus status={wsStatus} />
          </div>

          {/* Global stats row */}
          <div className="flex flex-wrap items-center gap-4 px-4 py-2 bg-[#111318] border border-[#1e2028] rounded-lg text-xs">
            <Stat label="PumpSwap" value={pumpSwapCount.toString()} accent="pink" />
            <Sep />
            <Stat label="Meteora" value={totalCount.toString()} accent="orange" />
            <Sep />
            <Stat label="DLMM" value={dlmmCount.toString()} />
            <Sep />
            <Stat label="DAMM v2" value={dammCount.toString()} />
            <Sep />
            <Stat label="New (1h)" value={recentCount.toString()} accent="green" />
            <Sep />
            <Stat
              label="Matches"
              value={matchCount.toString()}
              accent="emerald"
            />
            <Sep />
            <Stat label="Updated" value={formatTime(meteoraUpdated)} />
          </div>
        </div>
      </header>

      {/* ═══ Column Headers ═══ */}
      <div className="max-w-[1600px] mx-auto px-4 pt-4">
        <div className="flex gap-4 mb-3">
          {/* PumpSwap column header */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-pink-400 text-sm font-bold">🐸</span>
                <h2 className="text-sm font-bold text-[#f1f5f9]">PumpSwap</h2>
                <span className="text-[10px] text-[#64748b]">
                  {pumpSwapCount} pools • updated {formatTime(pumpSwapUpdated)}
                </span>
              </div>
            </div>
          </div>

          {/* Meteora column header */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-orange-400 text-sm font-bold">◈</span>
                <h2 className="text-sm font-bold text-[#f1f5f9]">Meteora</h2>
                <span className="text-[10px] text-[#64748b]">
                  {totalCount} pools
                </span>
              </div>
            </div>
            <FilterBar filters={filters} onFiltersChange={setFilters} />
          </div>
        </div>
      </div>

      {/* ═══ Dual Feed ═══ */}
      <main className="max-w-[1600px] mx-auto px-4 pb-8 pt-2">
        <DualFeed
          pumpSwapPools={pumpSwapPools}
          meteoraPools={meteoraPools}
          pumpSwapLoading={pumpSwapLoading}
          meteoraLoading={meteoraLoading}
        />
      </main>
    </div>
  )
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string
  value: string
  accent?: 'orange' | 'blue' | 'green' | 'pink' | 'emerald'
}) {
  const colors: Record<string, string> = {
    orange: 'text-orange-400',
    blue: 'text-blue-400',
    green: 'text-green-400',
    pink: 'text-pink-400',
    emerald: 'text-emerald-400',
  }
  return (
    <div className="flex flex-col">
      <span className="text-[10px] text-[#64748b] uppercase tracking-wider leading-none mb-0.5">
        {label}
      </span>
      <span
        className={`text-sm font-semibold tabular-nums ${
          accent ? colors[accent] : 'text-[#f1f5f9]'
        }`}
      >
        {value}
      </span>
    </div>
  )
}

function Sep() {
  return <div className="w-px h-4 bg-[#1e2028]" />
}
