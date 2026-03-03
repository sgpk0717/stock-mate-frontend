import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Term } from "@/components/ui/term"
import {
  useTradingStatus,
  useStopTrading,
} from "@/hooks/queries/use-trading"
import { cn } from "@/lib/utils"

interface LiveStatusProps {
  onSelectSession?: (sessionId: string) => void
}

const STATUS_LABELS: Record<string, string> = {
  running: "실행 중",
  stopped: "중지됨",
  error: "오류",
}

const STATUS_COLORS: Record<string, string> = {
  running: "text-green-600",
  stopped: "text-muted-foreground",
  error: "text-destructive",
}

function LiveStatus({ onSelectSession }: LiveStatusProps) {
  const { data: sessions } = useTradingStatus()
  const stopMutation = useStopTrading()

  if (!sessions || sessions.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">실행 세션</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-xs text-muted-foreground">
            실행 중인 세션이 없습니다.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">
          실행 세션 ({sessions.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {sessions.map((s) => (
          <div
            key={s.id}
            className="flex items-center justify-between rounded-md border p-2.5"
          >
            <button
              type="button"
              className="min-w-0 flex-1 text-left"
              onClick={() => onSelectSession?.(s.id)}
            >
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "inline-block h-2 w-2 rounded-full",
                    s.status === "running" && "bg-green-500",
                    s.status === "stopped" && "bg-gray-400",
                    s.status === "error" && "bg-destructive",
                  )}
                />
                <span className="truncate text-sm font-medium">
                  {s.strategy_name || "전략"}
                </span>
                <span className={cn("text-xs", STATUS_COLORS[s.status])}>
                  {STATUS_LABELS[s.status] ?? s.status}
                </span>
              </div>
              <div className="mt-1 flex gap-3 text-xs text-muted-foreground">
                <span>모드: {s.mode === "real" ? "실전" : "모의"}</span>
                <span><Term>포지션</Term>: {Object.keys(s.positions).length}</span>
                <span>매매: {s.trade_count}건</span>
              </div>
            </button>
            {s.status === "running" && (
              <Button
                variant="outline"
                size="sm"
                className="ml-2 shrink-0"
                onClick={() => stopMutation.mutate(s.id)}
                disabled={stopMutation.isPending}
              >
                중지
              </Button>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export default LiveStatus
