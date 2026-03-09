'use client'

import { Pool } from '@/types/pool'
import { PoolCard } from './PoolCard'

interface PoolFeedProps {
  pools: Pool[]
  isLoading: boolean
}

export function PoolFeed({ pools, isLoading }: PoolFeedProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    )
  }

  if (pools.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="text-4xl mb-4 opacity-30">◉</div>
        <p className="text-[#64748b] text-sm">No pools match your filters</p>
        <p className="text-[#64748b] text-xs mt-1 opacity-60">
          Try adjusting the filters or wait for new pools
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {pools.map(pool => (
        <PoolCard key={pool.address} pool={pool} />
      ))}
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="bg-[#111318] border border-[#1e2028] rounded-lg p-4 animate-pulse">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-14 h-5 rounded bg-[#1e2028]" />
        <div className="flex-1 h-5 rounded bg-[#1e2028]" />
      </div>
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="h-4 rounded bg-[#1e2028]" />
        <div className="h-4 rounded bg-[#1e2028]" />
      </div>
      <div className="flex gap-4 mb-2">
        <div className="w-16 h-3 rounded bg-[#1e2028]" />
        <div className="w-16 h-3 rounded bg-[#1e2028]" />
        <div className="w-16 h-3 rounded bg-[#1e2028]" />
      </div>
      <div className="flex gap-2 mt-3">
        <div className="w-24 h-3 rounded bg-[#1e2028]" />
      </div>
    </div>
  )
}
