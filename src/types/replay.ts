// ── Replay Request ────────────────────────────────────────

export interface ReplayRequest {
  factor_ids?: string[]
  target_date?: string
  initial_capital?: number
  max_positions?: number
}

// ── Replay Trade Log ─────────────────────────────────────

export interface ReplayTrade {
  symbol: string
  name?: string
  side: "BUY" | "SELL"
  step: string
  qty: number
  price: number
  pnl_pct?: number
  pnl_amount?: number
  candle_dt: string
  reason?: string
  avg_price?: number
  holding_minutes?: number
}

// ── Replay Session (per factor) ──────────────────────────

export interface ReplaySession {
  factor_id: string
  factor_name: string
  interval: string
  trade_count: number
  trade_log: ReplayTrade[]
  equity_curve: { dt: string; equity: number }[]
  metrics: Record<string, number>
  final_cash: number
  error?: string
}

// ── Replay Result (API response) ──────────────────────────

export interface ReplayResult {
  id?: string
  target_date: string
  factors: { factor_id: string; name: string; interval: string }[]
  sessions: ReplaySession[]
  aggregate_metrics: Record<string, number>
  error?: string
}

// ── Replay History Item ──────────────────────────────────

export interface ReplayHistoryItem {
  id: string
  target_date: string
  factor_ids: string[]
  config: Record<string, number>
  aggregate_metrics: Record<string, number>
  created_at: string
}
