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
