import { useState, useEffect, useRef } from "react"
import { useStartCausalSweep, useCancelCausalSweep, useCausalValidationStatus } from "@/hooks/queries/use-alpha"
import type { CausalLogEntry } from "@/types/alpha"

function getLogColor(step: string, message: string): string {
  if (step === "result") {
    return (message.includes("ROBUST") || message.includes("validated"))
      ? "text-green-600 font-medium"
      : "text-red-500 font-medium"
  }
  if (["placebo", "random_cause", "regime"].includes(step)) {
    return message.includes("PASS") ? "text-green-600" : "text-red-500"
  }
  if (step === "causal_running" || step === "ate_computed") return "text-green-700"
  return "text-muted-foreground"
}

function formatTime(ts: number): string {
  const d = new Date(ts * 1000)
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`
}

function SweepActivityLog({ logs }: { logs: CausalLogEntry[] }) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [logs.length])

  if (!logs.length) {
    return (
      <div className="text-[11px] text-gray-400 text-center py-3 select-none">
        데이터 로드 중... 잠시 후 검증 현황이 표시됩니다
      </div>
    )
  }

  return (
    <div ref={scrollRef} className="max-h-60 overflow-y-auto space-y-0.5 mt-2">
      {logs.map((log, i) => (
        <div key={i} className="flex gap-2 text-[11px] leading-relaxed">
          <span className="text-gray-500 shrink-0 w-12 text-right font-mono">{formatTime(log.ts)}</span>
          <span className={getLogColor(log.step, log.message)}>{log.message}</span>
        </div>
      ))}
    </div>
  )
}

export function CausalSweepPanel({ interval, pendingCount, isFactoryRunning, sweepJobIdFromServer }: {
  interval: string
  pendingCount: number
  isFactoryRunning: boolean
  sweepJobIdFromServer?: string | null
}) {
  const [sweepJobId, setSweepJobId] = useState<string | null>(null)

  // Restore sweep state from server on mount or when server state changes
  useEffect(() => {
    if (sweepJobIdFromServer && !sweepJobId) {
      setSweepJobId(sweepJobIdFromServer)
    }
  }, [sweepJobIdFromServer])
  const startSweep = useStartCausalSweep()
  const cancelSweep = useCancelCausalSweep()
  const validationStatus = useCausalValidationStatus(sweepJobId)

  const isRunning = sweepJobId && validationStatus.data?.status !== "completed" && !validationStatus.data?.cancelled
  const progress = validationStatus.data

  const handleStart = () => {
    if (sweepJobId) return // 이미 진행 중
    startSweep.mutate(interval, {
      onSuccess: (data) => {
        if (data.job_id && data.total > 0) {
          setSweepJobId(data.job_id)
        }
        // total=0이면 미검증 팩터 없음 → sweepJobId 설정 안 함
      },
    })
  }

  const handleCancel = () => {
    if (sweepJobId) {
      cancelSweep.mutate({ jobId: sweepJobId, interval }, {
        onSuccess: () => {
          setSweepJobId(null)
        },
      })
    }
  }

  // Sweep in progress
  if (isRunning && progress) {
    const total = progress.total || 1
    const validated = (progress.completed ?? 0) + (progress.failed ?? 0)
    const pct = Math.round((validated / total) * 100)
    const passed = progress.robust || 0
    const failed = progress.mirage || 0

    return (
      <div className="border border-[#4056F4]/20 rounded-lg p-3 space-y-2 bg-[#4056F4]/5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">인과검증 전수 진행 중</span>
          <span className="text-xs text-gray-500">{validated} / {total} ({pct}%)</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="h-2 rounded-full bg-[#4056F4] transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-xs">
          <span>
            <span className="text-green-600">통과 {passed}</span>
            {" · "}
            <span className="text-red-500">탈락 {failed}</span>
            {progress.avg_ms_per_factor != null && (
              <span className="text-gray-400 ml-2">
                ~{Math.round(progress.avg_ms_per_factor / 1000)}초/건
              </span>
            )}
          </span>
          <button
            onClick={handleCancel}
            className="px-2 py-1 text-xs rounded border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            취소하고 마이닝 복귀
          </button>
        </div>
        <SweepActivityLog logs={progress.logs ?? []} />
      </div>
    )
  }

  // Completed state (brief flash)
  if (sweepJobId && progress?.status === "completed") {
    setTimeout(() => setSweepJobId(null), 3000)
    return (
      <div className="border border-green-200 rounded-lg p-3 bg-green-50 text-sm text-green-700 select-none">
        전수 검증 완료{isFactoryRunning ? " — 마이닝 자동 재시작됨" : ""}
      </div>
    )
  }

  // Idle state
  return (
    <button
      onClick={handleStart}
      disabled={pendingCount === 0 || startSweep.isPending}
      className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
        pendingCount > 0
          ? "border-[#E3B23C] text-[#E3B23C] hover:bg-[#E3B23C]/10"
          : "border-gray-200 text-gray-400 cursor-not-allowed"
      }`}
    >
      {pendingCount > 0
        ? `\u26A1 인과검증 전수 (${pendingCount.toLocaleString()}건)`
        : "전수 검증 완료"
      }
    </button>
  )
}
