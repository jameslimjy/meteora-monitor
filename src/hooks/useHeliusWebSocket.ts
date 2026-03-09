'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

const DLMM_PROGRAM_ID = 'LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo'
const DAMM_V2_PROGRAM_ID = 'cpamdpZCGKUy5JxQXB4dcpGPiikHawvSWAd6mEBBmPe'

const DLMM_KEYWORDS = ['InitializeLbPair', 'InitializePermissionlessLbPair', 'InitializePermissionedLbPair']
const DAMM_KEYWORDS = ['InitializePool']

export type WsStatus = 'connecting' | 'connected' | 'disconnected' | 'error'

interface UseHeliusWebSocketOptions {
  onNewPoolDetected: (poolType: 'DLMM' | 'DAMM_V2') => void
}

export function useHeliusWebSocket({ onNewPoolDetected }: UseHeliusWebSocketOptions) {
  const [status, setStatus] = useState<WsStatus>('disconnected')
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reconnectDelayRef = useRef(1000)
  const mountedRef = useRef(true)
  const subIdDlmmRef = useRef<number | null>(null)
  const subIdDammRef = useRef<number | null>(null)
  const msgIdRef = useRef(1)

  const connect = useCallback(() => {
    const apiKey = process.env.NEXT_PUBLIC_HELIUS_API_KEY
    if (!apiKey) {
      console.warn('[WS] No Helius API key found')
      setStatus('error')
      return
    }

    if (!mountedRef.current) return

    setStatus('connecting')
    const url = `wss://atlas-mainnet.helius-rpc.com/?api-key=${apiKey}`
    const ws = new WebSocket(url)
    wsRef.current = ws

    ws.onopen = () => {
      if (!mountedRef.current) { ws.close(); return }
      setStatus('connected')
      reconnectDelayRef.current = 1000

      // Subscribe to DLMM program logs
      const dlmmSubMsg = {
        jsonrpc: '2.0',
        id: msgIdRef.current++,
        method: 'logsSubscribe',
        params: [
          { mentions: [DLMM_PROGRAM_ID] },
          { commitment: 'confirmed' }
        ]
      }
      ws.send(JSON.stringify(dlmmSubMsg))

      // Subscribe to DAMM v2 program logs
      const dammSubMsg = {
        jsonrpc: '2.0',
        id: msgIdRef.current++,
        method: 'logsSubscribe',
        params: [
          { mentions: [DAMM_V2_PROGRAM_ID] },
          { commitment: 'confirmed' }
        ]
      }
      ws.send(JSON.stringify(dammSubMsg))
    }

    ws.onmessage = (event) => {
      if (!mountedRef.current) return
      try {
        const msg = JSON.parse(event.data as string)

        // Store subscription IDs from responses
        if (msg.result !== undefined && typeof msg.result === 'number') {
          if (subIdDlmmRef.current === null) {
            subIdDlmmRef.current = msg.result
          } else {
            subIdDammRef.current = msg.result
          }
          return
        }

        // Handle notification
        if (msg.method === 'logsNotification') {
          const params = msg.params
          if (!params?.result?.value) return

          const { logs, subscription } = params.result.value
          if (!Array.isArray(logs)) return

          const logsStr = logs.join(' ')

          // Check if this is a DLMM pool creation
          const isDlmm = subscription === subIdDlmmRef.current ||
            DLMM_KEYWORDS.some(kw => logsStr.includes(kw))

          // Check if this is a DAMM v2 pool creation
          const isDamm = subscription === subIdDammRef.current ||
            DAMM_KEYWORDS.some(kw => logsStr.includes(kw))

          if (isDlmm && DLMM_KEYWORDS.some(kw => logsStr.includes(kw))) {
            onNewPoolDetected('DLMM')
          } else if (isDamm && DAMM_KEYWORDS.some(kw => logsStr.includes(kw))) {
            onNewPoolDetected('DAMM_V2')
          }
        }
      } catch {
        // ignore parse errors
      }
    }

    ws.onerror = () => {
      if (!mountedRef.current) return
      setStatus('error')
    }

    ws.onclose = () => {
      if (!mountedRef.current) return
      setStatus('disconnected')
      subIdDlmmRef.current = null
      subIdDammRef.current = null

      // Exponential backoff reconnect
      const delay = Math.min(reconnectDelayRef.current, 30000)
      reconnectDelayRef.current = Math.min(delay * 2, 30000)

      reconnectTimeoutRef.current = setTimeout(() => {
        if (mountedRef.current) connect()
      }, delay)
    }
  }, [onNewPoolDetected])

  useEffect(() => {
    mountedRef.current = true
    connect()

    return () => {
      mountedRef.current = false
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (wsRef.current) {
        wsRef.current.onclose = null
        wsRef.current.close()
      }
    }
  }, [connect])

  return { status }
}
