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
