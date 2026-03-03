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
