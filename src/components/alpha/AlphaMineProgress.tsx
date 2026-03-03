import { useState, useCallback } from "react"
import type { AlphaMiningRun, IterationLog, MiningLogSummary } from "@/types/alpha"
import { useAlphaMiningLogs } from "@/hooks/queries/use-alpha"
import { useAlphaMiningStream } from "@/hooks/use-websocket"
import AlphaMiningLog from "@/components/alpha/AlphaMiningLog"
import AlphaFailureAnalysis from "@/components/alpha/AlphaFailureAnalysis"

interface AlphaMineProgressProps {
  run: AlphaMiningRun | null
}

function AlphaMineProgress({ run }: AlphaMineProgressProps) {
  const [showLog, setShowLog] = useState(false)
  const [wsIterations, setWsIterations] = useState<IterationLog[]>([])
  const [wsSummary, setWsSummary] = useState<MiningLogSummary | null>(null)

  const isRunning = run?.status === "RUNNING" || run?.status === "PENDING"
  const isFailed = run?.status === "FAILED"
  const isCompleted = run?.status === "COMPLETED"

  // 실시간 WS 스트리밍 (RUNNING 상태에서만)
  const handleWsEvent = useCallback((event: Record<string, unknown>) => {
    const type = event.type as string

    if (type === "iteration_complete") {
      const itLog: IterationLog = {
        iteration: event.iteration as number,
        hypothesis: event.hypothesis as string,
        attempts: (event.attempts ?? []) as IterationLog["attempts"],
        discovered_factor_name: (event.discovered_factor_name ?? null) as string | null,
      }
      setWsIterations((prev) => [...prev, itLog])
    }

    if (type === "mining_summary") {
      setWsSummary(event as unknown as MiningLogSummary)
    }
  }, [])

  useAlphaMiningStream(
    isRunning && run ? run.id : null,
    handleWsEvent,
  )

  // 완료 후: REST로 저장된 로그 로드
  const { data: savedLogs } = useAlphaMiningLogs(
    isCompleted && run?.has_logs ? run.id : null,
  )

  // 표시할 데이터 결정: WS 실시간 > REST 저장 로그
  const iterations = wsIterations.length > 0
    ? wsIterations
    : savedLogs?.iterations ?? []
  const summary = wsSummary ?? savedLogs?.summary ?? null

  // IC threshold 추출
  const icThreshold = (run?.config as Record<string, unknown>)?.ic_threshold as number | undefined

  if (!run) return null

  return (
    <div className="space-y-3">
      <div className="rounded-lg border p-4">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold">
            {run.name}
          </h3>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              isCompleted
                ? "bg-green-100 text-green-700"
                : isFailed
                  ? "bg-red-100 text-red-700"
                  : "bg-yellow-100 text-yellow-700"
            }`}
          >
            {run.status}
          </span>
        </div>

        {isRunning && (
          <div className="mt-2">
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{ width: `${run.progress}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {run.progress}%
            </p>
          </div>
        )}

        {isCompleted && (
          <p className="mt-1 text-xs text-muted-foreground">
            {run.factors_found}개 팩터 발견 / {run.total_evaluated}개 평가
          </p>
        )}

        {isFailed && run.error_message && (
          <p className="mt-1 text-xs text-red-600">{run.error_message}</p>
        )}

        {/* 상세 로그 토글 */}
        {(iterations.length > 0 || isRunning) && (
          <button
            onClick={() => setShowLog((v) => !v)}
            className="mt-2 text-xs text-muted-foreground underline hover:text-foreground"
          >
            {showLog ? "상세 로그 닫기" : "상세 로그 보기"}
          </button>
        )}
      </div>

      {/* 접히는 로그 패널 */}
      {showLog && iterations.length > 0 && (
        <AlphaMiningLog
          iterations={iterations}
          summary={summary}
          icThreshold={icThreshold}
        />
      )}

      {/* 팩터 0개 + 완료 시 실패 분석 */}
      {isCompleted && run.factors_found === 0 && summary && (
        <AlphaFailureAnalysis
          summary={summary}
          icThreshold={icThreshold ?? 0.03}
        />
      )}
    </div>
  )
}

export default AlphaMineProgress
