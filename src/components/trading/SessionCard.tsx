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

function getDisplayStatus(session: TradingSession): { label: string; color: string; dot: string } {
  const isMarketHours = (session as any).is_market_hours ?? true

  if (session.status === "running" && !isMarketHours) {
    return { label: "장 마감 (유휴)", color: "text-amber-600", dot: "bg-amber-400" }
  }
  if (session.status === "running") {
    return { label: "실행 중", color: "text-green-600", dot: "bg-green-500" }
  }
  if (session.status === "stopped") {
    return { label: "중지됨", color: "text-muted-foreground", dot: "bg-gray-400" }
  }
  if (session.status === "error") {
    return { label: "오류", color: "text-destructive", dot: "bg-destructive" }
  }
  return { label: session.status, color: "text-muted-foreground", dot: "bg-gray-400" }
}

function SessionCard({ session, selected, onSelect }: SessionCardProps) {
  const stopMutation = useStopTrading()
  const positionCount = Object.keys(session.positions).length
  const display = getDisplayStatus(session)

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
          <span className={cn("inline-block h-2 w-2 shrink-0 rounded-full", display.dot)} />
          <span className="truncate text-sm font-medium">
            {session.strategy_name || "전략"}
          </span>
          {/* interval 배지 */}
          {(() => {
            const raw = session as unknown as Record<string, unknown>
            const interval = (raw.interval as string) || (raw.strategy_interval as string) || ""
            if (interval === "1d") return <span className="shrink-0 rounded bg-amber-100 px-1 py-0.5 text-[9px] font-semibold text-amber-700">일봉</span>
            if (interval === "5m") return <span className="shrink-0 rounded bg-blue-100 px-1 py-0.5 text-[9px] font-semibold text-blue-700">5분봉</span>
            return null
          })()}
        </div>
        <span className={cn("shrink-0 text-[10px] font-medium", display.color)}>
          {display.label}
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
