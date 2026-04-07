import type {
  KISBalance,
  KISOrder,
  TradeLog,
  TradingContext,
  TradingSession,
} from "@/types"
import { apiFetch } from "./client"

// ── Context ──────────────────────────────────────────────

export async function createTradingContext(
  data: Omit<TradingContext, "id" | "created_at">,
): Promise<TradingContext> {
  return apiFetch<TradingContext>("/trading/context", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function createContextFromBacktest(
  run: Record<string, unknown>,
  mode: "paper" | "real" = "paper",
): Promise<TradingContext> {
  return apiFetch<TradingContext>("/trading/context/from-backtest", {
    method: "POST",
    body: JSON.stringify({ run, mode }),
  })
}

export async function fetchTradingContexts(): Promise<TradingContext[]> {
  return apiFetch<TradingContext[]>("/trading/contexts")
}

export async function fetchTradingContext(
  contextId: string,
): Promise<TradingContext> {
  return apiFetch<TradingContext>(`/trading/context/${contextId}`)
}

export async function deleteTradingContext(contextId: string): Promise<void> {
  const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8007"
  const response = await fetch(`${API_URL}/trading/context/${contextId}`, {
    method: "DELETE",
  })
  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`)
  }
}

// ── 세션 (실거래 실행) ────────────────────────────────────

export async function startTrading(
  contextId: string,
): Promise<TradingSession> {
  return apiFetch<TradingSession>(
    `/trading/start?context_id=${contextId}`,
    { method: "POST" },
  )
}

export async function stopTrading(
  sessionId: string,
): Promise<TradingSession> {
  return apiFetch<TradingSession>(
    `/trading/stop?session_id=${sessionId}`,
    { method: "POST" },
  )
}

export async function fetchTradingStatus(): Promise<TradingSession[]> {
  return apiFetch<TradingSession[]>("/trading/status")
}

// ── 자동매매 수동중단 ──

export async function fetchTradingAutoStart(): Promise<{ user_stopped: boolean }> {
  return apiFetch<{ user_stopped: boolean }>("/trading/auto-start")
}

export async function setTradingAutoStart(enabled: boolean): Promise<{ user_stopped: boolean }> {
  return apiFetch<{ user_stopped: boolean }>(`/trading/auto-start?enabled=${enabled}`, {
    method: "PUT",
  })
}

export async function fetchTradingSession(
  sessionId: string,
): Promise<TradingSession> {
  return apiFetch<TradingSession>(`/trading/session/${sessionId}`)
}

export async function fetchSessionTrades(
  sessionId: string,
): Promise<TradeLog[]> {
  return apiFetch<TradeLog[]>(`/trading/session/${sessionId}/trades`)
}

// ── KIS 직접 조회 ────────────────────────────────────────

export async function fetchKISBalance(
  isMock = true,
): Promise<KISBalance> {
  return apiFetch<KISBalance>(`/trading/accounts?is_mock=${isMock}`)
}

export async function fetchKISOrders(
  isMock = true,
): Promise<KISOrder[]> {
  return apiFetch<KISOrder[]>(`/trading/orders?is_mock=${isMock}`)
}

// ── 알파 스코어 랭킹 ────────────────────────────────────

export interface AlphaCandidate {
  symbol: string
  name: string
  score: number
  close: string
  rsi: string
  volume_ratio: string
  delta_to_buy?: number
  delta_to_sell?: number
}

export interface AlphaRanking {
  buy_candidates: AlphaCandidate[]
  sell_candidates: AlphaCandidate[]
  updated_at: string
  version: number
  scored_count: number
}

export async function fetchAlphaRanking(
  topN: number = 10,
): Promise<AlphaRanking> {
  return apiFetch<AlphaRanking>(`/trading/alpha-ranking?top_n=${topN}`)
}

export interface FactorRanking {
  factor_id: string
  factor_name: string
  interval: string
  buy_candidates: AlphaCandidate[]
  sell_candidates: AlphaCandidate[]
  scored_count: number
}

export interface AlphaRankingByFactor {
  factors: FactorRanking[]
  updated_at: string
  version: number
}

export async function fetchAlphaRankingByFactor(
  topN: number = 10,
): Promise<AlphaRankingByFactor> {
  return apiFetch<AlphaRankingByFactor>(`/trading/alpha-ranking/by-factor?top_n=${topN}`)
}

// ── 의사결정 로그 (모니터링) ────────────────────────────

export interface DecisionLog {
  timestamp: string
  symbol: string
  name: string
  action: string
  reason: string
  signal: number
  conditions?: Record<string, unknown>
  snapshot?: Record<string, unknown>
  sizing?: Record<string, unknown>
  risk?: Record<string, unknown>
}

export async function fetchSessionDecisions(
  sessionId: string,
  opts?: { action?: string; symbol?: string; limit?: number },
): Promise<DecisionLog[]> {
  const params = new URLSearchParams()
  if (opts?.action) params.set("action", opts.action)
  if (opts?.symbol) params.set("symbol", opts.symbol)
  if (opts?.limit) params.set("limit", String(opts.limit))
  const qs = params.toString()
  return apiFetch<DecisionLog[]>(
    `/trading/session/${sessionId}/decisions${qs ? `?${qs}` : ""}`,
  )
}

// ── 일자별 매매 히스토리 ────────────────────────────────

export async function fetchTradingDayDetail(
  date: string,
): Promise<{
  date: string
  trade_count: number
  trades: Array<{
    id: string
    context_id: string
    symbol: string
    side: string
    step: string
    qty: number
    price: number
    pnl_pct: number | null
    pnl_amount: number | null
    holding_minutes: number | null
    executed_at: string | null
  }>
}> {
  return apiFetch(`/trading/history/${date}`)
}
