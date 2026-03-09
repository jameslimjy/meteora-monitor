import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

interface GeckoToken {
  id: string
  type: string
  attributes: {
    address: string
    name: string
    symbol: string
    decimals: number
    image_url: string | null
  }
}

export async function GET() {
  try {
    // Fetch 4 pages in parallel — ~25% are PumpSwap, so 4 pages ≈ 20 pools
    const pages = await Promise.all(
      [1, 2, 3, 4].map(page =>
        fetch(
          `https://api.geckoterminal.com/api/v2/networks/solana/new_pools?page=${page}&include=base_token,quote_token,dex`,
          { cache: 'no-store' }
        ).then(r => r.json())
      )
    )

    // Build token map from all included data
    const tokenMap = new Map<string, GeckoToken['attributes']>()
    for (const page of pages) {
      for (const inc of (page.included || [])) {
        if (inc.type === 'token') {
          tokenMap.set(inc.id, inc.attributes)
        }
      }
    }

    // Filter for pumpswap pools and normalize
    const seen = new Set<string>()
    const pools: Record<string, unknown>[] = []

    for (const page of pages) {
      for (const pool of (page.data || [])) {
        const dexId = pool.relationships?.dex?.data?.id
        if (dexId !== 'pumpswap') continue

        const addr = pool.attributes.address
        if (seen.has(addr)) continue
        seen.add(addr)

        const baseTokenId = pool.relationships?.base_token?.data?.id
        const quoteTokenId = pool.relationships?.quote_token?.data?.id
        const baseToken = tokenMap.get(baseTokenId || '')
        const quoteToken = tokenMap.get(quoteTokenId || '')

        const tvl = parseFloat(pool.attributes.reserve_in_usd || '0')
        const vol24h = parseFloat(pool.attributes.volume_usd?.h24 || '0')
        const fees24h = vol24h * 0.0025 // PumpSwap 0.25% fee

        pools.push({
          address: addr,
          name: pool.attributes.name || 'Unknown',
          created_at: new Date(pool.attributes.pool_created_at).getTime(),
          base_token: {
            address: baseToken?.address || '',
            symbol: baseToken?.symbol || '?',
            name: baseToken?.name || 'Unknown',
            decimals: baseToken?.decimals ?? 6,
            image_url: baseToken?.image_url || null,
          },
          quote_token: {
            address: quoteToken?.address || 'So11111111111111111111111111111111111111112',
            symbol: quoteToken?.symbol || 'SOL',
            name: quoteToken?.name || 'Wrapped SOL',
            decimals: quoteToken?.decimals ?? 9,
          },
          tvl,
          market_cap: pool.attributes.market_cap_usd
            ? parseFloat(pool.attributes.market_cap_usd)
            : null,
          fdv: pool.attributes.fdv_usd
            ? parseFloat(pool.attributes.fdv_usd)
            : null,
          volume_24h: vol24h,
          fees_24h: fees24h,
          fee_tvl_ratio: tvl > 0 ? (fees24h / tvl) * 100 : 0,
          price_usd: parseFloat(pool.attributes.base_token_price_usd || '0'),
          transactions: {
            h24: pool.attributes.transactions?.h24 || { buys: 0, sells: 0, buyers: 0, sellers: 0 },
            h1: pool.attributes.transactions?.h1 || { buys: 0, sells: 0, buyers: 0, sellers: 0 },
          },
        })
      }
    }

    // Sort newest first
    pools.sort((a, b) => (b.created_at as number) - (a.created_at as number))

    return NextResponse.json({ data: pools.slice(0, 20) })
  } catch (err) {
    console.error('[PumpSwap API]', err)
    return NextResponse.json(
      { error: 'Failed to fetch PumpSwap pools' },
      { status: 500 }
    )
  }
}
