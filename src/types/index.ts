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

export interface Account {
  id: number
  mode: "REAL" | "PAPER"
  total_capital: number
  current_balance: number
}

export interface Position {
  id: number
  symbol: string
  name: string
  mode: "REAL" | "PAPER"
  qty: number
  avg_price: number
  current_price: number
  pnl: number
  pnl_percent: number
}

export interface Order {
  order_id: string
  symbol: string
  name: string
  side: "BUY" | "SELL"
  type: "MARKET" | "LIMIT"
  price: number
  qty: number
  status: "PENDING" | "FILLED" | "PARTIAL" | "CANCELLED" | "REJECTED"
  mode: "REAL" | "PAPER"
  created_at: string
}

export interface HealthResponse {
  status: string
  database?: string
}

export interface CandleData {
  time: number
  open: number
  high: number
  low: number
  close: number
  volume?: number
}

export interface OrderBookEntry {
  price: number
  volume: number
}

export interface OrderBook {
  symbol: string
  asks: OrderBookEntry[]
  bids: OrderBookEntry[]
}

export interface OrderCreate {
  symbol: string
  side: "BUY" | "SELL"
  type: "MARKET" | "LIMIT"
  price?: number
  qty: number
  mode: "REAL" | "PAPER"
}

export interface StockInfo {
  symbol: string
  name: string
  market: string
}

export interface RealtimeTick {
  type: "tick"
  symbol: string
  price: number
  volume: number
  change: number
}

export interface RealtimeOrderBook {
  type: "orderbook"
  symbol: string
  currentPrice: number
  asks: OrderBookEntry[]
  bids: OrderBookEntry[]
}

// ── 틱 데이터 (REST 조회용) ──────────────────────────────────
export interface TickDataPoint {
  time: number
  price: number
  volume: number
}

// ── 기술적 지표 ────────────────────────────────────────────
export interface IndicatorRSI {
  value: number | null
}

export interface IndicatorMACD {
  macd: number | null
  signal: number | null
  histogram: number | null
}

export interface IndicatorBB {
  upper: number | null
  middle: number | null
  lower: number | null
}

export interface IndicatorMA {
  value: number | null
}

export interface CandleWithIndicators {
  candles: CandleData[]
  indicators?: {
    rsi?: IndicatorRSI[]
    macd?: IndicatorMACD[]
    bb?: IndicatorBB[]
    [key: string]: Array<{ value: number | null }> | IndicatorMACD[] | IndicatorBB[] | undefined
  }
}

export interface MALineConfig {
  id: string
  period: number
  color: string
  lineWidth: number
  lineStyle: number // 0=Solid, 1=Dotted, 2=Dashed, 3=LargeDashed
  visible: boolean
}

// ── 백테스트 ────────────────────────────────────────────────
export interface BacktestCondition {
  indicator: string
  params: Record<string, number>
  op: string
  value: number
}

export interface PositionSizing {
  mode: "fixed" | "conviction" | "atr_target" | "kelly"
  weights?: Record<string, number>
  atr_period?: number
  target_risk_pct?: number
  kelly_fraction?: number
}

export interface ScalingConfig {
  enabled: boolean
  initial_pct?: number
  scale_in_trigger?: "price_drop" | "support_touch"
  scale_in_drop_pct?: number
  max_scale_in?: number
  partial_exit_pct?: number
  partial_exit_gain_pct?: number
}

export interface RiskManagement {
  stop_loss_pct?: number
  trailing_stop_pct?: number
  atr_stop_multiplier?: number
}

export interface BacktestStrategy {
  name: string
  description: string
  timeframe: string
  buy_conditions: BacktestCondition[]
  buy_logic: "AND" | "OR"
  sell_conditions: BacktestCondition[]
  sell_logic: "AND" | "OR"
  position_sizing?: PositionSizing | null
  scaling?: ScalingConfig | null
  risk_management?: RiskManagement | null
}

export interface BacktestCostConfig {
  buy_commission: number
  sell_commission: number
  slippage_pct: number
}

export interface BacktestRunCreate {
  strategy: BacktestStrategy
  start_date: string
  end_date: string
  initial_capital: number
  symbols?: string[] | null
  position_size_pct: number
  max_positions: number
  cost_config?: BacktestCostConfig | null
}

export interface BacktestRunResponse {
  id: string
  strategy_name: string
  strategy_json: Record<string, unknown>
  start_date: string
  end_date: string
  initial_capital: number
  symbol_count: number
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED"
  progress: number
  metrics: Record<string, number> | null
  equity_curve: Array<{ date: string; equity: number }> | null
  trades_summary: BacktestTrade[] | null
  error_message: string | null
  created_at: string
  completed_at: string | null
}

export interface BacktestRunSummary {
  id: string
  strategy_name: string
  start_date: string
  end_date: string
  status: string
  progress: number
  total_return: number | null
  mdd: number | null
  win_rate: number | null
  total_trades: number | null
  created_at: string
}

export interface TradeConditionResult {
  condition: string
  column: string
  actual: number | null
  met: boolean
}

export interface BacktestTrade {
  symbol: string
  name?: string
  entry_date: string
  exit_date: string
  entry_price: number
  exit_price: number
  qty: number
  pnl: number
  pnl_pct: number
  holding_days: number
  scale_step?: string
  conviction?: number
  entry_reason?: TradeConditionResult[] | null
  exit_reason?: string
  exit_reason_detail?: TradeConditionResult[] | null
  entry_snapshot?: Record<string, number> | null
  exit_snapshot?: Record<string, number> | null
}

export interface StrategyPreset {
  name: string
  description: string
  strategy: BacktestStrategy
}

export interface AIStrategyResponse {
  strategy: BacktestStrategy
  explanation: string
}

// ── 실거래 ──────────────────────────────────────────────

export interface TradingContext {
  id: string
  mode: "paper" | "real"
  strategy: Record<string, unknown>
  strategy_name: string
  position_sizing: Record<string, unknown>
  scaling: Record<string, unknown> | null
  risk_management: Record<string, unknown> | null
  cost_config: {
    buy_commission: number
    sell_commission: number
    slippage_pct: number
  }
  initial_capital: number
  position_size_pct: number
  max_positions: number
  symbols: string[]
  created_at: string
  source_backtest_id: string | null
}

export interface TradingSession {
  id: string
  context_id: string
  mode: string
  strategy_name: string
  status: "running" | "stopped" | "error"
  positions: Record<string, { symbol: string; qty: number; avg_price: number }>
  trade_count: number
  error_message: string
  started_at: string
  stopped_at: string
}

export interface TradeLog {
  symbol: string
  name?: string
  side: "BUY" | "SELL"
  step: string
  qty: number
  price: number
  success: boolean
  order_id: string
  message: string
  timestamp: string
  reason?: string
  snapshot?: Record<string, number> | null
  pnl_pct?: number | null
  pnl_amount?: number | null
  holding_minutes?: number | null
}

export interface KISBalance {
  positions: Array<{
    symbol: string
    name: string
    qty: number
    avg_price: number
    current_price: number
    pnl: number
    pnl_pct: number
  }>
  account: {
    total_eval: number
    total_pnl: number
    cash: number
    total_deposit: number
  }
}

export interface KISOrder {
  order_id: string
  symbol: string
  name: string
  side: "BUY" | "SELL"
  price: number
  qty: number
  order_qty: number
  status: string
  order_time: string
}
