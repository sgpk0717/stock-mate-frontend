import { apiFetch } from "./client"
import type {
  AlphaFactor,
  AlphaFactoryStartRequest,
  AlphaFactoryStatus,
  AlphaMineRequest,
  AlphaMineResponse,
  AlphaMiningRun,
  AlphaMiningRunSummary,
  AlphaFactorBacktestRequest,
  CausalValidationResponse,
  CompositeFactorBuildRequest,
  CompositeFactorResponse,
  CorrelationMatrix,
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
}): Promise<AlphaFactor[]> {
  const query = new URLSearchParams()
  if (params?.status) query.set("status", params.status)
  if (params?.min_ic !== undefined)
    query.set("min_ic", String(params.min_ic))

  const qs = query.toString()
  return apiFetch<AlphaFactor[]>(`/alpha/factors${qs ? `?${qs}` : ""}`)
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
