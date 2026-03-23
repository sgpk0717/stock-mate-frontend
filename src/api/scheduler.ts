import { apiFetch } from "./client"

export interface ManualTriggerRequest {
  collector: string
  mode: "single" | "range" | "recent"
  date?: string
  date_from?: string
  date_to?: string
  recent_days?: number
}

export interface ManualTriggerResponse {
  job_id: string
  collector: string
  dates: string[]
  message: string
}

export interface ActiveJob {
  job_id: string
  collector: string
  status: "running" | "cancelling" | "cancelled" | "completed" | "failed"
  dates: string[]
  current_date: string | null
  date_progress: number
  date_total: number
  total: number
  completed: number
  failed: number
  started_at: string | null
  completed_at: string | null
  error: string | null
  source: "manual" | "auto"
  logs: string[]
}

export async function triggerCollect(req: ManualTriggerRequest): Promise<ManualTriggerResponse> {
  return apiFetch("/scheduler/collect", { method: "POST", body: JSON.stringify(req) })
}

export async function fetchActiveJobs(): Promise<ActiveJob[]> {
  return apiFetch("/scheduler/jobs")
}

export async function cancelJob(jobId: string): Promise<{ success: boolean; message: string }> {
  return apiFetch(`/scheduler/jobs/${jobId}/cancel`, { method: "POST" })
}
