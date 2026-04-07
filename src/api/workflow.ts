import { apiFetch } from "./client"
import type {
  WorkflowStatus,
  WorkflowRun,
  WorkflowEvent,
  BestFactor,
  WorkflowTriggerResponse,
  MiningConfig,
} from "@/types/workflow"

export async function fetchWorkflowStatus(): Promise<WorkflowStatus> {
  return apiFetch<WorkflowStatus>("/workflow/status")
}

export async function triggerWorkflowPhase(
  phase: string,
): Promise<WorkflowTriggerResponse> {
  return apiFetch<WorkflowTriggerResponse>("/workflow/trigger", {
    method: "POST",
    body: JSON.stringify({ phase }),
  })
}

export async function fetchWorkflowHistory(
  limit = 30,
): Promise<WorkflowRun[]> {
  return apiFetch<WorkflowRun[]>(`/workflow/history?limit=${limit}`)
}

export async function fetchWorkflowEvents(
  runId: string,
  limit = 100,
): Promise<WorkflowEvent[]> {
  return apiFetch<WorkflowEvent[]>(`/workflow/events/${runId}?limit=${limit}`)
}

export async function fetchBestFactors(): Promise<BestFactor[]> {
  return apiFetch<BestFactor[]>("/workflow/best-factors")
}

export async function fetchMiningConfig(): Promise<MiningConfig> {
  return apiFetch<MiningConfig>("/workflow/mining-config")
}

export async function updateMiningConfig(interval: string): Promise<MiningConfig> {
  return apiFetch<MiningConfig>("/workflow/mining-config", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ interval }),
  })
}
