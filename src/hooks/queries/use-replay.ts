import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState, useEffect, useCallback } from "react"
import { startReplay, fetchReplayStatus, fetchReplayHistory } from "@/api/replay"
import type { ReplayRequest, ReplayResult } from "@/types/replay"

// ── Replay 실행 + 폴링 훅 ───────────────────────────────

export function useReplay() {
  const qc = useQueryClient()
  const [runId, setRunId] = useState<string | null>(null)
  const [status, setStatus] = useState<"idle" | "running" | "completed" | "failed">("idle")
  const [progress, setProgress] = useState("")
  const [result, setResult] = useState<ReplayResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  // 폴링
  useEffect(() => {
    if (!runId || status !== "running") return

    const interval = setInterval(async () => {
      try {
        const res = await fetchReplayStatus(runId)
        if (res.status === "COMPLETED") {
          setStatus("completed")
          setResult(res.result ?? null)
          setRunId(null)
          qc.invalidateQueries({ queryKey: ["replay-history"] })
        } else if (res.status === "FAILED") {
          setStatus("failed")
          setError(res.error ?? "리플레이 실패")
          setRunId(null)
        } else {
          setProgress(res.progress ?? "실행 중...")
        }
      } catch {
        // 네트워크 에러는 무시, 다음 폴링에서 재시도
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [runId, status, qc])

  const execute = useCallback(async (req: ReplayRequest) => {
    setStatus("running")
    setProgress("시작 중...")
    setResult(null)
    setError(null)
    try {
      const res = await startReplay(req)
      setRunId(res.run_id)
    } catch (e) {
      setStatus("failed")
      setError(e instanceof Error ? e.message : "요청 실패")
    }
  }, [])

  const reset = useCallback(() => {
    setStatus("idle")
    setRunId(null)
    setResult(null)
    setError(null)
    setProgress("")
  }, [])

  return { execute, reset, status, progress, result, error, isRunning: status === "running" }
}

// ── Replay 히스토리 조회 ─────────────────────────────────

export function useReplayHistory(limit: number = 20) {
  return useQuery({
    queryKey: ["replay-history", limit],
    queryFn: () => fetchReplayHistory(limit),
    staleTime: 30_000,
  })
}
