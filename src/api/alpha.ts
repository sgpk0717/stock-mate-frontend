import { apiFetch } from "./client"
import type {
  AlphaFactor,
  AlphaFactorPage,
  AlphaFactoryStartRequest,
  AlphaFactoryStatus,
  AlphaMineRequest,
  AlphaMineResponse,
  AlphaMiningRun,
  AlphaMiningRunSummary,
  AlphaFactorBacktestRequest,
  AutoOptimizeJobResponse,
  AutoOptimizeRequest,
  AutoOptimizeResponse,
  AutoOptimizeStatusResponse,
  CausalSweepResponse,
  CausalValidationJob,
  CausalValidationProgress,
  CausalValidationResponse,
  CompositeFactorBuildRequest,
  CompositeFactorResponse,
  CorrelationMatrix,
  DataAvailability,
  ImprovementHistory,
  MiningIterationLogs,
  MiningReport,
  MiningReportsRange,
  UniverseOption,
} from "@/types/alpha"

export async function fetchUniverses(): Promise<UniverseOption[]> {
  return apiFetch<UniverseOption[]>("/alpha/universes")
}

export async function startAlphaMining(
  data: AlphaMineRequest,
): Promise<AlphaMineResponse> {
  return apiFetch<AlphaMineResponse>("/alpha/mine", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function fetchMiningRun(runId: string): Promise<AlphaMiningRun> {
  return apiFetch<AlphaMiningRun>(`/alpha/mine/${runId}`)
}

export async function fetchMiningRuns(): Promise<AlphaMiningRunSummary[]> {
  return apiFetch<AlphaMiningRunSummary[]>("/alpha/mines")
}

export async function fetchMiningLogs(
  runId: string,
): Promise<MiningIterationLogs> {
  return apiFetch<MiningIterationLogs>(`/alpha/mine/${runId}/logs`)
}

export async function deleteMiningRun(runId: string): Promise<void> {
  const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8007"
  const response = await fetch(`${API_URL}/alpha/mine/${runId}`, {
    method: "DELETE",
  })
  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`)
  }
}

export async function fetchAlphaFactors(params?: {
  status?: string
  min_ic?: number
  causal_robust?: boolean
  interval?: string
  search?: string
  sort_by?: string
  order?: string
  offset?: number
  limit?: number
}): Promise<AlphaFactorPage> {
  const query = new URLSearchParams()
  if (params?.status) query.set("status", params.status)
  if (params?.min_ic !== undefined)
    query.set("min_ic", String(params.min_ic))
  if (params?.causal_robust !== undefined)
    query.set("causal_robust", String(params.causal_robust))
  if (params?.interval) query.set("interval", params.interval)
  if (params?.search) query.set("search", params.search)
  if (params?.sort_by) query.set("sort_by", params.sort_by)
  if (params?.order) query.set("order", params.order)
  if (params?.offset !== undefined)
    query.set("offset", String(params.offset))
  if (params?.limit !== undefined)
    query.set("limit", String(params.limit))

  const qs = query.toString()
  return apiFetch<AlphaFactorPage>(`/alpha/factors${qs ? `?${qs}` : ""}`)
}

export async function fetchAlphaFactor(factorId: string): Promise<AlphaFactor> {
  return apiFetch<AlphaFactor>(`/alpha/factor/${factorId}`)
}

export async function deleteAlphaFactor(factorId: string): Promise<void> {
  const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8007"
  const response = await fetch(`${API_URL}/alpha/factor/${factorId}`, {
    method: "DELETE",
  })
  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`)
  }
}

export async function deleteAlphaFactorsBatch(factorIds: string[]): Promise<void> {
  const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8007"
  const response = await fetch(`${API_URL}/alpha/factors/delete-batch`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ factor_ids: factorIds }),
  })
  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`)
  }
}

export interface PruneFactorsParams {
  max_per_interval: number
  dry_run?: boolean
}

export interface PruneFactorsResult {
  dry_run: boolean
  max_per_interval: number
  total_pruned: number
  intervals: Record<
    string,
    {
      before: number
      after: number
      pruned: number
      causal_kept?: number
      niche_distribution?: Record<string, number>
      note?: string
    }
  >
}

export async function pruneFactors(
  params: PruneFactorsParams,
): Promise<PruneFactorsResult> {
  const query = new URLSearchParams()
  query.set("max_per_interval", String(params.max_per_interval))
  if (params.dry_run !== undefined) query.set("dry_run", String(params.dry_run))
  return apiFetch<PruneFactorsResult>(`/alpha/factors/prune?${query}`, {
    method: "POST",
  })
}

export async function startCausalValidationBatch(
  factorIds: string[],
): Promise<CausalValidationJob> {
  return apiFetch<CausalValidationJob>(
    "/alpha/factors/validate-batch",
    {
      method: "POST",
      body: JSON.stringify({ factor_ids: factorIds }),
    },
  )
}

export async function fetchCausalValidationStatus(
  jobId: string,
  sinceIdx: number = 0,
): Promise<CausalValidationProgress> {
  return apiFetch<CausalValidationProgress>(
    `/alpha/validate/${jobId}/status?since_idx=${sinceIdx}`,
  )
}

export async function cancelCausalValidation(
  jobId: string,
): Promise<{ cancelled: boolean }> {
  return apiFetch<{ cancelled: boolean }>(
    `/alpha/validate/${jobId}/cancel`,
    { method: "POST" },
  )
}

export async function backtestWithFactor(
  factorId: string,
  data: AlphaFactorBacktestRequest,
): Promise<{ backtest_run_id: string }> {
  return apiFetch<{ backtest_run_id: string }>(
    `/alpha/factor/${factorId}/backtest`,
    {
      method: "POST",
      body: JSON.stringify(data),
    },
  )
}

export async function validateFactor(
  factorId: string,
): Promise<CausalValidationResponse> {
  return apiFetch<CausalValidationResponse>(
    `/alpha/factor/${factorId}/validate`,
    { method: "POST" },
  )
}

// Factor AI Chat

export interface FactorChatCreateResponse {
  session_id: string
  source_factor_id: string
  source_expression: string
  universe: string
  interval: string
  status: string
}

export interface FactorChatMessageResponse {
  role: string
  content: string
  timestamp: string
  factor_draft?: Record<string, unknown> | null
  current_expression?: string | null
  current_metrics?: Record<string, number> | null
}

export interface FactorChatSession {
  session_id: string
  messages: Array<{
    role: string
    content: string
    timestamp: string
    factor_draft?: Record<string, unknown> | null
  }>
  source_factor_id: string
  source_expression: string
  current_expression?: string | null
  current_metrics?: Record<string, number> | null
  universe: string
  interval: string
  status: string
  created_at: string
  updated_at: string
}

export async function createFactorChat(
  factorId: string,
): Promise<FactorChatCreateResponse> {
  return apiFetch<FactorChatCreateResponse>(
    `/alpha/factor/${factorId}/chat`,
    { method: "POST" },
  )
}

export async function sendFactorChatMessage(
  sessionId: string,
  message: string,
): Promise<FactorChatMessageResponse> {
  return apiFetch<FactorChatMessageResponse>(
    `/alpha/factor/chat/${sessionId}/message`,
    {
      method: "POST",
      body: JSON.stringify({ message }),
    },
  )
}

export async function fetchFactorChatSession(
  sessionId: string,
): Promise<FactorChatSession> {
  return apiFetch<FactorChatSession>(`/alpha/factor/chat/${sessionId}`)
}

export async function saveFactorFromChat(
  sessionId: string,
): Promise<AlphaFactor> {
  return apiFetch<AlphaFactor>(`/alpha/factor/chat/${sessionId}/save`, {
    method: "POST",
  })
}

export async function deleteFactorChat(sessionId: string): Promise<void> {
  const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8007"
  const response = await fetch(
    `${API_URL}/alpha/factor/chat/${sessionId}`,
    { method: "DELETE" },
  )
  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`)
  }
}

// Phase 3: Factory

export async function startFactory(
  data: AlphaFactoryStartRequest,
): Promise<AlphaFactoryStatus> {
  return apiFetch<AlphaFactoryStatus>("/alpha/factory/start", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function stopFactory(interval = "1d"): Promise<AlphaFactoryStatus> {
  return apiFetch<AlphaFactoryStatus>(`/alpha/factory/stop?interval=${interval}`, {
    method: "POST",
  })
}

export async function fetchFactoryStatus(interval = "1d"): Promise<AlphaFactoryStatus> {
  return apiFetch<AlphaFactoryStatus>(`/alpha/factory/status?interval=${interval}`)
}

export async function setFactoryAutoRestart(enabled: boolean): Promise<{ auto_restart: boolean }> {
  return apiFetch<{ auto_restart: boolean }>(`/alpha/factory/auto-restart?enabled=${enabled}`, {
    method: "PUT",
  })
}

// Phase 3: Portfolio

export async function buildComposite(
  data: CompositeFactorBuildRequest,
): Promise<CompositeFactorResponse> {
  return apiFetch<CompositeFactorResponse>("/alpha/portfolio/build", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function fetchCorrelation(
  factorIds: string[],
): Promise<CorrelationMatrix> {
  return apiFetch<CorrelationMatrix>("/alpha/portfolio/correlation", {
    method: "POST",
    body: JSON.stringify({ factor_ids: factorIds }),
  })
}

export async function startAutoOptimize(
  data?: AutoOptimizeRequest,
): Promise<AutoOptimizeJobResponse> {
  return apiFetch<AutoOptimizeJobResponse>("/alpha/portfolio/auto-optimize", {
    method: "POST",
    body: JSON.stringify(data ?? {}),
  })
}

export async function fetchAutoOptimizeStatus(
  jobId: string,
): Promise<AutoOptimizeStatusResponse> {
  return apiFetch<AutoOptimizeStatusResponse>(
    `/alpha/portfolio/auto-optimize/${jobId}`,
  )
}

export async function fetchCompositeFactor(
  factorId: string,
): Promise<AlphaFactor> {
  return apiFetch<AlphaFactor>(`/alpha/factors/${factorId}`)
}

export async function fetchCompositeFactors(): Promise<AlphaFactorPage> {
  return apiFetch<AlphaFactorPage>("/alpha/factors?factor_type=composite&limit=50")
}

export async function fetchImprovementHistory(): Promise<ImprovementHistory> {
  return apiFetch<ImprovementHistory>("/alpha/improvement-history")
}

export async function getDataAvailability(interval: string): Promise<DataAvailability> {
  return apiFetch<DataAvailability>(`/alpha/data-availability?interval=${interval}`)
}

export async function fetchMiningReport(interval = "1d"): Promise<MiningReport> {
  return apiFetch<MiningReport>(`/alpha/mining-report?interval=${interval}`)
}

export async function fetchMiningReports(params: {
  interval?: string
  gen_from?: number
  gen_to?: number
  date_from?: string
  date_to?: string
}): Promise<MiningReportsRange> {
  const qs = new URLSearchParams()
  if (params.interval) qs.set("interval", params.interval)
  if (params.gen_from != null) qs.set("gen_from", String(params.gen_from))
  if (params.gen_to != null) qs.set("gen_to", String(params.gen_to))
  if (params.date_from) qs.set("date_from", params.date_from)
  if (params.date_to) qs.set("date_to", params.date_to)
  return apiFetch(`/alpha/mining-reports?${qs}`)
}

// [2026-03-31] 딥리서치 R1+R2 공통 권장 — 메가알파 앙상블 API
// 프로세스: /deep-research → 2건 보고서 교차 분석
// 변경/추가: 인과검증 통과 팩터를 자동 직교화 + 가중 결합하는 메가알파 빌드/상태 조회

export async function buildMegaAlpha(
  interval = "1d",
  minIcir = 0.3,
): Promise<{ status: string; total_candidates: number; job_id: string }> {
  return apiFetch(
    `/alpha/mega-alpha/build?interval=${interval}&min_icir=${minIcir}`,
    { method: "POST" },
  )
}

export async function fetchMegaAlphaStatus(): Promise<{
  status: string
  total_candidates?: number
  selected?: number
  current_step?: string
  logs?: string[]
  job_id?: string
  saved_factor_id?: string
  best_k?: number
  candidate_count?: number
}> {
  return apiFetch("/alpha/mega-alpha/status")
}

// ── Causal Sweep ──

export async function startCausalSweep(interval = "1d"): Promise<CausalSweepResponse> {
  return apiFetch(`/alpha/causal-sweep?interval=${interval}`, { method: "POST" })
}

export async function cancelCausalSweep(jobId: string, interval = "1d"): Promise<{ cancelled: boolean; factory_restarted: boolean }> {
  return apiFetch(`/alpha/causal-sweep/cancel?job_id=${jobId}&interval=${interval}`, { method: "POST" })
}
