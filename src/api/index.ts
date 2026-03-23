import type {
  Account,
  AIStrategyResponse,
  BacktestRunCreate,
  BacktestRunResponse,
  BacktestRunSummary,
  CandleData,
  CandleWithIndicators,
  Order,
  OrderCreate,
  Position,
  StockInfo,
  StrategyPreset,
  TickDataPoint,
} from "@/types"
import { apiFetch } from "./client"

// ── 계좌 ────────────────────────────────────────────────────
export async function fetchAccount(id: number): Promise<Account> {
  return apiFetch<Account>(`/accounts/${id}`)
}

// ── 포지션 ──────────────────────────────────────────────────
export async function fetchPositions(mode: string): Promise<Position[]> {
  return apiFetch<Position[]>(`/positions?mode=${mode}`)
}

// ── 주문 ────────────────────────────────────────────────────
export async function fetchOrders(params?: {
  mode?: string
  side?: string
  status?: string
}): Promise<Order[]> {
  const searchParams = new URLSearchParams()
  if (params?.mode) searchParams.set("mode", params.mode)
  if (params?.side) searchParams.set("side", params.side)
  if (params?.status) searchParams.set("status", params.status)
  const qs = searchParams.toString()
  return apiFetch<Order[]>(`/orders${qs ? `?${qs}` : ""}`)
}

export async function createOrder(data: OrderCreate): Promise<Order> {
  return apiFetch<Order>("/orders", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function cancelOrder(orderId: string): Promise<Order> {
  return apiFetch<Order>(`/orders/${orderId}/cancel`, {
    method: "PATCH",
  })
}

// ── 모의투자 ──────────────────────────────────────────────────
export async function fetchPaperOrders(params?: {
  status?: string
}): Promise<Order[]> {
  const searchParams = new URLSearchParams()
  if (params?.status) searchParams.set("status", params.status)
  const qs = searchParams.toString()
  return apiFetch<Order[]>(`/paper/orders${qs ? `?${qs}` : ""}`)
}

export async function createPaperOrder(
  data: Omit<OrderCreate, "mode">,
): Promise<Order> {
  return apiFetch<Order>("/paper/orders", {
    method: "POST",
    body: JSON.stringify({ ...data, mode: "PAPER" }),
  })
}

export async function cancelPaperOrder(orderId: string): Promise<Order> {
  return apiFetch<Order>(`/paper/orders/${orderId}/cancel`, {
    method: "PATCH",
  })
}

export async function fetchPaperPositions(): Promise<Position[]> {
  return apiFetch<Position[]>("/paper/positions")
}

export async function fetchPaperAccount(): Promise<Account> {
  return apiFetch<Account>("/paper/account")
}

export async function resetPaper(): Promise<void> {
  await apiFetch("/paper/reset", { method: "POST" })
}

// ── 종목 ────────────────────────────────────────────────────
export async function fetchStockList(): Promise<StockInfo[]> {
  return apiFetch<StockInfo[]>("/stocks")
}

export async function fetchTicks(
  symbol: string,
  limit = 1000,
): Promise<TickDataPoint[]> {
  return apiFetch<TickDataPoint[]>(
    `/stocks/${symbol}/ticks?limit=${limit}`,
  )
}

export async function fetchCandles(
  symbol: string,
  interval = "1d",
  count = 200,
  indicators?: string[],
): Promise<CandleData[] | CandleWithIndicators> {
  const params = new URLSearchParams({ interval, count: String(count) })
  if (indicators?.length) params.set("indicators", indicators.join(","))
  return apiFetch(`/stocks/${symbol}/candles?${params}`)
}

// ── 백테스트 ────────────────────────────────────────────────
export async function fetchStrategies(): Promise<StrategyPreset[]> {
  return apiFetch<StrategyPreset[]>("/backtest/strategies")
}

export async function generateAIStrategy(
  prompt: string,
): Promise<AIStrategyResponse> {
  return apiFetch<AIStrategyResponse>("/backtest/ai-strategy", {
    method: "POST",
    body: JSON.stringify({ prompt }),
  })
}

export async function startBacktest(
  data: BacktestRunCreate,
): Promise<BacktestRunResponse> {
  return apiFetch<BacktestRunResponse>("/backtest/run", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function fetchBacktestRun(
  runId: string,
): Promise<BacktestRunResponse> {
  return apiFetch<BacktestRunResponse>(`/backtest/run/${runId}`)
}

export async function fetchBacktestRuns(params?: {
  offset?: number
  limit?: number
  sort_by?: string
  order?: string
  status?: string
  search?: string
}): Promise<{ items: BacktestRunSummary[]; total: number }> {
  const query = new URLSearchParams()
  if (params?.offset !== undefined) query.set("offset", String(params.offset))
  if (params?.limit !== undefined) query.set("limit", String(params.limit))
  if (params?.sort_by) query.set("sort_by", params.sort_by)
  if (params?.order) query.set("order", params.order)
  if (params?.status) query.set("status", params.status)
  if (params?.search) query.set("search", params.search)
  const qs = query.toString()
  return apiFetch<{ items: BacktestRunSummary[]; total: number }>(
    `/backtest/runs${qs ? `?${qs}` : ""}`,
  )
}

export async function deleteBacktestRun(runId: string): Promise<void> {
  const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8007"
  const response = await fetch(`${API_URL}/backtest/run/${runId}`, {
    method: "DELETE",
  })
  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`)
  }
}

// ── 에이전트 ──────────────────────────────────────────────
export {
  createAgentSession,
  sendAgentMessage,
  fetchAgentSession,
  finalizeAgentStrategy,
  deleteAgentSession,
} from "./agents"

// ── 뉴스 ──────────────────────────────────────────────────
export {
  fetchSentiment,
  fetchArticles,
  triggerCollect,
  fetchSentimentBatch,
} from "./news"

// ── 섹터 ──────────────────────────────────────────────────
export {
  searchSectorStocks,
  fetchSectorList,
  fetchSectorStocks,
} from "./sector"

// ── 알파 마이닝 ──────────────────────────────────────────
export {
  startAlphaMining,
  fetchMiningRun,
  fetchMiningRuns,
  deleteMiningRun,
  fetchAlphaFactors,
  fetchAlphaFactor,
  deleteAlphaFactor,
  backtestWithFactor,
} from "./alpha"

// ── 실거래 ──────────────────────────────────────────────
export {
  createTradingContext,
  createContextFromBacktest,
  fetchTradingContexts,
  fetchTradingContext,
  deleteTradingContext,
  startTrading,
  stopTrading,
  fetchTradingStatus,
  fetchTradingSession,
  fetchSessionTrades,
  fetchKISBalance,
  fetchKISOrders,
} from "./trading"

// ── 시뮬레이션 + MCP ──────────────────────────────────────
export {
  startStressTest,
  fetchStressTest,
  fetchStressTests,
  deleteStressTest,
  fetchScenarios,
  generateScenario,
  fetchMcpStatus,
  fetchMcpTools,
  fetchMcpAudit,
  updateGovernance,
} from "./simulation"

// ── 텔레그램 ──────────────────────────────────────────────
export { fetchTelegramLogs } from "./telegram"

// ── 데이터 탐색 ──────────────────────────────────────────
export {
  fetchCollectionStatus,
  fetchInvestorTrading,
  fetchMarginShort,
  fetchDartFinancials,
  fetchProgramTrading,
  fetchCandleCoverage,
  fetchNewsExplorer,
  fetchDataGaps,
} from "./data-explorer"
