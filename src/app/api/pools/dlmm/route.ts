import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const res = await fetch(
      'https://dlmm.datapi.meteora.ag/pools?sort_by=pool_created_at:desc&page_size=20',
      { cache: 'no-store' }
    )

    if (!res.ok) {
      return NextResponse.json(
        { error: `Upstream error: ${res.status}` },
        { status: res.status }
      )
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to fetch DLMM pools' },
      { status: 500 }
    )
  }
}
