'use client'

interface StatsBarProps {
  totalCount: number
  dlmmCount: number
  dammCount: number
  recentCount: number
  lastUpdated: Date | null
}

export function StatsBar({ totalCount, dlmmCount, dammCount, recentCount, lastUpdated }: StatsBarProps) {
  const formatTime = (date: Date | null) => {
    if (!date) return '—'
    return date.toLocaleTimeString('en-US', { hour12: false })
  }

  return (
    <div className="flex flex-wrap items-center gap-4 px-4 py-2 bg-[#111318] border border-[#1e2028] rounded-lg">
      <Stat label="Total Detected" value={totalCount.toString()} />
      <div className="w-px h-4 bg-[#1e2028]" />
      <Stat label="DLMM" value={dlmmCount.toString()} accent="orange" />
      <div className="w-px h-4 bg-[#1e2028]" />
      <Stat label="DAMM v2" value={dammCount.toString()} accent="blue" />
      <div className="w-px h-4 bg-[#1e2028]" />
      <Stat label="New (1h)" value={recentCount.toString()} accent="green" />
      <div className="w-px h-4 bg-[#1e2028]" />
      <Stat label="Updated" value={formatTime(lastUpdated)} />
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
  accent?: 'orange' | 'blue' | 'green'
}) {
  const valueColor = {
    orange: 'text-orange-400',
    blue: 'text-blue-400',
    green: 'text-green-400',
    undefined: 'text-[#f1f5f9]',
  }[accent ?? 'undefined']

  return (
    <div className="flex flex-col">
      <span className="text-xs text-[#64748b] uppercase tracking-wider leading-none mb-0.5">
        {label}
      </span>
      <span className={`text-sm font-semibold tabular-nums ${valueColor}`}>{value}</span>
    </div>
  )
}
