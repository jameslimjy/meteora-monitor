'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { Pool } from '@/types/pool'
import { PumpSwapPool } from '@/hooks/usePumpSwapFeed'
import { PumpSwapCard } from './PumpSwapCard'
import { PoolCard } from './PoolCard'

/** Tokens excluded from cross-feed matching */
const EXCLUDED_TOKENS = new Set([
  'So11111111111111111111111111111111111111112',
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
])

interface ArrowData {
  leftY: number
  rightY: number
  token: string
}

interface DualFeedProps {
  pumpSwapPools: PumpSwapPool[]
  meteoraPools: Pool[]
  pumpSwapLoading: boolean
  meteoraLoading: boolean
}

/** Extract the non-SOL/non-stable "project" token address from a Meteora pool */
function getMeteoraBaseToken(pool: Pool): string {
  return EXCLUDED_TOKENS.has(pool.token_x.address)
    ? pool.token_y.address
    : pool.token_x.address
}

export function DualFeed({
  pumpSwapPools,
  meteoraPools,
  pumpSwapLoading,
  meteoraLoading,
}: DualFeedProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const leftColRef = useRef<HTMLDivElement>(null)
  const rightColRef = useRef<HTMLDivElement>(null)
  const [arrows, setArrows] = useState<ArrowData[]>([])
  const [svgHeight, setSvgHeight] = useState(0)
  const [gapX, setGapX] = useState({ left: 0, right: 0 })

  const computeArrows = useCallback(() => {
    const container = containerRef.current
    const leftCol = leftColRef.current
    const rightCol = rightColRef.current
    if (!container || !leftCol || !rightCol) return

    const containerRect = container.getBoundingClientRect()

    // Build token → element maps from data attributes
    const leftEls = leftCol.querySelectorAll('[data-base-token]')
    const rightEls = rightCol.querySelectorAll('[data-base-token]')

    const leftMap = new Map<string, Element>()
    leftEls.forEach(el => {
      const token = el.getAttribute('data-base-token')
      if (token && !EXCLUDED_TOKENS.has(token)) leftMap.set(token, el)
    })

    const newArrows: ArrowData[] = []
    rightEls.forEach(el => {
      const token = el.getAttribute('data-base-token')
      if (!token || EXCLUDED_TOKENS.has(token)) return
      const leftEl = leftMap.get(token)
      if (!leftEl) return

      const leftRect = leftEl.getBoundingClientRect()
      const rightRect = el.getBoundingClientRect()

      newArrows.push({
        leftY: leftRect.top + leftRect.height / 2 - containerRect.top,
        rightY: rightRect.top + rightRect.height / 2 - containerRect.top,
        token,
      })
    })

    // Compute gap x positions
    const leftColRect = leftCol.getBoundingClientRect()
    const rightColRect = rightCol.getBoundingClientRect()
    setGapX({
      left: leftColRect.right - containerRect.left,
      right: rightColRect.left - containerRect.left,
    })

    setArrows(newArrows)
    setSvgHeight(containerRect.height)
  }, [])

  // Recompute arrows when pools change or on resize/scroll
  useEffect(() => {
    // Short delay to let DOM settle
    const timer = setTimeout(computeArrows, 100)
    const interval = setInterval(computeArrows, 2000)
    window.addEventListener('resize', computeArrows)
    window.addEventListener('scroll', computeArrows)
    return () => {
      clearTimeout(timer)
      clearInterval(interval)
      window.removeEventListener('resize', computeArrows)
      window.removeEventListener('scroll', computeArrows)
    }
  }, [computeArrows, pumpSwapPools, meteoraPools])

  // Build set of matched tokens for visual highlighting
  const matchedTokens = new Set(arrows.map(a => a.token))

  return (
    <div ref={containerRef} className="relative flex gap-4 items-start">
      {/* ── PumpSwap (Left Column) ── */}
      <div ref={leftColRef} className="flex-1 min-w-0">
        {pumpSwapLoading && pumpSwapPools.length === 0 ? (
          <LoadingSkeleton />
        ) : pumpSwapPools.length === 0 ? (
          <EmptyState text="No PumpSwap pools found" />
        ) : (
          <div className="space-y-2.5">
            {pumpSwapPools.map(pool => (
              <div
                key={pool.address}
                data-base-token={pool.base_token.address}
                className={
                  matchedTokens.has(pool.base_token.address)
                    ? 'ring-1 ring-emerald-500/40 rounded-lg'
                    : ''
                }
              >
                <PumpSwapCard pool={pool} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── SVG Arrow Overlay ── */}
      {arrows.length > 0 && (
        <svg
          className="absolute left-0 top-0 w-full pointer-events-none z-10"
          style={{ height: svgHeight || '100%' }}
        >
          <defs>
            <marker
              id="arrowhead"
              markerWidth="8"
              markerHeight="6"
              refX="7"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 8 3, 0 6" fill="#10b981" fillOpacity="0.7" />
            </marker>
          </defs>
          {arrows.map((a, i) => {
            const x1 = gapX.left + 2
            const x2 = gapX.right - 2
            const midX = (x1 + x2) / 2
            return (
              <path
                key={`${a.token}-${i}`}
                d={`M ${x1} ${a.leftY} C ${midX} ${a.leftY}, ${midX} ${a.rightY}, ${x2} ${a.rightY}`}
                stroke="#10b981"
                strokeOpacity="0.5"
                strokeWidth="2"
                fill="none"
                strokeDasharray="6 3"
                markerEnd="url(#arrowhead)"
              />
            )
          })}
        </svg>
      )}

      {/* ── Meteora (Right Column) ── */}
      <div ref={rightColRef} className="flex-1 min-w-0">
        {meteoraLoading && meteoraPools.length === 0 ? (
          <LoadingSkeleton />
        ) : meteoraPools.length === 0 ? (
          <EmptyState text="No Meteora pools found" />
        ) : (
          <div className="space-y-2.5">
            {meteoraPools.map(pool => (
              <div
                key={pool.address}
                data-base-token={getMeteoraBaseToken(pool)}
                className={
                  matchedTokens.has(getMeteoraBaseToken(pool))
                    ? 'ring-1 ring-emerald-500/40 rounded-lg'
                    : ''
                }
              >
                <PoolCard pool={pool} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-2.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="bg-[#111318] border border-[#1e2028] rounded-lg p-3.5 animate-pulse"
        >
          <div className="flex items-start gap-2 mb-2.5">
            <div className="w-14 h-4 rounded bg-[#1e2028]" />
            <div className="flex-1 h-4 rounded bg-[#1e2028]" />
          </div>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div className="h-3 rounded bg-[#1e2028]" />
            <div className="h-3 rounded bg-[#1e2028]" />
          </div>
          <div className="grid grid-cols-3 gap-2 mt-2">
            <div className="h-6 rounded bg-[#1e2028]" />
            <div className="h-6 rounded bg-[#1e2028]" />
            <div className="h-6 rounded bg-[#1e2028]" />
          </div>
        </div>
      ))}
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-3xl mb-3 opacity-30">◉</div>
      <p className="text-[#64748b] text-xs">{text}</p>
    </div>
  )
}
