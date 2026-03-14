export interface CollectionStatusItem {
  table_name: string
  display_name: string
  total_rows: number
  earliest_date: string | null
  latest_date: string | null
  last_collected_at: string | null
}

export interface InvestorTradingRow {
  id: number
  symbol: string
  name: string | null
  dt: string
  foreign_net: number
  inst_net: number
  retail_net: number
  foreign_buy_vol: number
  foreign_sell_vol: number
  inst_buy_vol: number
  inst_sell_vol: number
  retail_buy_vol: number
  retail_sell_vol: number
  collected_at: string | null
}

export interface MarginShortRow {
  id: number
  symbol: string
  name: string | null
  dt: string
  margin_balance: number
  margin_rate: number
  short_volume: number
  short_balance: number
  short_balance_rate: number
  collected_at: string | null
}

export interface DartFinancialRow {
  id: number
  symbol: string
  name: string | null
  disclosure_date: string
  fiscal_year: string
  fiscal_quarter: string
  eps: number | null
  bps: number | null
  operating_margin: number | null
  debt_to_equity: number | null
  collected_at: string | null
}

export interface ProgramTradingRow {
  id: number
  symbol: string
  name: string | null
  dt: string
  pgm_buy_qty: number
  pgm_sell_qty: number
  pgm_net_qty: number
  pgm_buy_amount: number
  pgm_sell_amount: number
  pgm_net_amount: number
  collected_at: string | null
}

export interface CandleCoverageItem {
  symbol: string
  name: string | null
  interval: string
  total_candles: number
  earliest_date: string
  latest_date: string
}

export interface NewsExplorerRow {
  id: string
  symbol: string | null
  name: string | null
  source: string
  title: string
  url: string | null
  published_at: string
  sentiment_score: number | null
  market_impact: number | null
}

export interface PagedResponse<T> {
  items: T[]
  total: number
  page: number
  limit: number
}

export interface DataGapItem {
  data_type: string
  missing_dates: string[]
  gap_count: number
}
