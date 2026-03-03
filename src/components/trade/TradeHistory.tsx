import { ScrollArea } from "@/components/ui/scroll-area"
import { useTickStore } from "@/stores/use-tick-store"
import { formatNumber } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { RealtimeTick } from "@/types"

const EMPTY_TICKS: RealtimeTick[] = []

interface TradeHistoryProps {
  symbol: string
  height?: number
}

function TradeHistory({ symbol, height }: TradeHistoryProps) {
  const ticks = useTickStore((s) => s.ticks[symbol] ?? EMPTY_TICKS)
  const recent = ticks.slice(-50).reverse()

  return (
    <div
      className="flex flex-col rounded-lg border bg-background"
      style={height ? { height } : undefined}
    >
      <div className="shrink-0 border-b px-4 py-2.5">
        <h3 className="text-sm font-medium">체결정보</h3>
      </div>

      {/* 헤더 */}
      <div className="shrink-0 grid grid-cols-3 border-b px-4 py-1.5 text-xs text-muted-foreground">
        <span>시간</span>
        <span className="text-right">가격</span>
        <span className="text-right">수량</span>
      </div>

      <ScrollArea className="flex-1 min-h-0">
        {recent.length === 0 ? (
          <div className="flex h-20 items-center justify-center text-xs text-muted-foreground">
            체결 대기 중...
          </div>
        ) : (
          recent.map((tick, i) => (
            <div
              key={i}
              className="grid grid-cols-3 px-4 py-0.5 text-xs tabular-nums"
            >
              <span className="text-muted-foreground">
                {new Date().toLocaleTimeString("ko-KR", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </span>
              <span
                className={cn(
                  "text-right font-medium",
                  tick.change > 0
                    ? "text-red-500"
                    : tick.change < 0
                      ? "text-blue-500"
                      : "text-foreground",
                )}
              >
                {formatNumber(tick.price)}
              </span>
              <span className="text-right text-muted-foreground">
                {formatNumber(tick.volume)}
              </span>
            </div>
          ))
        )}
      </ScrollArea>
    </div>
  )
}

export default TradeHistory
