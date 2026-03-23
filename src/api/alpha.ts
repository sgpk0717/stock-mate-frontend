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
  CausalValidationJob,
  CausalValidationProgress,
  CausalValidationResponse,
  CompositeFactorBuildRequest,
  CompositeFactorResponse,
  CorrelationMatrix,
  ImprovementHistory,
  MiningIterationLogs,
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
): Promise<CausalValidationProgress> {
  return apiFetch<CausalValidationProgress>(`/alpha/validate/${jobId}/status`)
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

export async function stopFactory(): Promise<AlphaFactoryStatus> {
  return apiFetch<AlphaFactoryStatus>("/alpha/factory/stop", {
    method: "POST",
  })
}

export async function fetchFactoryStatus(): Promise<AlphaFactoryStatus> {
  return apiFetch<AlphaFactoryStatus>("/alpha/factory/status")
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
