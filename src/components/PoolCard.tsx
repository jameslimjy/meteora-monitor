'use client'

import { Pool } from '@/types/pool'
import { useState, useCallback, useEffect } from 'react'

interface PoolCardProps {
  pool: Pool
}

function formatUsd(value: number): string {
  if (!value || value === 0) return '$0'
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`
  return `$${value.toFixed(2)}`
}

function formatPct(value: number): string {
  if (!value || value === 0) return '0.00%'
  return `${value.toFixed(2)}%`
}

function formatAge(createdAt: number): string {
  // created_at from Meteora API is in milliseconds
  const seconds = Math.floor((Date.now() - createdAt) / 1000)
  if (seconds < 60) return `${seconds}s ago`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

function formatHolders(n: number): string {
  if (!n || n === 0) return '—'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toLocaleString()
}

function truncateAddr(addr: string): string {
  if (addr.length <= 12) return addr
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`
}

export function PoolCard({ pool }: PoolCardProps) {
  const [copied, setCopied] = useState(false)
  const [positionCount, setPositionCount] = useState<number | null | 'loading'>(
    pool.poolType === 'DLMM' ? 'loading' : null
  )

  // Fetch open positions for DLMM pools
  useEffect(() => {
    if (pool.poolType !== 'DLMM') return
    let cancelled = false
    fetch(`/api/positions/${pool.address}`)
      .then(r => r.json())
      .then(d => {
        if (!cancelled) setPositionCount(d.count ?? null)
      })
      .catch(() => {
        if (!cancelled) setPositionCount(null)
      })
    return () => { cancelled = true }
  }, [pool.address, pool.poolType])

  const handleCopy = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation()
      try {
        await navigator.clipboard.writeText(pool.address)
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
      } catch {
        // ignore
      }
    },
    [pool.address]
  )

  const poolUrl =
    pool.poolType === 'DLMM'
      ? `https://app.meteora.ag/dlmm/${pool.address}`
      : `https://app.meteora.ag/pools/${pool.address}`

  const isDlmm = pool.poolType === 'DLMM'

  // Pick the "project" token (non-SOL, non-USDC, prefer token_x)
  const stableAddresses = new Set([
    'So11111111111111111111111111111111111111112', // SOL
    'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
    'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', // USDT
  ])
  const projectToken = stableAddresses.has(pool.token_x.address)
    ? pool.token_y
    : pool.token_x

  const mcap = projectToken.market_cap ?? 0
  const holders = projectToken.holders ?? 0

  // 24h fees / TVL ratio
  const fees24h = pool.fees?.['24h'] ?? 0
  const feeTvlRatio = pool.tvl > 0 ? (fees24h / pool.tvl) * 100 : 0
  // Use pre-calculated if available (DLMM has it)
  const feeTvlDisplay =
    pool.poolType === 'DLMM' && (pool as any).fee_tvl_ratio?.['24h'] != null
      ? (pool as any).fee_tvl_ratio['24h']
      : feeTvlRatio

  return (
    <div
      className={`relative bg-[#111318] border border-[#1e2028] rounded-lg p-4 transition-all hover:border-[#2e3038] ${
        pool.isNew ? 'animate-[slideIn_0.3s_ease-out]' : ''
      }`}
    >
      {/* NEW badge */}
      {pool.isNew && (
        <span className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/15 border border-green-500/30 text-green-400 text-[10px] font-semibold uppercase tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          New
        </span>
      )}

      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <span
          className={`mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider shrink-0 ${
            isDlmm
              ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30'
              : 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
          }`}
        >
          {isDlmm ? 'DLMM' : 'DAMM v2'}
        </span>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-[#f1f5f9] leading-tight truncate pr-14">
            {pool.name}
          </h3>
        </div>
      </div>

      {/* Token info */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <TokenRow token={pool.token_x} />
        <TokenRow token={pool.token_y} />
      </div>

      {/* 6-field metrics grid */}
      <div className="grid grid-cols-3 gap-x-4 gap-y-2 mb-3 py-2.5 border-t border-b border-[#1e2028]">
        <MetricBox label="TVL" value={formatUsd(pool.tvl)} />
        <MetricBox label="MCap" value={formatUsd(mcap)} />
        <MetricBox label="Age" value={formatAge(pool.created_at)} />
        <MetricBox label="24h Fees" value={formatUsd(fees24h)} />
        <MetricBox label="Fee/TVL" value={formatPct(feeTvlDisplay)} />
        <MetricBox label="Holders" value={formatHolders(holders)} />
      </div>

      {/* DLMM-specific row: bin step, dynamic fee, open positions */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 mb-3">
        {isDlmm && (
          <>
            <Metric label="Bin Step" value={`${pool.pool_config.bin_step}bps`} />
            <Metric label="Base Fee" value={formatPct(pool.pool_config.base_fee_pct)} />
            {(pool as any).dynamic_fee_pct > 0 && (
              <Metric label="Dyn Fee" value={formatPct((pool as any).dynamic_fee_pct)} />
            )}
            <Metric
              label="Positions"
              value={
                positionCount === 'loading'
                  ? '…'
                  : positionCount === null
                  ? '—'
                  : positionCount.toLocaleString()
              }
            />
          </>
        )}
        {!isDlmm && (
          <Metric label="Base Fee" value={formatPct(pool.pool_config.base_fee_pct)} />
        )}
        {pool.volume?.['24h'] > 0 && (
          <Metric label="Vol 24h" value={formatUsd(pool.volume['24h'])} dim />
        )}
      </div>

      {/* Footer: address + links */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <button
          onClick={handleCopy}
          className="font-mono text-[11px] text-[#64748b] hover:text-[#94a3b8] transition-colors"
          title="Click to copy address"
        >
          {copied ? 'Copied!' : truncateAddr(pool.address)}
        </button>
        <a
          href={poolUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 transition-colors font-medium"
        >
          Meteora ↗
        </a>
        <a
          href={`https://birdeye.so/token/${pool.address}?chain=solana`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors font-medium"
        >
          Birdeye ↗
        </a>
        <a
          href={`https://solscan.io/account/${pool.address}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] px-1.5 py-0.5 rounded bg-[#1e2028] text-[#64748b] hover:text-[#94a3b8] transition-colors font-medium"
        >
          Solscan ↗
        </a>

        {/* Tags */}
        {pool.tags?.map(tag => (
          <span
            key={tag}
            className="px-1.5 py-0.5 rounded text-[10px] bg-[#1e2028] text-[#64748b]"
          >
            {tag}
          </span>
        ))}
        {pool.launchpad && (
          <span className="px-1.5 py-0.5 rounded text-[10px] bg-purple-500/15 text-purple-400 border border-purple-500/20">
            {pool.launchpad}
          </span>
        )}
        {pool.is_blacklisted && (
          <span className="px-1.5 py-0.5 rounded text-[10px] bg-red-500/15 text-red-400 border border-red-500/20">
            blacklisted
          </span>
        )}
      </div>
    </div>
  )
}

function TokenRow({ token }: { token: Pool['token_x'] }) {
  return (
    <div className="flex items-center gap-1.5 min-w-0">
      <span className="text-xs font-semibold text-[#f1f5f9] shrink-0">{token.symbol}</span>
      {token.is_verified && (
        <span className="text-[10px] text-green-400 shrink-0" title="Verified">✓</span>
      )}
      <span className="font-mono text-[10px] text-[#64748b] truncate">
        {truncateAddr(token.address)}
      </span>
    </div>
  )
}

/** Prominent box metric for the 6-field grid */
function MetricBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[9px] text-[#64748b] uppercase tracking-wider">{label}</span>
      <span className="text-xs font-semibold tabular-nums text-[#f1f5f9]">{value}</span>
    </div>
  )
}

/** Inline metric for secondary info */
function Metric({ label, value, dim }: { label: string; value: string; dim?: boolean }) {
  return (
    <div className="flex items-baseline gap-1">
      <span className="text-[10px] text-[#64748b] uppercase tracking-wider">{label}</span>
      <span className={`text-xs font-medium tabular-nums ${dim ? 'text-[#94a3b8]' : 'text-[#f1f5f9]'}`}>
        {value}
      </span>
    </div>
  )
}
