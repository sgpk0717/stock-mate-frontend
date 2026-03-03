import { useMemo, useState, useTransition } from "react"
import { Newspaper, Settings2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Skeleton } from "@/components/ui/skeleton"
import { Term } from "@/components/ui/term"
import CandleChart from "@/components/chart/CandleChart"
import MASettingsPanel from "@/components/chart/MASettingsPanel"
import TickChart from "@/components/chart/TickChart"
import OrderBook from "@/components/order/OrderBook"
import StockSearch from "@/components/stock/StockSearch"
import NewsPanel from "@/components/news/NewsPanel"
import TradeHistory from "@/components/trade/TradeHistory"
import { useCandles, useTicks } from "@/hooks/queries"
import { useChartLayout } from "@/hooks/use-chart-layout"
import { useTickStream, useOrderBookStream } from "@/hooks/use-websocket"
import { useAppStore } from "@/stores/use-app-store"
import { useTickStore } from "@/stores/use-tick-store"
import { formatNumber } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { MALineConfig } from "@/types"

const EMPTY_TICKS: never[] = []

const INTERVALS = [
  { value: "1M", label: "월봉" },
  { value: "1w", label: "주봉" },
  { value: "1d", label: "일봉" },
  { value: "1h", label: "60분" },
  { value: "15m", label: "15분" },
  { value: "5m", label: "5분" },
  { value: "3m", label: "3분" },
  { value: "1m", label: "1분" },
  { value: "tick", label: "틱" },
] as const

type Interval = (typeof INTERVALS)[number]["value"]

const CANDLE_COUNTS: Record<string, number> = {
  "1M": 200,
  "1w": 800,
  "1d": 4000,
  "1h": 500,
  "15m": 500,
  "5m": 500,
  "3m": 500,
  "1m": 500,
}

const INDICATOR_OPTIONS = [
  { value: "rsi", label: "RSI" },
  { value: "macd", label: "MACD" },
  { value: "bb", label: "BB" },
] as const

const DEFAULT_MA_CONFIGS: MALineConfig[] = [
  { id: "1", period: 5, color: "#ef4444", lineWidth: 1, lineStyle: 0, visible: true },
  { id: "2", period: 20, color: "#f97316", lineWidth: 1, lineStyle: 0, visible: true },
  { id: "3", period: 60, color: "#22c55e", lineWidth: 1, lineStyle: 0, visible: true },
  { id: "4", period: 120, color: "#8b5cf6", lineWidth: 1, lineStyle: 0, visible: true },
]

// CardHeader + CardContent 패딩 합산 (사이드 패널 높이 동기화용)
const CARD_CHROME = 74

function ChartPage() {
  const selectedSymbol = useAppStore((s) => s.selectedSymbol)
  const setSelectedSymbol = useAppStore((s) => s.setSelectedSymbol)
  const [isPending, startTransition] = useTransition()
  const [interval, setInterval] = useState<Interval>("1d")
  const [activeIndicators, setActiveIndicators] = useState<string[]>([])
  const [maActive, setMAActive] = useState(false)
  const [maConfigs, setMAConfigs] = useState<MALineConfig[]>(DEFAULT_MA_CONFIGS)
  const [showNews, setShowNews] = useState(false)

  const isTickMode = interval === "tick"

  // MA가 활성이면 visible한 config들의 기간을 sma_N 형식으로 추가
  const maIndicators = maActive
    ? maConfigs.filter((c) => c.visible).map((c) => `sma_${c.period}`)
    : []
  const allIndicators = [...activeIndicators, ...maIndicators]
  const indicatorsParam = allIndicators.length > 0 ? allIndicators : undefined
  const { data: candleResult, isLoading: isCandleLoading } = useCandles(
    isTickMode ? "" : selectedSymbol,
    interval,
    CANDLE_COUNTS[interval] ?? 200,
    indicatorsParam,
  )
  const { data: tickData, isLoading: isTickLoading } = useTicks(
    isTickMode ? selectedSymbol : "",
    5000,
  )

  const candles = candleResult?.candles
  const indicators = candleResult?.indicators
  const isLoading = isTickMode ? isTickLoading : isCandleLoading

  // 종목 전환 시 useTransition으로 UI 멈춤 방지
  function handleSymbolChange(symbol: string) {
    startTransition(() => {
      setSelectedSymbol(symbol)
    })
  }

  function toggleIndicator(ind: string) {
    setActiveIndicators((prev) =>
      prev.includes(ind) ? prev.filter((i) => i !== ind) : [...prev, ind],
    )
  }

  // WebSocket 실시간 구독
  useTickStream(selectedSymbol)
  useOrderBookStream(selectedSymbol)

  // Zustand에서 실시간 데이터 읽기 (stable reference for empty)
  const ticks = useTickStore(
    (s) => s.ticks[selectedSymbol] ?? EMPTY_TICKS,
  )
  const orderBook = useTickStore((s) => s.orderBooks[selectedSymbol])
  const lastTick = ticks.length > 0 ? ticks[ticks.length - 1] : null

  // 현재가 (실시간 틱 > 캔들 마지막 종가 > 틱 데이터 마지막)
  const currentPrice =
    lastTick?.price ??
    (candles && candles.length > 0
      ? candles[candles.length - 1].close
      : null) ??
    (tickData && tickData.length > 0
      ? tickData[tickData.length - 1].price
      : null)

  // 등락 (실시간 틱 > 틱 데이터 기준)
  const change = lastTick?.change ?? 0
  const changePercent =
    currentPrice && candles?.length
      ? ((currentPrice - candles[candles.length - 1].open) /
          candles[candles.length - 1].open) *
        100
      : currentPrice && tickData && tickData.length > 1
        ? ((currentPrice - tickData[0].price) / tickData[0].price) * 100
        : 0

  // OrderBook fallback (stable empty reference)
  const emptyBook = useMemo(
    () => ({ currentPrice: 0, asks: [] as never[], bids: [] as never[] }),
    [],
  )
  const displayOrderBook = orderBook ?? emptyBook

  // 차트 리사이즈 레이아웃
  const defaultChartHeight = activeIndicators.length > 0 ? 560 : 460
  const {
    containerRef,
    chartWidthPx,
    chartHeightPx,
    panelsBelow,
    isDragging,
    panelsFading,
    gripProps,
    cornerGripProps,
    resetLayout,
  } = useChartLayout(defaultChartHeight)

  // 사이드 패널 높이 (차트 Card와 동기화)
  const sidePanelHeight = panelsBelow ? 500 : chartHeightPx + CARD_CHROME

  return (
    <div className="space-y-4">
      {/* 상단: 종목 검색 + 현재가 */}
      <div className="flex flex-wrap items-center gap-4">
        <StockSearch onSelect={handleSymbolChange} />

        <Button
          size="sm"
          variant={showNews ? "default" : "outline"}
          className={cn(
            "h-8 gap-1.5 text-xs",
            showNews && "bg-primary text-white hover:bg-primary/90",
          )}
          onClick={() => setShowNews(!showNews)}
        >
          <Newspaper className="h-3.5 w-3.5" />
          뉴스
        </Button>

        {currentPrice != null && (
          <div className="flex items-baseline gap-3">
            <span className="text-2xl font-bold tabular-nums">
              {formatNumber(currentPrice)}원
            </span>
            <span
              className={cn(
                "text-sm font-medium tabular-nums",
                change > 0
                  ? "text-red-500"
                  : change < 0
                    ? "text-blue-500"
                    : "text-muted-foreground",
              )}
            >
              {change > 0 ? "+" : ""}
              {formatNumber(change)} ({changePercent >= 0 ? "+" : ""}
              {changePercent.toFixed(2)}%)
            </span>
          </div>
        )}
      </div>

      {/* 메인: 차트 + 호가 + 체결정보 (리사이즈 가능) */}
      <div ref={containerRef} className="flex flex-col gap-4">
        {/* 차트 행 (+ 일반 모드 사이드 패널) */}
        <div
          className="grid gap-4"
          style={{
            gridTemplateColumns: panelsBelow
              ? "1fr"
              : `${chartWidthPx}px 280px 240px`,
            transition: isDragging
              ? "none"
              : "grid-template-columns 300ms cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          {/* 캔들 차트 */}
          <Card
            className="relative min-w-0 overflow-visible"
            style={
              panelsBelow
                ? {
                    width: Math.min(chartWidthPx, containerRef.current?.clientWidth ?? chartWidthPx),
                    maxWidth: "100%",
                    transition: isDragging
                      ? "none"
                      : "width 300ms cubic-bezier(0.4, 0, 0.2, 1)",
                  }
                : undefined
            }
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-normal text-muted-foreground">
                  {INTERVALS.find((i) => i.value === interval)?.label} 차트
                </CardTitle>
                {panelsBelow && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-5 px-1.5 text-[10px] text-muted-foreground"
                    onClick={resetLayout}
                  >
                    기본 레이아웃
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-3">
                {/* 지표 토글 (틱 모드에서는 숨김) */}
                {!isTickMode && (
                  <>
                    <div className="flex gap-1">
                      {/* MA 버튼 + 호버 시 설정 아이콘 */}
                      <div className="relative group/ma">
                        <Button
                          size="sm"
                          variant={maActive ? "default" : "ghost"}
                          className={cn(
                            "h-6 px-2 text-xs",
                            maActive &&
                              "bg-primary text-white hover:bg-primary/90",
                          )}
                          onClick={() => setMAActive(!maActive)}
                        >
                          MA
                        </Button>
                        <Popover>
                          <PopoverTrigger asChild>
                            <button
                              type="button"
                              className={cn(
                                "absolute left-1/2 -translate-x-1/2 -bottom-3.5",
                                "h-3.5 w-3.5 flex items-center justify-center rounded",
                                "text-muted-foreground/0 group-hover/ma:text-muted-foreground/50",
                                "hover:!text-muted-foreground transition-colors cursor-pointer",
                              )}
                            >
                              <Settings2 className="h-2.5 w-2.5" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent
                            className="w-auto p-3"
                            align="start"
                            sideOffset={8}
                          >
                            <MASettingsPanel
                              configs={maConfigs}
                              onChange={setMAConfigs}
                            />
                            {maActive && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="w-full mt-2 h-7 text-xs text-muted-foreground"
                                onClick={() => setMAActive(false)}
                              >
                                이동평균선 끄기
                              </Button>
                            )}
                          </PopoverContent>
                        </Popover>
                      </div>

                      {INDICATOR_OPTIONS.map((ind) => (
                        <Button
                          key={ind.value}
                          size="sm"
                          variant={
                            activeIndicators.includes(ind.value) ? "default" : "ghost"
                          }
                          className={cn(
                            "h-6 px-2 text-xs",
                            activeIndicators.includes(ind.value) &&
                              "bg-primary text-white hover:bg-primary/90",
                          )}
                          onClick={() => toggleIndicator(ind.value)}
                        >
                          <Term k={ind.label}>{ind.label}</Term>
                        </Button>
                      ))}
                    </div>

                    <div className="h-4 w-px bg-border" />
                  </>
                )}

                {/* 인터벌 선택 */}
                <div className="flex gap-1">
                  {INTERVALS.map((iv) => (
                    <Button
                      key={iv.value}
                      size="sm"
                      variant={interval === iv.value ? "secondary" : "ghost"}
                      className="h-6 px-2 text-xs"
                      onClick={() => setInterval(iv.value)}
                    >
                      {iv.label}
                    </Button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading || isPending ? (
                <Skeleton className="w-full" style={{ height: chartHeightPx }} />
              ) : isTickMode ? (
                <TickChart
                  data={tickData ?? []}
                  height={chartHeightPx}
                  lastTick={lastTick}
                />
              ) : candles ? (
                <CandleChart
                  data={candles}
                  height={chartHeightPx}
                  lastTick={lastTick}
                  indicators={indicators}
                  activeIndicators={activeIndicators}
                  maConfigs={maActive ? maConfigs : undefined}
                  interval={interval}
                />
              ) : (
                <Skeleton className="w-full" style={{ height: chartHeightPx }} />
              )}
            </CardContent>

            {/* 우측 세로 리사이즈 그립 (가로만 조절) */}
            <div
              {...gripProps}
              role="separator"
              aria-orientation="vertical"
              tabIndex={0}
              className={cn(
                "absolute -right-2 top-0 bottom-8 z-10 w-4",
                "flex items-center justify-center cursor-ew-resize",
                "group",
              )}
            >
              <div
                className={cn(
                  "w-1 h-10 rounded-full transition-all duration-150",
                  "bg-transparent group-hover:bg-muted-foreground/30",
                  isDragging && "bg-primary/50 h-16 w-1.5",
                )}
              />
            </div>

            {/* 우측 하단 코너 리사이즈 핸들 (가로+세로 동시) */}
            <div
              {...cornerGripProps}
              className={cn(
                "absolute -right-2 -bottom-2 z-20 w-5 h-5",
                "cursor-nwse-resize group/corner",
              )}
            >
              <svg
                viewBox="0 0 16 16"
                className={cn(
                  "w-4 h-4 transition-colors duration-150",
                  "text-transparent group-hover/corner:text-muted-foreground/40",
                  isDragging && "text-primary/50",
                )}
              >
                <line x1="14" y1="4" x2="4" y2="14" stroke="currentColor" strokeWidth="1.5" />
                <line x1="14" y1="8" x2="8" y2="14" stroke="currentColor" strokeWidth="1.5" />
                <line x1="14" y1="12" x2="12" y2="14" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </div>
          </Card>

          {/* 일반 모드: 호가창 + 체결정보 (사이드) */}
          {!panelsBelow && (
            <>
              <div className="min-w-0">
                <OrderBook
                  data={{
                    symbol: selectedSymbol,
                    asks: displayOrderBook.asks,
                    bids: displayOrderBook.bids,
                  }}
                  currentPrice={displayOrderBook.currentPrice || undefined}
                  height={sidePanelHeight}
                />
              </div>
              <div className="min-w-0">
                <TradeHistory symbol={selectedSymbol} height={sidePanelHeight} />
              </div>
            </>
          )}
        </div>

        {/* panelsBelow 모드: 하단 패널 */}
        {panelsBelow && (
          <div
            className={cn(
              "grid gap-4 transition-opacity duration-200",
              panelsFading && "opacity-0",
            )}
            style={{ gridTemplateColumns: "1fr 1fr" }}
          >
            <OrderBook
              data={{
                symbol: selectedSymbol,
                asks: displayOrderBook.asks,
                bids: displayOrderBook.bids,
              }}
              currentPrice={displayOrderBook.currentPrice || undefined}
              height={500}
            />
            <TradeHistory symbol={selectedSymbol} height={500} />
          </div>
        )}

        {/* 뉴스 감성 패널 */}
        {showNews && (
          <NewsPanel symbol={selectedSymbol} />
        )}
      </div>
    </div>
  )
}

export default ChartPage
