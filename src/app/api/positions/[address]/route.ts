import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const DLMM_PROGRAM_ID = 'LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo'
const HELIUS_API_KEY = process.env.NEXT_PUBLIC_HELIUS_API_KEY

// DLMM Position account discriminator: sha256("account:Position")[0:8]
// lb_pair field offset in Position struct: 8 bytes (after discriminator)
const POSITION_ACCOUNT_SIZE = 688

export async function GET(
  _req: Request,
  { params }: { params: { address: string } }
) {
  const { address } = params

  if (!HELIUS_API_KEY) {
    return NextResponse.json({ error: 'No API key' }, { status: 500 })
  }

  try {
    // Encode the pool address as base58 for memcmp filter
    const rpcUrl = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`

    const body = {
      jsonrpc: '2.0',
      id: 1,
      method: 'getProgramAccounts',
      params: [
        DLMM_PROGRAM_ID,
        {
          encoding: 'base64',
          dataSlice: { offset: 0, length: 0 },
          filters: [
            { dataSize: POSITION_ACCOUNT_SIZE },
            { memcmp: { offset: 8, bytes: address } },
          ],
        },
      ],
    }

    const res = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    const data = await res.json()

    if (data.error) {
      return NextResponse.json({ count: null, error: data.error.message }, { status: 200 })
    }

    const count = Array.isArray(data.result) ? data.result.length : null
    return NextResponse.json({ count })
  } catch (err) {
    return NextResponse.json({ count: null, error: String(err) }, { status: 200 })
  }
}
