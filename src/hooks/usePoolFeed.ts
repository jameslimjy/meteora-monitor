'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Pool, Filters, DLMMPool, DAMMPool } from '@/types/pool'
import { useHeliusWebSocket } from './useHeliusWebSocket'

const POLL_INTERVAL = 10000 // 10 seconds
const NEW_FLAG_DURATION = 30000 // 30 seconds

const defaultFilters: Filters = {
  poolType: 'ALL',
  search: '',
  minTvl: '',
  binStep: 'any',
}

function applyFilters(pools: Pool[], filters: Filters): Pool[] {
  return pools.filter(pool => {
    // Pool type filter
    if (filters.poolType !== 'ALL' && pool.poolType !== filters.poolType) {
      return false
    }

    // Bin step filter (DLMM only)
    if (filters.binStep !== 'any' && pool.poolType === 'DLMM') {
      const step = parseInt(filters.binStep, 10)
      if (!isNaN(step) && pool.pool_config.bin_step !== step) {
        return false
      }
    }

    // Min TVL filter
    if (filters.minTvl !== '') {
      const min = parseFloat(filters.minTvl)
      if (!isNaN(min) && pool.tvl < min) {
        return false
      }
    }

    // Search filter
    if (filters.search.trim() !== '') {
      const q = filters.search.trim().toLowerCase()
      const match =
        pool.name.toLowerCase().includes(q) ||
        pool.address.toLowerCase().includes(q) ||
        pool.token_x.symbol.toLowerCase().includes(q) ||
        pool.token_y.symbol.toLowerCase().includes(q) ||
        pool.token_x.address.toLowerCase().includes(q) ||
        pool.token_y.address.toLowerCase().includes(q)
      if (!match) return false
    }

    return true
  })
}

export function usePoolFeed() {
  const [allPools, setAllPools] = useState<Pool[]>([])
  const [filters, setFilters] = useState<Filters>(defaultFilters)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const seenAddressesRef = useRef<Set<string>>(new Set())
  const newFlagTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  const clearNewFlag = useCallback((address: string) => {
    setAllPools(prev =>
      prev.map(p => p.address === address ? { ...p, isNew: false } : p)
    )
  }, [])

  const fetchLatestPools = useCallback(async () => {
    try {
      const [dlmmRes, dammRes] = await Promise.all([
        fetch('/api/pools/dlmm'),
        fetch('/api/pools/damm'),
      ])

      const dlmmData = dlmmRes.ok ? await dlmmRes.json() : null
      const dammData = dammRes.ok ? await dammRes.json() : null

      const dlmmPools: Pool[] = (Array.isArray(dlmmData) ? dlmmData : dlmmData?.data ?? [])
        .map((p: DLMMPool) => ({ ...p, poolType: 'DLMM' as const }))

      const dammPools: Pool[] = (Array.isArray(dammData) ? dammData : dammData?.data ?? [])
        .map((p: DAMMPool) => ({ ...p, poolType: 'DAMM_V2' as const }))

      const incoming = [...dlmmPools, ...dammPools]

      setAllPools(prev => {
        const existingMap = new Map<string, Pool>(prev.map(p => [p.address, p]))
        const newPools: Pool[] = []

        for (const pool of incoming) {
          if (!seenAddressesRef.current.has(pool.address)) {
            seenAddressesRef.current.add(pool.address)
            newPools.push({ ...pool, isNew: true })

            // Schedule removal of isNew flag
            const existing = newFlagTimersRef.current.get(pool.address)
            if (existing) clearTimeout(existing)
            const timer = setTimeout(() => clearNewFlag(pool.address), NEW_FLAG_DURATION)
            newFlagTimersRef.current.set(pool.address, timer)
          } else {
            // Update existing pool data
            existingMap.set(pool.address, { ...existingMap.get(pool.address)!, ...pool })
          }
        }

        const updated = [...newPools, ...prev]
        // Sort by created_at descending
        updated.sort((a, b) => b.created_at - a.created_at)
        return updated
      })

      setLastUpdated(new Date())
      setIsLoading(false)
    } catch (err) {
      console.error('[PoolFeed] Fetch error:', err)
      setIsLoading(false)
    }
  }, [clearNewFlag])

  const handleNewPoolDetected = useCallback((_poolType: 'DLMM' | 'DAMM_V2') => {
    fetchLatestPools()
  }, [fetchLatestPools])

  const { status: wsStatus } = useHeliusWebSocket({
    onNewPoolDetected: handleNewPoolDetected,
  })

  // Initial fetch
  useEffect(() => {
    fetchLatestPools()
  }, [fetchLatestPools])

  // Fallback polling
  useEffect(() => {
    const interval = setInterval(fetchLatestPools, POLL_INTERVAL)
    return () => clearInterval(interval)
  }, [fetchLatestPools])

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      newFlagTimersRef.current.forEach(t => clearTimeout(t))
    }
  }, [])

  const filteredPools = applyFilters(allPools, filters)

  const dlmmCount = allPools.filter(p => p.poolType === 'DLMM').length
  const dammCount = allPools.filter(p => p.poolType === 'DAMM_V2').length

  const oneHourAgo = Date.now() / 1000 - 3600
  const recentCount = allPools.filter(p => p.created_at > oneHourAgo).length

  return {
    pools: filteredPools,
    wsStatus,
    totalCount: allPools.length,
    dlmmCount,
    dammCount,
    recentCount,
    lastUpdated,
    isLoading,
    filters,
    setFilters,
  }
}
