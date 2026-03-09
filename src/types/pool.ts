export interface TokenInfo {
  address: string
  symbol: string
  name: string
  decimals: number
  is_verified: boolean
  price: number
  holders: number
  market_cap: number
  total_supply: number
}

export interface VolumeData {
  '24h': number
  '1h': number
  '30m': number
}

export interface FeesData {
  '24h': number
  '1h': number
  '30m': number
}

export interface FeeTvlRatio {
  '24h': number
  '1h': number
  '30m': number
}

export interface DLMMPool {
  address: string
  name: string
  created_at: number
  token_x: TokenInfo
  token_y: TokenInfo
  pool_config: {
    bin_step: number
    base_fee_pct: number
    max_fee_pct: number
    protocol_fee_pct: number
  }
  dynamic_fee_pct: number
  tvl: number
  current_price: number
  apr: number
  apy: number
  volume: VolumeData
  fees: FeesData
  fee_tvl_ratio: FeeTvlRatio
  tags: string[]
  launchpad: string | null
  is_blacklisted: boolean
}

export interface DAMMPool {
  address: string
  name: string
  created_at: number
  token_x: TokenInfo
  token_y: TokenInfo
  pool_config: {
    base_fee_pct: number
    protocol_fee_pct: number
    min_price: number
    max_price: number
    pool_type: number
    concentrated_liquidity: boolean
    dynamic_fee_initialized: boolean
  }
  tvl: number
  current_price: number
  volume: VolumeData
  fees: FeesData
  fee_tvl_ratio?: FeeTvlRatio
  tags: string[]
  launchpad: string | null
  is_blacklisted: boolean
}

export type Pool = (
  | (DLMMPool & { poolType: 'DLMM' })
  | (DAMMPool & { poolType: 'DAMM_V2' })
) & {
  isNew?: boolean
  openPositions?: number | null  // null = loading, undefined = not fetched
}

export interface Filters {
  poolType: 'ALL' | 'DLMM' | 'DAMM_V2'
  search: string
  minTvl: string
  binStep: string
}
