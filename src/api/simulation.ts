import { apiFetch } from "./client"
import type {
  CustomScenarioResponse,
  GovernanceRules,
  McpAuditLog,
  McpStatus,
  McpTool,
  ScenarioPreset,
  StressTestRequest,
  StressTestResponse,
  StressTestRunResponse,
  StressTestRunSummary,
} from "@/types/simulation"

// ── Simulation ───────────────────────────────────────────

export async function startStressTest(
  data: StressTestRequest,
): Promise<StressTestResponse> {
  return apiFetch<StressTestResponse>("/simulation/stress-test", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function fetchStressTest(
  id: string,
): Promise<StressTestRunResponse> {
  return apiFetch<StressTestRunResponse>(`/simulation/stress-test/${id}`)
}

export async function fetchStressTests(
  limit: number = 20,
): Promise<StressTestRunSummary[]> {
  return apiFetch<StressTestRunSummary[]>(
    `/simulation/stress-tests?limit=${limit}`,
  )
}

export async function deleteStressTest(id: string): Promise<void> {
  const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8007"
  const response = await fetch(`${API_URL}/simulation/stress-test/${id}`, {
    method: "DELETE",
  })
  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`)
  }
}

export async function fetchScenarios(): Promise<ScenarioPreset[]> {
  return apiFetch<ScenarioPreset[]>("/simulation/scenarios")
}

export async function generateScenario(
  prompt: string,
): Promise<CustomScenarioResponse> {
  return apiFetch<CustomScenarioResponse>("/simulation/scenario/generate", {
    method: "POST",
    body: JSON.stringify({ prompt }),
  })
}

// ── MCP ──────────────────────────────────────────────────

export async function fetchMcpStatus(): Promise<McpStatus> {
  return apiFetch<McpStatus>("/mcp/status")
}

export async function fetchMcpTools(): Promise<McpTool[]> {
  return apiFetch<McpTool[]>("/mcp/tools")
}

export async function fetchMcpAudit(params?: {
  limit?: number
  tool_name?: string
}): Promise<McpAuditLog[]> {
  const query = new URLSearchParams()
  if (params?.limit) query.set("limit", String(params.limit))
  if (params?.tool_name) query.set("tool_name", params.tool_name)
  const qs = query.toString()
  return apiFetch<McpAuditLog[]>(`/mcp/audit${qs ? `?${qs}` : ""}`)
}

export async function updateGovernance(
  rules: Partial<GovernanceRules>,
): Promise<GovernanceRules> {
  return apiFetch<GovernanceRules>("/mcp/governance", {
    method: "PUT",
    body: JSON.stringify(rules),
  })
}
