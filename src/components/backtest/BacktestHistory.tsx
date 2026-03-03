import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Term } from "@/components/ui/term"
import { useBacktestRuns, useDeleteBacktestRun } from "@/hooks/queries"
import { cn } from "@/lib/utils"
import type { BacktestRunSummary } from "@/types"

interface BacktestHistoryProps {
  selectedRunId: string | null
  onSelectRun: (runId: string) => void
}

const STATUS_MAP: Record<
  string,
  { label: string; variant: "default" | "secondary" | "outline" | "destructive" }
> = {
  PENDING: { label: "대기", variant: "outline" },
  RUNNING: { label: "실행중", variant: "secondary" },
  COMPLETED: { label: "완료", variant: "default" },
  FAILED: { label: "실패", variant: "destructive" },
}

function HistoryItem({
  run,
  isSelected,
  onClick,
  onDelete,
}: {
  run: BacktestRunSummary
  isSelected: boolean
  onClick: () => void
  onDelete: () => void
}) {
  const status = STATUS_MAP[run.status] ?? STATUS_MAP.PENDING

  return (
    <div
      className={cn(
        "w-full cursor-pointer rounded-md border p-3 text-left transition-colors hover:bg-muted/50",
        isSelected && "border-primary bg-primary/5",
      )}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{run.strategy_name}</p>
          <p className="text-xs text-muted-foreground">
            {run.start_date} ~ {run.end_date}
          </p>
        </div>
        <Badge variant={status.variant} className="shrink-0 text-[10px]">
          {status.label}
          {run.status === "RUNNING" && ` ${run.progress}%`}
        </Badge>
      </div>

      {run.status === "COMPLETED" && run.total_return != null && (
        <div className="mt-2 flex items-center gap-3 text-xs">
          <span
            className={cn(
              "font-medium",
              run.total_return >= 0 ? "text-red-500" : "text-blue-500",
            )}
          >
            {run.total_return >= 0 ? "+" : ""}
            {run.total_return.toFixed(2)}%
          </span>
          {run.win_rate != null && (
            <span className="text-muted-foreground">
              <Term>승률</Term> {run.win_rate.toFixed(1)}%
            </span>
          )}
          {run.total_trades != null && (
            <span className="text-muted-foreground">
              {run.total_trades}건
            </span>
          )}
        </div>
      )}

      <div className="mt-1.5 flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground">
          {new Date(run.created_at).toLocaleString("ko-KR")}
        </span>
        <button
          className="text-[10px] text-muted-foreground hover:text-destructive"
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
        >
          삭제
        </button>
      </div>
    </div>
  )
}

function BacktestHistory({ selectedRunId, onSelectRun }: BacktestHistoryProps) {
  const { data: runs, isLoading } = useBacktestRuns()
  const deleteMutation = useDeleteBacktestRun()

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">실행 기록</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading && (
          <>
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </>
        )}

        {!isLoading && (!runs || runs.length === 0) && (
          <p className="py-4 text-center text-xs text-muted-foreground">
            실행 기록이 없습니다.
          </p>
        )}

        {runs?.map((run) => (
          <HistoryItem
            key={run.id}
            run={run}
            isSelected={run.id === selectedRunId}
            onClick={() => onSelectRun(run.id)}
            onDelete={() => deleteMutation.mutate(run.id)}
          />
        ))}
      </CardContent>
    </Card>
  )
}

export default BacktestHistory
