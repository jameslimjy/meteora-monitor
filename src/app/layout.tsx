import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Meteora Monitor',
  description: 'Real-time Meteora DLMM & DAMM v2 pool creation monitor',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0a0b0e] text-[#f1f5f9] antialiased">
        {children}
      </body>
    </html>
  )
}
