'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

export interface PumpSwapPool {
  address: string
  name: string
  created_at: number
  base_token: {
    address: string
    symbol: string
    name: string
    decimals: number
    image_url: string | null
  }
  quote_token: {
    address: string
    symbol: string
    name: string
    decimals: number
  }
  tvl: number
  market_cap: number | null
  fdv: number | null
  volume_24h: number
  fees_24h: number
  fee_tvl_ratio: number
  price_usd: number
  transactions: {
    h24: { buys: number; sells: number; buyers: number; sellers: number }
    h1: { buys: number; sells: number; buyers: number; sellers: number }
  }
  isNew?: boolean
}

export function usePumpSwapFeed() {
  const [pools, setPools] = useState<PumpSwapPool[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const knownAddresses = useRef(new Set<string>())
  const firstLoad = useRef(true)

  const fetchPools = useCallback(async () => {
    try {
      const res = await fetch('/api/pools/pumpswap')
      if (!res.ok) return
      const { data } = await res.json()
      if (!data) return

      const newPools: PumpSwapPool[] = data.map((p: PumpSwapPool) => ({
        ...p,
        isNew: !firstLoad.current && !knownAddresses.current.has(p.address),
      }))

      for (const p of newPools) knownAddresses.current.add(p.address)
      firstLoad.current = false

      setPools(newPools)
      setLastUpdated(new Date())
      setIsLoading(false)
    } catch {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPools()
    const interval = setInterval(fetchPools, 15_000)
    return () => clearInterval(interval)
  }, [fetchPools])

  return {
    pools,
    isLoading,
    lastUpdated,
    totalCount: pools.length,
  }
}
