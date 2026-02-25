export interface TickData {
  time: number
  value: number
}

export interface StockQuote {
  symbol: string
  price: number
  change: number
  changePercent: number
  timestamp: number
}

export interface HealthResponse {
  status: string
}
