import type { OrderBook as OrderBookType } from "@/types"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Term } from "@/components/ui/term"
import { formatNumber } from "@/lib/format"
import { cn } from "@/lib/utils"

interface OrderBookProps {
  data: OrderBookType
  currentPrice?: number
  onPriceClick?: (price: number) => void
  height?: number
}

function OrderBook({ data, currentPrice, onPriceClick, height }: OrderBookProps) {
  const maxVolume = Math.max(
    ...data.asks.map((a) => a.volume),
    ...data.bids.map((b) => b.volume),
    1,
  )

  // 누적잔량 계산
  const asksCumulative = [...data.asks]
    .reverse()
    .reduce<number[]>((acc, ask, i) => {
      acc.push((acc[i - 1] ?? 0) + ask.volume)
      return acc
    }, [])
    .reverse()

  // 매도호가는 역순으로 표시 (높은 가격 위)
  const asksReversed = [...data.asks].reverse()
  const asksCumReversed = [...asksCumulative]

  // 등락률 계산 헬퍼
  function pctFromBase(price: number) {
    if (!currentPrice || currentPrice === 0) return null
    return ((price - currentPrice) / currentPrice) * 100
  }

  function formatPct(pct: number | null) {
    if (pct == null) return ""
    const sign = pct >= 0 ? "+" : ""
    return `${sign}${pct.toFixed(2)}%`
  }

  const isEmpty = data.asks.length === 0 && data.bids.length === 0

  return (
    <div
      className="flex flex-col rounded-lg border bg-background"
      style={height ? { height } : undefined}
    >
      <div className="shrink-0 border-b px-4 py-2.5">
        <h3 className="text-sm font-medium"><Term>호가</Term></h3>
      </div>

      {isEmpty ? (
        <div className="flex flex-1 items-center justify-center text-xs text-muted-foreground">
          호가 데이터 대기 중...
        </div>
      ) : (
        <ScrollArea className="flex-1 min-h-0">
          <div className="text-xs">
            {/* 헤더 */}
            <div className="grid grid-cols-5 border-b px-3 py-1.5 text-muted-foreground">
              <span><Term>누적</Term></span>
              <span className="text-right"><Term>잔량</Term></span>
              <span className="text-center">가격</span>
              <span className="text-right">등락</span>
              <span className="text-right"><Term>잔량</Term></span>
            </div>

            {/* 매도 호가 (위에서 아래로) */}
            {asksReversed.map((ask, i) => {
              const pct = pctFromBase(ask.price)
              return (
                <div
                  key={`ask-${ask.price}`}
                  className="relative grid cursor-pointer grid-cols-5 px-3 py-0.5 hover:bg-blue-50"
                  onClick={() => onPriceClick?.(ask.price)}
                >
                  <div
                    className="absolute inset-y-0 left-0 bg-blue-500/8"
                    style={{ width: `${(ask.volume / maxVolume) * 100}%` }}
                  />
                  <span className="relative text-muted-foreground">
                    {formatNumber(asksCumReversed[i])}
                  </span>
                  <span className="relative text-right text-blue-600">
                    {formatNumber(ask.volume)}
                  </span>
                  <span className="relative text-center font-medium text-blue-600">
                    {formatNumber(ask.price)}
                  </span>
                  <span
                    className={cn(
                      "relative text-right",
                      pct != null && pct > 0
                        ? "text-red-400"
                        : pct != null && pct < 0
                          ? "text-blue-400"
                          : "text-muted-foreground",
                    )}
                  >
                    {formatPct(pct)}
                  </span>
                  <span />
                </div>
              )
            })}

            {/* 현재가 구분선 */}
            {currentPrice != null && (
              <div className="flex items-center justify-center border-y bg-muted/30 px-3 py-1">
                <span className="text-xs font-bold">
                  {formatNumber(currentPrice)}
                </span>
              </div>
            )}

            {/* 매수 호가 */}
            {data.bids.map((bid) => {
              const pct = pctFromBase(bid.price)
              return (
                <div
                  key={`bid-${bid.price}`}
                  className="relative grid cursor-pointer grid-cols-5 px-3 py-0.5 hover:bg-red-50"
                  onClick={() => onPriceClick?.(bid.price)}
                >
                  <div
                    className="absolute inset-y-0 right-0 bg-red-500/8"
                    style={{ width: `${(bid.volume / maxVolume) * 100}%` }}
                  />
                  <span />
                  <span />
                  <span className="relative text-center font-medium text-red-600">
                    {formatNumber(bid.price)}
                  </span>
                  <span
                    className={cn(
                      "relative text-right",
                      pct != null && pct > 0
                        ? "text-red-400"
                        : pct != null && pct < 0
                          ? "text-blue-400"
                          : "text-muted-foreground",
                    )}
                  >
                    {formatPct(pct)}
                  </span>
                  <span className="relative text-right text-red-600">
                    {formatNumber(bid.volume)}
                  </span>
                </div>
              )
            })}

            {/* 하단 총잔량 */}
            <div className="grid grid-cols-2 border-t px-3 py-1.5 text-muted-foreground">
              <span>
                매도{" "}
                <span className="font-medium text-blue-600">
                  {formatNumber(data.asks.reduce((s, a) => s + a.volume, 0))}
                </span>
              </span>
              <span className="text-right">
                매수{" "}
                <span className="font-medium text-red-600">
                  {formatNumber(data.bids.reduce((s, b) => s + b.volume, 0))}
                </span>
              </span>
            </div>
          </div>
        </ScrollArea>
      )}
    </div>
  )
}

export default OrderBook
