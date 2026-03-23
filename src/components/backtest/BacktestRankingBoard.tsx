import { useEffect, useMemo, useRef, useState } from "react"
import {
  CandlestickSeries,
  createChart,
  createSeriesMarkers,
  type IChartApi,
  type ISeriesApi,
  type ISeriesMarkersPluginApi,
  type SeriesMarker,
  type Time,
} from "lightweight-charts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useCandles } from "@/hooks/queries"
import type { BacktestTrade } from "@/types"

// ── Types ──

type SortKey = "pnl" | "pnl_pct" | "count" | "winRate" | "entry_date" | "holding_days"
type SortDir = "asc" | "desc"

interface SymbolAgg {
  symbol: string
  name: string
  trades: BacktestTrade[]
  pnl: number
  pnlPct: number
  count: number
  wins: number
  winRate: number
  avgHolding: number
}

// ── Sort Helper ──

function sortItems<T>(items: T[], key: keyof T, dir: SortDir): T[] {
  return [...items].sort((a, b) => {
    const av = a[key] as number
    const bv = b[key] as number
    return dir === "desc" ? bv - av : av - bv
  })
}

// ── 미니 차트: 매매일지 ──

function TradeJournalChart({
  trade,
  interval,
}: {
  trade: BacktestTrade
  interval: string
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null)
  const markersRef = useRef<ISeriesMarkersPluginApi<Time> | null>(null)

  // 매매 기간에 맞춰 필요한 캔들 수만 요청 (보유일 + 앞뒤 여유)
  const holdingDays = trade.holding_days || 30
  const candleCount = Math.min(
    interval === "1d" ? Math.max(holdingDays + 40, 60) : Math.max(holdingDays * 8, 100),
    interval === "1d" ? 200 : 300,
  )
  const { data: candleResult } = useCandles(trade.symbol, interval, candleCount)

  useEffect(() => {
    if (!containerRef.current) return
    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: 200,
      layout: { background: { color: "transparent" }, textColor: "#71717a", fontSize: 10 },
      grid: { vertLines: { color: "#f4f4f5" }, horzLines: { color: "#f4f4f5" } },
      rightPriceScale: { borderColor: "#e4e4e7" },
      timeScale: { borderColor: "#e4e4e7", timeVisible: interval !== "1d" },
      handleScroll: false,
      handleScale: false,
      crosshair: {
        horzLine: { labelBackgroundColor: "#4056F4" },
        vertLine: { labelBackgroundColor: "#4056F4" },
      },
    })
    const series = chart.addSeries(CandlestickSeries, {
      upColor: "#ef4444",
      downColor: "#3b82f6",
      borderUpColor: "#ef4444",
      borderDownColor: "#3b82f6",
      wickUpColor: "#ef4444",
      wickDownColor: "#3b82f6",
    })
    chartRef.current = chart
    seriesRef.current = series

    const onResize = () => {
      if (containerRef.current) chart.applyOptions({ width: containerRef.current.clientWidth })
    }
    window.addEventListener("resize", onResize)
    return () => {
      window.removeEventListener("resize", onResize)
      if (markersRef.current) { markersRef.current.detach(); markersRef.current = null }
      chart.remove()
    }
  }, [interval])

  const candles = candleResult && "candles" in candleResult ? candleResult.candles : candleResult

  useEffect(() => {
    if (!seriesRef.current || !candles?.length) return
    const isIntraday = interval !== "1d"
    const toTime = (s: string): Time => {
      if (isIntraday) return (Math.floor(new Date(s.replace(" ", "T")).getTime() / 1000)) as unknown as Time
      return s.slice(0, 10) as Time
    }
    const data = (candles as Array<{ time: number | string; dt?: string; open: number; high: number; low: number; close: number }>).map((c) => ({
      time: (typeof c.time === "number" ? c.time : toTime(c.dt || String(c.time))) as Time,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }))
    seriesRef.current.setData(data)

    // 매수/매도 마커
    const markers: SeriesMarker<Time>[] = []
    if (trade.entry_date) {
      markers.push({
        time: toTime(trade.entry_date),
        position: "belowBar",
        color: "#22c55e",
        shape: "arrowUp",
        text: `매수 ${trade.entry_price.toLocaleString()}`,
      })
    }
    if (trade.exit_date) {
      markers.push({
        time: toTime(trade.exit_date),
        position: "aboveBar",
        color: trade.pnl >= 0 ? "#ef4444" : "#3b82f6",
        shape: "arrowDown",
        text: `매도 ${trade.exit_price?.toLocaleString() ?? ""}`,
      })
    }
    markers.sort((a, b) => (a.time as number) - (b.time as number))
    if (markersRef.current) {
      markersRef.current.setMarkers(markers)
    } else {
      markersRef.current = createSeriesMarkers(seriesRef.current, markers)
    }
    chartRef.current?.timeScale().fitContent()
  }, [candles, trade, interval])

  return (
    <div className="relative">
      <div ref={containerRef} className="h-[200px]" />
      {!candles?.length && (
        <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground bg-background/80">
          차트 로딩 중...
        </div>
      )}
    </div>
  )
}

// ── 종목 전체 매매 일지 차트 (여러 매수/매도 마커) ──

function SymbolJournalChart({
  trades,
  symbol,
  interval,
}: {
  trades: BacktestTrade[]
  symbol: string
  interval: string
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null)
  const markersRef = useRef<ISeriesMarkersPluginApi<Time> | null>(null)
  const zoomSubRef = useRef<(() => void) | null>(null)
  const initialBarCountRef = useRef(0)

  // 전체 매매 기간 커버하는 캔들 수
  const totalDays = useMemo(() => {
    const dates = trades.flatMap((t) => [t.entry_date, t.exit_date].filter(Boolean)) as string[]
    if (dates.length < 2) return 60
    const sorted = dates.sort()
    const diff = (new Date(sorted[sorted.length - 1]).getTime() - new Date(sorted[0]).getTime()) / 86400000
    return Math.ceil(diff)
  }, [trades])
  const candleCount = Math.min(
    interval === "1d" ? Math.max(totalDays + 40, 60) : Math.max(totalDays * 8, 100),
    interval === "1d" ? 400 : 500,
  )
  const { data: candleResult } = useCandles(symbol, interval, candleCount)

  useEffect(() => {
    if (!containerRef.current) return
    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: 200,
      layout: { background: { color: "transparent" }, textColor: "#71717a", fontSize: 10 },
      grid: { vertLines: { color: "#f4f4f5" }, horzLines: { color: "#f4f4f5" } },
      rightPriceScale: { borderColor: "#e4e4e7" },
      timeScale: { borderColor: "#e4e4e7", timeVisible: interval !== "1d" },
      handleScroll: { mouseWheel: false, pressedMouseMove: true },
      handleScale: { mouseWheel: true, pinch: true },
      crosshair: {
        horzLine: { labelBackgroundColor: "#4056F4" },
        vertLine: { labelBackgroundColor: "#4056F4" },
      },
    })
    const series = chart.addSeries(CandlestickSeries, {
      upColor: "#ef4444",
      downColor: "#3b82f6",
      borderUpColor: "#ef4444",
      borderDownColor: "#3b82f6",
      wickUpColor: "#ef4444",
      wickDownColor: "#3b82f6",
    })
    chartRef.current = chart
    seriesRef.current = series

    // 축소 제한: fitContent 후 초기 범위 저장, 그 이상 축소 불가
    // initialBarCount는 데이터 로드 후 fitContent() 호출 시점에 설정됨 (아래 useEffect)


    const onResize = () => {
      if (containerRef.current) chart.applyOptions({ width: containerRef.current.clientWidth })
    }
    window.addEventListener("resize", onResize)
    return () => {
      window.removeEventListener("resize", onResize)
      if (zoomSubRef.current) {
        chart.timeScale().unsubscribeVisibleLogicalRangeChange(zoomSubRef.current)
        zoomSubRef.current = null
      }
      if (markersRef.current) { markersRef.current.detach(); markersRef.current = null }
      chart.remove()
    }
  }, [interval])

  const candles = candleResult && "candles" in candleResult ? candleResult.candles : candleResult

  useEffect(() => {
    if (!seriesRef.current || !candles?.length) return
    const isIntraday = interval !== "1d"
    const toTime = (s: string): Time => {
      if (isIntraday) return (Math.floor(new Date(s.replace(" ", "T")).getTime() / 1000)) as unknown as Time
      return s.slice(0, 10) as Time
    }
    const data = (candles as Array<{ time: number | string; dt?: string; open: number; high: number; low: number; close: number }>).map((c) => ({
      time: (typeof c.time === "number" ? c.time : toTime(c.dt || String(c.time))) as Time,
      open: c.open, high: c.high, low: c.low, close: c.close,
    }))
    seriesRef.current.setData(data)

    // 모든 매매의 매수/매도 마커
    const markers: SeriesMarker<Time>[] = []
    trades.forEach((t) => {
      if (t.entry_date) {
        markers.push({
          time: toTime(t.entry_date),
          position: "belowBar",
          color: "#22c55e",
          shape: "arrowUp",
          text: "매수",
        })
      }
      if (t.exit_date) {
        markers.push({
          time: toTime(t.exit_date),
          position: "aboveBar",
          color: t.pnl >= 0 ? "#ef4444" : "#3b82f6",
          shape: "arrowDown",
          text: "매도",
        })
      }
    })
    markers.sort((a, b) => (a.time as number) - (b.time as number))
    if (markersRef.current) {
      markersRef.current.setMarkers(markers)
    } else {
      markersRef.current = createSeriesMarkers(seriesRef.current, markers)
    }
    chartRef.current?.timeScale().fitContent()

    // fitContent 후 초기 범위 저장 + 축소 제한 등록
    requestAnimationFrame(() => {
      const chart = chartRef.current
      if (!chart) return
      const range = chart.timeScale().getVisibleLogicalRange()
      if (range) {
        initialBarCountRef.current = range.to - range.from
      }
      // 이전 구독 해제
      if (zoomSubRef.current) {
        chart.timeScale().unsubscribeVisibleLogicalRangeChange(zoomSubRef.current)
      }
      const guard = () => {
        const r = chart.timeScale().getVisibleLogicalRange()
        if (!r || !initialBarCountRef.current) return
        const bars = r.to - r.from
        if (bars > initialBarCountRef.current) {
          chart.timeScale().setVisibleLogicalRange({
            from: r.from,
            to: r.from + initialBarCountRef.current,
          })
        }
      }
      zoomSubRef.current = guard
      chart.timeScale().subscribeVisibleLogicalRangeChange(guard)
    })
  }, [candles, trades, interval])

  return (
    <div className="relative">
      <div ref={containerRef} className="h-[200px]" />
      {!candles?.length && (
        <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground bg-background/80">
          차트 로딩 중...
        </div>
      )}
    </div>
  )
}

// ── 지표 스냅샷 그리드 ──

function SnapshotGrid({ entry, exit }: { entry?: Record<string, number>; exit?: Record<string, number> }) {
  if (!entry && !exit) return null
  const keys = [...new Set([...Object.keys(entry || {}), ...Object.keys(exit || {})])]
    .filter((k) => !["close", "open", "high", "low", "volume"].includes(k))
    .slice(0, 6)
  if (keys.length === 0) return null

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-[11px]">
      <div className="font-medium text-muted-foreground">진입 지표</div>
      <div className="font-medium text-muted-foreground">청산 지표</div>
      {keys.map((k) => (
        <div key={k} className="contents">
          <div>
            <span className="text-muted-foreground">{k}:</span>{" "}
            <span className="font-medium">{entry?.[k]?.toFixed(2) ?? "-"}</span>
          </div>
          <div>
            <span className="text-muted-foreground">{k}:</span>{" "}
            <span className="font-medium">{exit?.[k]?.toFixed(2) ?? "-"}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── 메인 컴포넌트 ──

interface BacktestRankingBoardProps {
  trades: BacktestTrade[]
  interval?: string
}

const EXIT_REASON_LABELS: Record<string, string> = {
  "S-STOP": "손절",
  "S-TRAIL": "트레일링",
  "S-HALF": "익절",
  "REBAL-SELL": "리밸런싱",
  "S-EOD": "장종료",
  "기간만료 청산": "만료",
}

function BacktestRankingBoard({ trades, interval = "1d" }: BacktestRankingBoardProps) {
  const [mode, setMode] = useState<"aggregate" | "individual">("aggregate")
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null)
  const [sortKey, setSortKey] = useState<SortKey>("pnl")
  const [sortDir, setSortDir] = useState<SortDir>("desc")
  const [showAggChart, setShowAggChart] = useState(false)
  const [subSortKey, setSubSortKey] = useState<string>("pnl_pct")
  const [subSortDir, setSubSortDir] = useState<SortDir>("desc")

  // mode 변경 시 초기화
  useEffect(() => {
    setExpandedIdx(null)
    setShowAggChart(false)
    setSortKey(mode === "aggregate" ? "pnl" : "pnl_pct")
    setSortDir("desc")
  }, [mode])

  const closedTrades = useMemo(() => trades.filter((t) => t.exit_date), [trades])

  // ── 종목별 합산 ──
  const aggregates = useMemo(() => {
    const map = new Map<string, SymbolAgg>()
    for (const t of closedTrades) {
      const prev = map.get(t.symbol)
      if (!prev) {
        map.set(t.symbol, {
          symbol: t.symbol,
          name: t.name || t.symbol,
          trades: [t],
          pnl: t.pnl,
          pnlPct: 0,
          count: 1,
          wins: t.pnl >= 0 ? 1 : 0,
          winRate: 0,
          avgHolding: t.holding_days,
        })
      } else {
        prev.trades.push(t)
        prev.pnl += t.pnl
        prev.count += 1
        if (t.pnl >= 0) prev.wins += 1
        prev.avgHolding = prev.trades.reduce((s, x) => s + x.holding_days, 0) / prev.trades.length
      }
    }
    for (const v of map.values()) {
      v.winRate = v.count > 0 ? (v.wins / v.count) * 100 : 0
      // 합산 수익률: 개별 pnl_pct 평균
      v.pnlPct = v.trades.reduce((s, x) => s + x.pnl_pct, 0) / v.count
    }
    return [...map.values()]
  }, [closedTrades])

  const sortedAggregates = useMemo(() => {
    const key = sortKey === "pnl_pct" ? "pnlPct" : sortKey
    return sortItems(aggregates, key as keyof SymbolAgg, sortDir)
  }, [aggregates, sortKey, sortDir])

  // ── 단일매매 정렬 ──
  const sortedIndividual = useMemo(() => {
    return [...closedTrades].sort((a, b) => {
      const av = a[sortKey as keyof BacktestTrade] as number
      const bv = b[sortKey as keyof BacktestTrade] as number
      return sortDir === "desc" ? bv - av : av - bv
    })
  }, [closedTrades, sortKey, sortDir])

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "desc" ? "asc" : "desc"))
    else { setSortKey(key); setSortDir("desc") }
  }

  function handleSubSort(key: string) {
    if (subSortKey === key) setSubSortDir((d) => (d === "desc" ? "asc" : "desc"))
    else { setSubSortKey(key); setSubSortDir("desc") }
  }

  const SortArrow = ({ active, dir }: { active: boolean; dir: SortDir }) =>
    active ? <span className="ml-0.5">{dir === "desc" ? "↓" : "↑"}</span> : null

  // ── 종목별 합산: 종목 내 서브 매매 정렬 ──
  function getSortedSubTrades(t: BacktestTrade[]) {
    return [...t].sort((a, b) => {
      const av = a[subSortKey as keyof BacktestTrade] as number
      const bv = b[subSortKey as keyof BacktestTrade] as number
      return subSortDir === "desc" ? (bv ?? 0) - (av ?? 0) : (av ?? 0) - (bv ?? 0)
    })
  }

  // ── 종목 합산 클릭 시 찾기 (단일매매 모드에서) ──
  function getSymbolAgg(symbol: string) {
    return aggregates.find((a) => a.symbol === symbol)
  }

  if (closedTrades.length === 0) return null

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">종목 랭킹</CardTitle>
          <div className="flex rounded-md border text-[11px]">
            <button
              className={cn(
                "px-2.5 py-1 transition-colors",
                mode === "aggregate" ? "bg-primary text-primary-foreground" : "hover:bg-muted",
              )}
              onClick={() => setMode("aggregate")}
            >
              종목별 합산
            </button>
            <button
              className={cn(
                "px-2.5 py-1 transition-colors",
                mode === "individual" ? "bg-primary text-primary-foreground" : "hover:bg-muted",
              )}
              onClick={() => setMode("individual")}
            >
              단일매매
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {/* Sort Bar */}
        <div className="flex items-center border-b px-4 py-1.5 text-[10px] font-medium text-muted-foreground">
          <span className="w-6">#</span>
          <span className="flex-1">종목</span>
          {mode === "aggregate" ? (
            <>
              <button className="w-10 text-right cursor-pointer" onClick={() => handleSort("count")}>
                매매<SortArrow active={sortKey === "count"} dir={sortDir} />
              </button>
              <button className="w-12 text-right cursor-pointer" onClick={() => handleSort("winRate")}>
                승률<SortArrow active={sortKey === "winRate"} dir={sortDir} />
              </button>
              <button className="w-20 text-right cursor-pointer" onClick={() => handleSort("pnl")}>
                총손익<SortArrow active={sortKey === "pnl"} dir={sortDir} />
              </button>
            </>
          ) : (
            <>
              <span className="w-16 text-right">진입일</span>
              <button className="w-10 text-right cursor-pointer" onClick={() => handleSort("holding_days")}>
                보유<SortArrow active={sortKey === "holding_days"} dir={sortDir} />
              </button>
              <button className="w-16 text-right cursor-pointer" onClick={() => handleSort("pnl_pct")}>
                수익률<SortArrow active={sortKey === "pnl_pct"} dir={sortDir} />
              </button>
              <button className="w-20 text-right cursor-pointer" onClick={() => handleSort("pnl")}>
                손익<SortArrow active={sortKey === "pnl"} dir={sortDir} />
              </button>
            </>
          )}
        </div>

        {/* List */}
        <div className="max-h-[500px] overflow-y-auto">
          {mode === "aggregate"
            ? sortedAggregates.map((agg, i) => {
                const isExpanded = expandedIdx === i
                const bestIdx = agg.trades.reduce((bi, t, j) => (t.pnl_pct > agg.trades[bi].pnl_pct ? j : bi), 0)
                const worstIdx = agg.trades.reduce((bi, t, j) => (t.pnl_pct < agg.trades[bi].pnl_pct ? j : bi), 0)
                return (
                  <div key={agg.symbol}>
                    <div
                      className={cn(
                        "flex items-center px-4 py-2 text-xs cursor-pointer hover:bg-muted/50 transition-colors",
                        isExpanded && "bg-muted/30",
                      )}
                      onClick={() => setExpandedIdx(isExpanded ? null : i)}
                    >
                      <span className="w-6 text-muted-foreground">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <span className="font-medium truncate">{agg.name}</span>
                        <span className="ml-1 text-[10px] text-muted-foreground">{isExpanded ? "▾" : "▸"}</span>
                      </div>
                      <span className="w-10 text-right text-muted-foreground">{agg.count}건</span>
                      <span className="w-12 text-right">
                        <span className={cn(agg.winRate >= 50 ? "text-red-500" : "text-blue-500")}>
                          {agg.wins}/{agg.count}
                        </span>
                      </span>
                      <span
                        className={cn(
                          "w-20 text-right font-medium",
                          agg.pnl >= 0 ? "text-red-500" : "text-blue-500",
                        )}
                      >
                        {agg.pnl >= 0 ? "+" : ""}
                        {Math.round(agg.pnl).toLocaleString()}
                      </span>
                    </div>

                    {/* 확장: 서브매매 테이블 */}
                    {isExpanded && (
                      <div className="border-t border-b bg-muted/10 px-4 py-2 space-y-2">
                        {/* 차트 토글 */}
                        <button
                          className="text-[10px] text-muted-foreground hover:text-foreground cursor-pointer flex items-center gap-1"
                          onClick={(e) => { e.stopPropagation(); setShowAggChart((v) => !v) }}
                        >
                          {showAggChart ? "▾" : "▸"} 차트
                        </button>
                        {showAggChart && (
                          <SymbolJournalChart trades={agg.trades} symbol={agg.symbol} interval={interval} />
                        )}
                        {/* 서브 테이블 헤더 */}
                        <div className="flex items-center text-[10px] font-medium text-muted-foreground">
                          <button className="flex-1 text-left cursor-pointer" onClick={() => handleSubSort("entry_date")}>
                            진입<SortArrow active={subSortKey === "entry_date"} dir={subSortDir} />
                          </button>
                          <span className="w-16 text-right">청산</span>
                          <button className="w-10 text-right cursor-pointer" onClick={() => handleSubSort("holding_days")}>
                            보유<SortArrow active={subSortKey === "holding_days"} dir={subSortDir} />
                          </button>
                          <button className="w-14 text-right cursor-pointer" onClick={() => handleSubSort("pnl_pct")}>
                            수익률<SortArrow active={subSortKey === "pnl_pct"} dir={subSortDir} />
                          </button>
                          <button className="w-20 text-right cursor-pointer" onClick={() => handleSubSort("pnl")}>
                            손익<SortArrow active={subSortKey === "pnl"} dir={subSortDir} />
                          </button>
                          <span className="w-14 text-right">사유</span>
                        </div>
                        {/* 서브 매매 행 */}
                        {getSortedSubTrades(agg.trades).map((t, j) => {
                          const origIdx = agg.trades.indexOf(t)
                          const isBest = origIdx === bestIdx && agg.trades.length > 1
                          const isWorst = origIdx === worstIdx && agg.trades.length > 1
                          return (
                            <div
                              key={j}
                              className={cn(
                                "flex items-center text-[11px] py-0.5 rounded",
                                isBest && "bg-red-50",
                                isWorst && "bg-blue-50",
                              )}
                            >
                              <span className="flex-1 truncate">{t.entry_date?.slice(5, 10)}</span>
                              <span className="w-16 text-right text-muted-foreground">{t.exit_date?.slice(5, 10)}</span>
                              <span className="w-10 text-right text-muted-foreground">{t.holding_days}일</span>
                              <span className={cn("w-14 text-right font-medium", t.pnl_pct >= 0 ? "text-red-500" : "text-blue-500")}>
                                {t.pnl_pct >= 0 ? "+" : ""}{t.pnl_pct.toFixed(1)}%
                              </span>
                              <span className={cn("w-20 text-right", t.pnl >= 0 ? "text-red-500" : "text-blue-500")}>
                                {t.pnl >= 0 ? "+" : ""}{Math.round(t.pnl).toLocaleString()}
                              </span>
                              <span className="w-14 text-right text-[10px] text-muted-foreground truncate">
                                {EXIT_REASON_LABELS[t.scale_step ?? ""] || EXIT_REASON_LABELS[t.exit_reason ?? ""] || t.exit_reason?.slice(0, 4) || "-"}
                              </span>
                            </div>
                          )
                        })}
                        {/* 청산사유 요약 */}
                        <div className="flex flex-wrap gap-1 pt-1 border-t">
                          {Object.entries(
                            agg.trades.reduce((acc, t) => {
                              const key = t.scale_step || t.exit_reason || "기타"
                              acc[key] = (acc[key] || 0) + 1
                              return acc
                            }, {} as Record<string, number>),
                          ).map(([k, v]) => (
                            <Badge key={k} variant="outline" className="text-[9px] px-1.5 py-0">
                              {EXIT_REASON_LABELS[k] || k.slice(0, 6)} ×{v}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })
            : sortedIndividual.map((trade, i) => {
                const isExpanded = expandedIdx === i
                const symAgg = getSymbolAgg(trade.symbol)
                return (
                  <div key={`${trade.symbol}-${trade.entry_date}-${i}`}>
                    <div
                      className={cn(
                        "flex items-center px-4 py-2 text-xs cursor-pointer hover:bg-muted/50 transition-colors",
                        isExpanded && "bg-muted/30",
                      )}
                      onClick={() => setExpandedIdx(isExpanded ? null : i)}
                    >
                      <span className="w-6 text-muted-foreground">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <span className="font-medium truncate">{trade.name || trade.symbol}</span>
                      </div>
                      <span className="w-16 text-right text-muted-foreground">{trade.entry_date?.slice(5, 10)}</span>
                      <span className="w-10 text-right text-muted-foreground">{trade.holding_days}일</span>
                      <span
                        className={cn(
                          "w-16 text-right font-medium",
                          trade.pnl_pct >= 0 ? "text-red-500" : "text-blue-500",
                        )}
                      >
                        {trade.pnl_pct >= 0 ? "+" : ""}{trade.pnl_pct.toFixed(1)}%
                      </span>
                      <span
                        className={cn(
                          "w-20 text-right",
                          trade.pnl >= 0 ? "text-red-500" : "text-blue-500",
                        )}
                      >
                        {trade.pnl >= 0 ? "+" : ""}{Math.round(trade.pnl).toLocaleString()}
                      </span>
                    </div>

                    {/* 확장: 차트 + 스냅샷 + 종목 합산 */}
                    {isExpanded && (
                      <div className="border-t border-b bg-muted/10 px-4 py-3 space-y-3">
                        <TradeJournalChart trade={trade} interval={interval} />
                        <SnapshotGrid entry={trade.entry_snapshot} exit={trade.exit_snapshot} />
                        {symAgg && (
                          <div className="text-[11px] text-muted-foreground border-t pt-2">
                            이 종목 전체:{" "}
                            <span className="font-medium text-foreground">{symAgg.count}건</span>,{" "}
                            승률 <span className="font-medium">{symAgg.winRate.toFixed(0)}%</span>,{" "}
                            총손익{" "}
                            <span className={cn("font-medium", symAgg.pnl >= 0 ? "text-red-500" : "text-blue-500")}>
                              {symAgg.pnl >= 0 ? "+" : ""}{Math.round(symAgg.pnl).toLocaleString()}원
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
        </div>

        {/* Footer */}
        <div className="border-t px-4 py-1.5 text-[10px] text-muted-foreground">
          전체 {aggregates.length}종목, {closedTrades.length}건 매매
        </div>
      </CardContent>
    </Card>
  )
}

export default BacktestRankingBoard
