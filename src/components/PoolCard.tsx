'use client'

import { Pool } from '@/types/pool'
import { useState, useCallback } from 'react'

interface PoolCardProps {
  pool: Pool
}

function formatUsd(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`
  return `$${value.toFixed(2)}`
}

function formatPct(value: number): string {
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

function truncateAddr(addr: string): string {
  if (addr.length <= 12) return addr
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`
}

export function PoolCard({ pool }: PoolCardProps) {
  const [copied, setCopied] = useState(false)

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
          className={`mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
            isDlmm
              ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30'
              : 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
          }`}
        >
          {isDlmm ? 'DLMM' : 'DAMM v2'}
        </span>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-[#f1f5f9] leading-tight truncate pr-12">
            {pool.name}
          </h3>
        </div>
      </div>

      {/* Token info */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <TokenRow token={pool.token_x} />
        <TokenRow token={pool.token_y} />
      </div>

      {/* Key metrics */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 mb-2">
        <Metric label="TVL" value={formatUsd(pool.tvl)} />
        <Metric label="Base Fee" value={formatPct(pool.pool_config.base_fee_pct)} />
        {pool.poolType === 'DLMM' && (
          <Metric label="Bin Step" value={`${pool.pool_config.bin_step}bps`} />
        )}
        <Metric label="Age" value={formatAge(pool.created_at)} />
      </div>

      {/* Secondary metrics */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 mb-3">
        {pool.volume?.['24h'] > 0 && (
          <Metric label="Vol 24h" value={formatUsd(pool.volume['24h'])} dim />
        )}
        {pool.fees?.['24h'] > 0 && (
          <Metric label="Fees 24h" value={formatUsd(pool.fees['24h'])} dim />
        )}
        {pool.poolType === 'DLMM' && pool.apr > 0 && (
          <Metric label="APR" value={formatPct(pool.apr)} dim />
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Pool address */}
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
            className="text-[#64748b] hover:text-[#3b82f6] text-[11px] transition-colors"
            title="Open on Meteora"
          >
            ↗
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

          {/* Launchpad */}
          {pool.launchpad && (
            <span className="px-1.5 py-0.5 rounded text-[10px] bg-purple-500/15 text-purple-400 border border-purple-500/20">
              {pool.launchpad}
            </span>
          )}

          {/* Blacklisted warning */}
          {pool.is_blacklisted && (
            <span className="px-1.5 py-0.5 rounded text-[10px] bg-red-500/15 text-red-400 border border-red-500/20">
              blacklisted
            </span>
          )}
        </div>
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

function Metric({
  label,
  value,
  dim,
}: {
  label: string
  value: string
  dim?: boolean
}) {
  return (
    <div className="flex items-baseline gap-1">
      <span className="text-[10px] text-[#64748b] uppercase tracking-wider">{label}</span>
      <span className={`text-xs font-medium tabular-nums ${dim ? 'text-[#94a3b8]' : 'text-[#f1f5f9]'}`}>
        {value}
      </span>
    </div>
  )
}
