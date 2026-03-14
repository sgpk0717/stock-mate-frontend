import { apiFetch } from "./client"
import type {
  WorkflowStatus,
  WorkflowRun,
  WorkflowEvent,
  BestFactor,
  WorkflowTriggerResponse,
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
