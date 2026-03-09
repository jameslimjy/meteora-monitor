'use client'

import { PumpSwapPool } from '@/hooks/usePumpSwapFeed'
import { useState, useCallback } from 'react'

function formatUsd(value: number | null): string {
  if (!value || value === 0) return '$0'
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`
  return `$${value.toFixed(2)}`
}

function formatAge(createdAt: number): string {
  const seconds = Math.floor((Date.now() - createdAt) / 1000)
  if (seconds < 0) return 'just now'
  if (seconds < 60) return `${seconds}s ago`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

function formatPct(value: number): string {
  if (!value || value === 0) return '0.00%'
  return `${value.toFixed(2)}%`
}

function formatPrice(value: number): string {
  if (!value || value === 0) return '—'
  if (value < 0.000001) return `$${value.toExponential(2)}`
  if (value < 0.01) return `$${value.toFixed(6)}`
  if (value < 1) return `$${value.toFixed(4)}`
  return `$${value.toFixed(2)}`
}

function truncateAddr(addr: string): string {
  if (addr.length <= 12) return addr
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`
}

export function PumpSwapCard({ pool }: { pool: PumpSwapPool }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation()
      try {
        await navigator.clipboard.writeText(pool.address)
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
      } catch {}
    },
    [pool.address]
  )

  return (
    <div
      className={`relative bg-[#111318] border border-[#1e2028] rounded-lg p-3.5 transition-all hover:border-[#2e3038] ${
        pool.isNew ? 'animate-[slideIn_0.3s_ease-out]' : ''
      }`}
    >
      {/* NEW badge */}
      {pool.isNew && (
        <span className="absolute top-2.5 right-2.5 flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-green-500/15 border border-green-500/30 text-green-400 text-[9px] font-semibold uppercase tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          New
        </span>
      )}

      {/* Header */}
      <div className="flex items-start gap-2 mb-2.5">
        <span className="mt-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider shrink-0 bg-pink-500/15 text-pink-400 border border-pink-500/30">
          PumpSwap
        </span>
        <h3 className="text-xs font-semibold text-[#f1f5f9] leading-tight truncate pr-12">
          {pool.name}
        </h3>
      </div>

      {/* Token info */}
      <div className="grid grid-cols-2 gap-1.5 mb-2.5">
        <div className="flex items-center gap-1 min-w-0">
          <span className="text-[11px] font-semibold text-[#f1f5f9] shrink-0">
            {pool.base_token.symbol}
          </span>
          <span className="font-mono text-[9px] text-[#64748b] truncate">
            {truncateAddr(pool.base_token.address)}
          </span>
        </div>
        <div className="flex items-center gap-1 min-w-0">
          <span className="text-[11px] font-semibold text-[#f1f5f9] shrink-0">
            {pool.quote_token.symbol}
          </span>
          <span className="font-mono text-[9px] text-[#64748b] truncate">
            {truncateAddr(pool.quote_token.address)}
          </span>
        </div>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-3 gap-x-3 gap-y-1.5 mb-2.5 py-2 border-t border-b border-[#1e2028]">
        <MetricBox label="TVL" value={formatUsd(pool.tvl)} />
        <MetricBox label="MCap" value={formatUsd(pool.market_cap)} />
        <MetricBox label="Age" value={formatAge(pool.created_at)} />
        <MetricBox label="24h Fees" value={formatUsd(pool.fees_24h)} />
        <MetricBox label="Fee/TVL" value={formatPct(pool.fee_tvl_ratio)} />
        <MetricBox label="Vol 24h" value={formatUsd(pool.volume_24h)} />
      </div>

      {/* Secondary row */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 mb-2.5">
        <Metric label="Price" value={formatPrice(pool.price_usd)} />
        <Metric label="Buys" value={pool.transactions.h24.buys.toLocaleString()} />
        <Metric label="Sells" value={pool.transactions.h24.sells.toLocaleString()} />
      </div>

      {/* Footer */}
      <div className="flex items-center gap-1 flex-wrap">
        <button
          onClick={handleCopy}
          className="font-mono text-[10px] text-[#64748b] hover:text-[#94a3b8] transition-colors"
          title="Click to copy address"
        >
          {copied ? 'Copied!' : truncateAddr(pool.address)}
        </button>
        <a
          href={`https://pump.fun/coin/${pool.base_token.address}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[9px] px-1.5 py-0.5 rounded bg-pink-500/10 text-pink-400 hover:bg-pink-500/20 transition-colors font-medium"
        >
          Pump ↗
        </a>
        <a
          href={`https://birdeye.so/token/${pool.base_token.address}?chain=solana`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors font-medium"
        >
          Birdeye ↗
        </a>
        <a
          href={`https://solscan.io/account/${pool.address}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[9px] px-1.5 py-0.5 rounded bg-[#1e2028] text-[#64748b] hover:text-[#94a3b8] transition-colors font-medium"
        >
          Solscan ↗
        </a>
      </div>
    </div>
  )
}

function MetricBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[8px] text-[#64748b] uppercase tracking-wider">{label}</span>
      <span className="text-[11px] font-semibold tabular-nums text-[#f1f5f9]">{value}</span>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-1">
      <span className="text-[9px] text-[#64748b] uppercase tracking-wider">{label}</span>
      <span className="text-[11px] font-medium tabular-nums text-[#f1f5f9]">{value}</span>
    </div>
  )
}
