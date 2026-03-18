import { useMemo, useState } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import CandleChart from "@/components/chart/CandleChart"
import { useCandles } from "@/hooks/queries/use-ticks"
import { formatKRW } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { TradeLog } from "@/types"
import type { SeriesMarker, Time } from "lightweight-charts"

interface TradeJournalChartProps {
  trades: TradeLog[]
  /** Strategy interval (e.g. "5m", "1d") */
  interval?: string
}

/**
 * Convert ISO timestamp string to UTC seconds timestamp.
 */
function toUTCTimestamp(isoString: string): number {
  return Math.floor(new Date(isoString).getTime() / 1000)
}

function TradeJournalChart({ trades, interval = "5m" }: TradeJournalChartProps) {
  // Extract unique symbols from trades (trade.name 직접 사용 — stockList 로딩 불필요)
  const symbolList = useMemo(() => {
    const seen = new Set<string>()
    const result: { symbol: string; name: string }[] = []
    for (const t of trades) {
      if (!seen.has(t.symbol)) {
        seen.add(t.symbol)
        result.push({
          symbol: t.symbol,
          name: t.name || t.symbol,
        })
      }
    }
    return result
  }, [trades])

  const [selectedSymbol, setSelectedSymbol] = useState<string>(() =>
    symbolList.length > 0 ? symbolList[0].symbol : "",
  )

  // If selected symbol is not in the list, pick the first one
  const effectiveSymbol =
    symbolList.find((s) => s.symbol === selectedSymbol)?.symbol ??
    (symbolList.length > 0 ? symbolList[0].symbol : "")

  // Fetch candle data — 200봉이면 5분봉 기준 약 2.5일 (충분한 컨텍스트)
  const { data: candleData, isLoading, isFetching } = useCandles(
    effectiveSymbol,
    interval,
    200,
  )

  // Build markers from trades for this symbol
  const markers = useMemo((): SeriesMarker<Time>[] => {
    if (!effectiveSymbol) return []

    return trades
      .filter((t) => t.symbol === effectiveSymbol)
      .map((t) => ({
        time: toUTCTimestamp(t.timestamp) as unknown as Time,
        position: (t.side === "BUY" ? "belowBar" : "aboveBar") as
          | "belowBar"
          | "aboveBar",
        color: t.side === "BUY" ? "#ef4444" : "#3b82f6",
        shape: (t.side === "BUY" ? "arrowUp" : "arrowDown") as
          | "arrowUp"
          | "arrowDown",
        text: `${t.step || t.side} ${t.qty}주`,
      }))
  }, [trades, effectiveSymbol])

  // Summary stats for this symbol
  const symbolStats = useMemo(() => {
    const filtered = trades.filter((t) => t.symbol === effectiveSymbol)
    const buys = filtered.filter((t) => t.side === "BUY")
    const sells = filtered.filter((t) => t.side === "SELL")
    const realizedPnl = sells.reduce(
      (sum, t) => sum + (t.pnl_amount ?? 0),
      0,
    )
    return {
      buyCount: buys.length,
      sellCount: sells.length,
      realizedPnl,
    }
  }, [trades, effectiveSymbol])

  const selectedName =
    symbolList.find((s) => s.symbol === effectiveSymbol)?.name ??
    effectiveSymbol

  if (symbolList.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
        매매 기록이 없습니다.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Header: symbol select + stats */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Select
            value={effectiveSymbol}
            onValueChange={setSelectedSymbol}
          >
            <SelectTrigger size="sm" className="h-8 min-w-[160px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {symbolList.map((s) => (
                <SelectItem key={s.symbol} value={s.symbol}>
                  <span className="font-medium">{s.name}</span>
                  <span className="ml-1.5 text-muted-foreground">
                    {s.symbol}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-xs text-muted-foreground">{interval}</span>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <span className="text-red-600">
            매수 {symbolStats.buyCount}건
          </span>
          <span className="text-blue-600">
            매도 {symbolStats.sellCount}건
          </span>
          {symbolStats.sellCount > 0 && (
            <span
              className={cn(
                "font-medium",
                symbolStats.realizedPnl > 0
                  ? "text-red-600"
                  : symbolStats.realizedPnl < 0
                    ? "text-blue-600"
                    : "text-muted-foreground",
              )}
            >
              실현 {formatKRW(symbolStats.realizedPnl)}
            </span>
          )}
        </div>
      </div>

      {/* Chart with loading states */}
      <div className="relative">
        {isLoading ? (
          /* 첫 로딩: Skeleton */
          <div className="space-y-2">
            <Skeleton className="h-[380px] w-full rounded-md" />
          </div>
        ) : candleData?.candles && candleData.candles.length > 0 ? (
          <>
            <CandleChart
              data={candleData.candles}
              height={380}
              interval={interval}
              markers={markers}
            />
            {/* 종목 변경 시 fetching 오버레이 (이전 차트 유지하면서 표시) */}
            {isFetching && (
              <div className="absolute inset-0 flex items-center justify-center rounded-md bg-background/50">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  {selectedName} 로딩 중
                </div>
              </div>
            )}
          </>
        ) : (
          /* 데이터 없음 (로딩 완료 후) */
          <div className="flex h-[380px] items-center justify-center rounded-md border text-sm text-muted-foreground">
            {effectiveSymbol
              ? `${selectedName}의 ${interval} 캔들 데이터가 없습니다`
              : "종목을 선택하세요"}
          </div>
        )}
      </div>
    </div>
  )
}

export default TradeJournalChart
