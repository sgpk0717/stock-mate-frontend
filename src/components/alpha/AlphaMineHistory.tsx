import { Term } from "@/components/ui/term"
import type { AlphaMiningRunSummary } from "@/types/alpha"

interface AlphaMineHistoryProps {
  runs: AlphaMiningRunSummary[]
  onSelect: (runId: string) => void
  onDelete: (runId: string) => void
}

function AlphaMineHistory({ runs, onSelect, onDelete }: AlphaMineHistoryProps) {
  if (runs.length === 0) {
    return (
      <div className="rounded-lg border p-4 text-center text-sm text-muted-foreground">
        마이닝 이력이 없습니다.
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold"><Term>마이닝</Term> 이력</h3>
      {runs.map((run) => (
        <div
          key={run.id}
          className="flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/30"
          onClick={() => onSelect(run.id)}
        >
          <div>
            <p className="text-sm font-medium">{run.name}</p>
            <p className="text-xs text-muted-foreground">
              {new Date(run.created_at).toLocaleDateString("ko-KR")} /{" "}
              {run.factors_found}개 팩터
            </p>
          </div>
          <div className="flex items-center gap-2">
            <StatusDot status={run.status} />
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDelete(run.id)
              }}
              className="text-xs text-red-500 hover:text-red-700"
            >
              삭제
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

function StatusDot({ status }: { status: string }) {
  const color =
    status === "COMPLETED"
      ? "bg-green-500"
      : status === "FAILED"
        ? "bg-red-500"
        : status === "RUNNING"
          ? "bg-yellow-500 animate-pulse"
          : "bg-gray-400"

  return <div className={`h-2 w-2 rounded-full ${color}`} />
}

export default AlphaMineHistory
