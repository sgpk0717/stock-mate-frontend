import { Button } from "@/components/ui/button"
import { useStopTrading } from "@/hooks/queries/use-trading"
import type { TradingSession } from "@/types"
import { cn } from "@/lib/utils"

interface SessionCardProps {
  session: TradingSession
  selected: boolean
  onSelect: (id: string) => void
}

const STATUS_LABELS: Record<string, string> = {
  running: "실행 중",
  stopped: "중지됨",
  error: "오류",
}

function SessionCard({ session, selected, onSelect }: SessionCardProps) {
  const stopMutation = useStopTrading()
  const positionCount = Object.keys(session.positions).length

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(session.id)}
      onKeyDown={(e) => { if (e.key === "Enter") onSelect(session.id) }}
      className={cn(
        "flex min-w-[200px] shrink-0 cursor-pointer flex-col gap-2 rounded-lg border p-3 text-left transition-colors",
        selected
          ? "border-primary/40 bg-primary/5"
          : "border-border hover:border-border/80 hover:bg-muted/30",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={cn(
              "inline-block h-2 w-2 shrink-0 rounded-full",
              session.status === "running" && "bg-green-500",
              session.status === "stopped" && "bg-gray-400",
              session.status === "error" && "bg-destructive",
            )}
          />
          <span className="truncate text-sm font-medium">
            {session.strategy_name || "전략"}
          </span>
        </div>
        <span
          className={cn(
            "shrink-0 text-[10px] font-medium",
            session.status === "running" && "text-green-600",
            session.status === "stopped" && "text-muted-foreground",
            session.status === "error" && "text-destructive",
          )}
        >
          {STATUS_LABELS[session.status] ?? session.status}
        </span>
      </div>

      <div className="flex gap-3 text-xs text-muted-foreground">
        <span>포지션 {positionCount}개</span>
        <span>매매 {session.trade_count}건</span>
      </div>

      {session.status === "running" && (
        <Button
          variant="outline"
          size="sm"
          className="mt-1 h-7 w-full text-xs"
          onClick={(e) => {
            e.stopPropagation()
            stopMutation.mutate(session.id)
          }}
          disabled={stopMutation.isPending}
        >
          중지
        </Button>
      )}
    </div>
  )
}

export default SessionCard
