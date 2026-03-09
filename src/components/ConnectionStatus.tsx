'use client'

import { WsStatus } from '@/hooks/useHeliusWebSocket'

interface ConnectionStatusProps {
  status: WsStatus
}

export function ConnectionStatus({ status }: ConnectionStatusProps) {
  const config = {
    connected: {
      dot: 'bg-green-500 animate-pulse',
      text: 'Live',
      label: 'text-green-400',
    },
    connecting: {
      dot: 'bg-yellow-500 animate-pulse',
      text: 'Connecting',
      label: 'text-yellow-400',
    },
    disconnected: {
      dot: 'bg-yellow-500',
      text: 'Polling',
      label: 'text-yellow-400',
    },
    error: {
      dot: 'bg-red-500',
      text: 'Disconnected',
      label: 'text-red-400',
    },
  }[status]

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#111318] border border-[#1e2028]">
      <span className={`w-2 h-2 rounded-full ${config.dot}`} />
      <span className={`text-xs font-medium ${config.label}`}>{config.text}</span>
    </div>
  )
}
