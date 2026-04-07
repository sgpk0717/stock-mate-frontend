import { apiFetch } from "./client"

export interface TopologyNode {
  status: "healthy" | "unhealthy" | "unknown"
  [key: string]: unknown
}

export interface TopologyEdge {
  from: string
  to: string
  label: string
  type: "read" | "write" | "command" | "event" | "sse"
}

export interface TopologyEvent {
  type: "telegram" | "mcp" | "trade"
  ts: string
  [key: string]: unknown
}

export interface TopologyData {
  timestamp: string
  nodes: Record<string, TopologyNode>
  edges: TopologyEdge[]
  events: TopologyEvent[]
}

export async function fetchTopology(): Promise<TopologyData> {
  return apiFetch<TopologyData>("/system/topology")
}

// ── 수집기 모니터링 ──

export interface CollectorInfo {
  name: string
  type: "realtime" | "batch"
  interval: string
  status: string
  last_at?: string
  last_count?: number
  symbols_total?: number
  next_at?: string
  error?: string
  // realtime 전용
  success?: number
  failed?: number
  daily_rounds?: number
  // batch 전용
  total?: number
  completed?: number
  last_run_date?: string
  next_run_at?: string
}

export interface CollectorsData {
  timestamp: string
  scheduler_running: boolean
  collectors: Record<string, CollectorInfo>
}

export async function fetchCollectors(): Promise<CollectorsData> {
  return apiFetch<CollectorsData>("/system/collectors")
}

export async function restartCollector(
  collectorId: string,
): Promise<{ success: boolean; message: string }> {
  return apiFetch(`/system/collectors/${collectorId}/restart`, {
    method: "POST",
  })
}

// ── LLM 사용량 모니터링 ──

export interface LLMUsageAgg {
  caller?: string
  provider?: string
  model?: string
  date?: string
  total_calls: number
  total_input_tokens: number
  total_output_tokens: number
  total_tokens: number
  total_cost_usd: number
  avg_duration_ms: number
}

export interface LLMUsageLog {
  id: string
  caller: string
  provider: string
  model: string
  input_tokens: number
  output_tokens: number
  total_tokens: number
  cost_usd: number | null
  status: string
  error: string | null
  duration_ms: number | null
  created_at: string | null
}

export async function fetchLLMUsage(params?: {
  days?: number
  caller?: string
  provider?: string
  group_by?: string
}): Promise<LLMUsageAgg[]> {
  const qs = new URLSearchParams()
  if (params?.days) qs.set("days", String(params.days))
  if (params?.caller) qs.set("caller", params.caller)
  if (params?.provider) qs.set("provider", params.provider)
  if (params?.group_by) qs.set("group_by", params.group_by)
  const q = qs.toString()
  return apiFetch<LLMUsageAgg[]>(`/system/llm-usage${q ? `?${q}` : ""}`)
}

export async function fetchLLMUsageRecent(limit = 50): Promise<LLMUsageLog[]> {
  return apiFetch<LLMUsageLog[]>(`/system/llm-usage/recent?limit=${limit}`)
}

export interface LLMUsageDailyItem {
  date: string
  calls: number
  tokens: number
  cost_usd: number
  input_tokens: number
  output_tokens: number
}

export interface LLMUsageCallerItem {
  caller: string
  calls: number
  tokens: number
  cost_usd: number
  avg_ms: number
}

export interface LLMUsageProviderItem {
  provider: string
  calls: number
  tokens: number
  cost_usd: number
}

export interface LLMUsageModelItem {
  model: string
  provider: string
  calls: number
  tokens: number
  cost_usd: number
}

export interface LLMUsageSummary {
  period: { start: string; end: string }
  totals: {
    calls: number
    input_tokens: number
    output_tokens: number
    total_tokens: number
    cost_usd: number
    avg_duration_ms: number
    error_count: number
  }
  daily: LLMUsageDailyItem[]
  by_caller: LLMUsageCallerItem[]
  by_provider: LLMUsageProviderItem[]
  by_model: LLMUsageModelItem[]
}

export async function fetchLLMUsageSummary(params?: {
  start?: string
  end?: string
  days?: number
}): Promise<LLMUsageSummary> {
  const qs = new URLSearchParams()
  if (params?.start) qs.set("start", params.start)
  if (params?.end) qs.set("end", params.end)
  if (params?.days) qs.set("days", String(params.days))
  const q = qs.toString()
  return apiFetch<LLMUsageSummary>(`/system/llm-usage/summary${q ? `?${q}` : ""}`)
}
