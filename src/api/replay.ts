import type {
  ReplayHistoryItem,
  ReplayRequest,
  ReplayResult,
} from "@/types/replay"
import { apiFetch } from "./client"

// ── Replay 실행 (비동기 — run_id 반환) ─────────────────────

export async function startReplay(
  data: ReplayRequest,
): Promise<{ run_id: string; status: string }> {
  return apiFetch<{ run_id: string; status: string }>("/trading/replay", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

// ── Replay 상태 폴링 ──────────────────────────────────────

export interface ReplayStatusResponse {
  status: "RUNNING" | "COMPLETED" | "FAILED"
  progress?: string
  result?: ReplayResult
  error?: string
}

export async function fetchReplayStatus(
  runId: string,
): Promise<ReplayStatusResponse> {
  return apiFetch<ReplayStatusResponse>(`/trading/replay/status/${runId}`)
}

// ── Replay 히스토리 조회 ─────────────────────────────────

export async function fetchReplayHistory(
  limit: number = 20,
): Promise<ReplayHistoryItem[]> {
  return apiFetch<ReplayHistoryItem[]>(
    `/trading/replay/history?limit=${limit}`,
  )
}

// ── Replay 상세 조회 ─────────────────────────────────────

export async function fetchReplayDetail(
  runId: string,
): Promise<ReplayResult> {
  return apiFetch<ReplayResult>(`/trading/replay/${runId}`)
}
