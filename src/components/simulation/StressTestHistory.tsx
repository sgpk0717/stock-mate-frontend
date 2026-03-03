import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useStressTests, useDeleteStressTest } from "@/hooks/queries"
import { cn } from "@/lib/utils"
import type { StressTestRunSummary } from "@/types/simulation"

interface StressTestHistoryProps {
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

const SCENARIO_LABELS: Record<string, string> = {
  rate_shock: "금리 충격",
  liquidity_crisis: "유동성 위기",
  flash_crash: "플래시 크래시",
  supply_chain: "공급망 충격",
  custom: "커스텀",
}

function HistoryItem({
  run,
  isSelected,
  onClick,
  onDelete,
}: {
  run: StressTestRunSummary
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
          <p className="truncate text-sm font-medium">{run.name}</p>
          <p className="text-xs text-muted-foreground">
            {SCENARIO_LABELS[run.scenario_type] ?? run.scenario_type}
          </p>
        </div>
        <Badge variant={status.variant} className="shrink-0 text-[10px]">
          {status.label}
          {run.status === "RUNNING" && ` ${run.progress}%`}
        </Badge>
      </div>

      {run.status === "COMPLETED" && (
        <div className="mt-2 flex items-center gap-3 text-xs">
          {run.strategy_pnl != null && (
            <span
              className={cn(
                "font-medium",
                run.strategy_pnl >= 0 ? "text-red-500" : "text-blue-500",
              )}
            >
              PnL {run.strategy_pnl >= 0 ? "+" : ""}
              {run.strategy_pnl.toFixed(2)}%
            </span>
          )}
          {run.crash_depth != null && (
            <span className="text-muted-foreground">
              충격 {run.crash_depth.toFixed(1)}%
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

function StressTestHistory({
  selectedRunId,
  onSelectRun,
}: StressTestHistoryProps) {
  const { data: runs, isLoading } = useStressTests()
  const deleteMutation = useDeleteStressTest()

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

export default StressTestHistory
