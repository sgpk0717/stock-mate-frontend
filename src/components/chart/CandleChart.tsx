import { useEffect, useRef } from "react"
import {
  createChart,
  CandlestickSeries,
  LineSeries,
  HistogramSeries,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from "lightweight-charts"
import type {
  CandleData,
  IndicatorBB,
  IndicatorMACD,
  IndicatorRSI,
  MALineConfig,
  RealtimeTick,
} from "@/types"
import { intervalToSeconds } from "@/lib/interval"

interface CandleChartProps {
  data: CandleData[]
  height?: number
  lastTick?: RealtimeTick | null
  indicators?: {
    rsi?: IndicatorRSI[]
    macd?: IndicatorMACD[]
    bb?: IndicatorBB[]
    [key: string]: Array<{ value: number | null }> | IndicatorMACD[] | IndicatorBB[] | undefined
  }
  activeIndicators?: string[]
  maConfigs?: MALineConfig[]
  interval?: string
}

function CandleChart({
  data,
  height = 400,
  lastTick,
  indicators,
  activeIndicators = [],
  maConfigs,
  interval = "1d",
}: CandleChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const seriesRef = useRef<any>(null)
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null)
  const prevDataKeyRef = useRef("")
  const dataIntervalRef = useRef(interval)
  const indicatorSeriesRef = useRef<
    Map<string, ISeriesApi<"Line"> | ISeriesApi<"Histogram">>
  >(new Map())
  const macdPaneRef = useRef<number>(-1)

  // 차트 인스턴스 생성 (mount 시 1회)
  useEffect(() => {
    if (!containerRef.current) return

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height,
      layout: {
        background: { color: "#ffffff" },
        textColor: "#71717a",
        fontSize: 12,
      },
      grid: {
        vertLines: { color: "#f5f5f5" },
        horzLines: { color: "#f5f5f5" },
      },
      crosshair: {
        vertLine: { color: "#4056F4", width: 1, style: 2 },
        horzLine: { color: "#4056F4", width: 1, style: 2 },
      },
      rightPriceScale: {
        borderColor: "#e5e5e5",
      },
      timeScale: {
        borderColor: "#e5e5e5",
        timeVisible: true,
        secondsVisible: false,
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

    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceScaleId: "volume",
      priceFormat: { type: "volume" },
      lastValueVisible: false,
      priceLineVisible: false,
    })
    chart.priceScale("volume").applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    })

    chartRef.current = chart
    seriesRef.current = series
    volumeSeriesRef.current = volumeSeries

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        chart.applyOptions({ width: entry.contentRect.width })
      }
    })
    observer.observe(containerRef.current)

    return () => {
      observer.disconnect()
      indicatorSeriesRef.current.clear()
      chart.remove()
      chartRef.current = null
      seriesRef.current = null
      volumeSeriesRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // height 변경 반응 (재생성 없이 옵션만 업데이트)
  useEffect(() => {
    chartRef.current?.applyOptions({ height })
  }, [height])

  // 데이터 업데이트 (data 변경 시)
  useEffect(() => {
    if (!seriesRef.current || !data.length) return
    seriesRef.current.setData(data)
    if (volumeSeriesRef.current) {
      volumeSeriesRef.current.setData(
        data.map((c, i) => ({
          time: c.time as UTCTimestamp,
          value: c.volume ?? 0,
          color:
            i === 0 || c.close >= c.open
              ? "rgba(239,68,68,0.3)"
              : "rgba(59,130,246,0.3)",
        })),
      )
    }
    // 현재 데이터가 어떤 인터벌에 속하는지 추적
    dataIntervalRef.current = interval
    // 종목/인터벌이 바뀔 때만 fitContent (지표 토글 시에는 시간 범위 유지)
    const dataKey = `${data[0].time}-${data[data.length - 1].time}-${data.length}`
    if (prevDataKeyRef.current !== dataKey) {
      prevDataKeyRef.current = dataKey
      chartRef.current?.timeScale().fitContent()
    }
  }, [data, interval])

  // 지표 시리즈 업데이트
  useEffect(() => {
    const chart = chartRef.current
    if (!chart || !data.length) return

    // 기존 지표 시리즈 중 비활성화된 것 제거
    for (const [key, series] of indicatorSeriesRef.current) {
      // sma_ 키들은 maConfigs 존재 여부로 관리
      if (key.startsWith("sma_")) {
        if (!maConfigs) {
          chart.removeSeries(series)
          indicatorSeriesRef.current.delete(key)
        }
        continue
      }
      const indName = key.split("_")[0]
      if (!activeIndicators.includes(indName)) {
        chart.removeSeries(series)
        indicatorSeriesRef.current.delete(key)
        if (indName === "macd") macdPaneRef.current = -1
      }
    }

    // 이동평균선 (같은 pane, overlay)
    if (maConfigs && indicators) {
      _renderMA(chart, data, indicators)
    }

    // 볼린저밴드 (같은 pane, overlay)
    if (activeIndicators.includes("bb") && indicators?.bb) {
      _renderBB(chart, data, indicators.bb)
    }

    // RSI (별도 pane)
    if (activeIndicators.includes("rsi") && indicators?.rsi) {
      _renderRSI(chart, data, indicators.rsi)
    }

    // MACD (별도 pane)
    if (activeIndicators.includes("macd") && indicators?.macd) {
      _renderMACD(chart, data, indicators.macd)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, indicators, activeIndicators, maConfigs])

  function _renderMA(
    chart: IChartApi,
    candles: CandleData[],
    allIndicators?: CandleChartProps["indicators"],
  ) {
    if (!maConfigs || !allIndicators) return

    // 현재 활성 MA 키 세트
    const activeKeys = new Set<string>()

    for (const config of maConfigs) {
      if (!config.visible) continue
      const key = `sma_${config.period}`
      activeKeys.add(key)
      const maData = allIndicators[key] as Array<{ value: number | null }> | undefined
      if (!maData) continue

      let series = indicatorSeriesRef.current.get(key) as
        | ISeriesApi<"Line">
        | undefined
      if (!series) {
        series = chart.addSeries(LineSeries, {
          color: config.color,
          lineWidth: config.lineWidth as 1 | 2 | 3 | 4,
          lineStyle: config.lineStyle,
          lastValueVisible: false,
          priceLineVisible: false,
        })
        indicatorSeriesRef.current.set(key, series)
      } else {
        series.applyOptions({
          color: config.color,
          lineWidth: config.lineWidth as 1 | 2 | 3 | 4,
          lineStyle: config.lineStyle,
        })
      }

      const lineData = candles
        .map((c, idx) => {
          const v = maData[idx]?.value
          return v != null
            ? { time: c.time as UTCTimestamp, value: v }
            : null
        })
        .filter(Boolean) as { time: UTCTimestamp; value: number }[]
      series.setData(lineData)
    }

    // 삭제되거나 비활성화된 MA 시리즈 정리
    for (const [key, series] of indicatorSeriesRef.current) {
      if (key.startsWith("sma_") && !activeKeys.has(key)) {
        chart.removeSeries(series)
        indicatorSeriesRef.current.delete(key)
      }
    }
  }

  function _renderBB(
    chart: IChartApi,
    candles: CandleData[],
    bb: IndicatorBB[],
  ) {
    const keys = ["bb_upper", "bb_middle", "bb_lower"] as const
    const colors = ["#94a3b8", "#E3B23C", "#94a3b8"]
    const fields = ["upper", "middle", "lower"] as const

    for (let i = 0; i < 3; i++) {
      let series = indicatorSeriesRef.current.get(keys[i]) as
        | ISeriesApi<"Line">
        | undefined
      if (!series) {
        series = chart.addSeries(LineSeries, {
          color: colors[i],
          lineWidth: 1,
          lastValueVisible: false,
          priceLineVisible: false,
        })
        indicatorSeriesRef.current.set(keys[i], series)
      }
      const lineData = candles
        .map((c, idx) => {
          const v = bb[idx]?.[fields[i]]
          return v != null
            ? { time: c.time as UTCTimestamp, value: v }
            : null
        })
        .filter(Boolean) as { time: UTCTimestamp; value: number }[]
      series.setData(lineData)
    }
  }

  function _renderRSI(
    chart: IChartApi,
    candles: CandleData[],
    rsi: IndicatorRSI[],
  ) {
    let series = indicatorSeriesRef.current.get("rsi_line") as
      | ISeriesApi<"Line">
      | undefined
    if (!series) {
      // paneIndex=1 → 두 번째 pane (캔들 아래)
      series = chart.addSeries(
        LineSeries,
        {
          color: "#8b5cf6",
          lineWidth: 2,
          lastValueVisible: false,
          priceLineVisible: false,
        },
        1,
      )
      indicatorSeriesRef.current.set("rsi_line", series)
    }
    const lineData = candles
      .map((c, idx) => {
        const v = rsi[idx]?.value
        return v != null
          ? { time: c.time as UTCTimestamp, value: v }
          : null
      })
      .filter(Boolean) as { time: UTCTimestamp; value: number }[]
    series.setData(lineData)
  }

  function _renderMACD(
    chart: IChartApi,
    candles: CandleData[],
    macd: IndicatorMACD[],
  ) {
    const rsiExists = indicatorSeriesRef.current.has("rsi_line")
    const paneIdx = rsiExists ? 2 : 1

    // pane이 바뀌면 기존 MACD 시리즈 전부 제거 후 재생성
    if (macdPaneRef.current !== -1 && macdPaneRef.current !== paneIdx) {
      for (const key of ["macd_line", "macd_signal", "macd_hist"]) {
        const s = indicatorSeriesRef.current.get(key)
        if (s) {
          chart.removeSeries(s)
          indicatorSeriesRef.current.delete(key)
        }
      }
    }
    macdPaneRef.current = paneIdx

    // MACD line
    let macdLine = indicatorSeriesRef.current.get("macd_line") as
      | ISeriesApi<"Line">
      | undefined
    if (!macdLine) {
      macdLine = chart.addSeries(
        LineSeries,
        {
          color: "#4056F4",
          lineWidth: 2,
          lastValueVisible: false,
          priceLineVisible: false,
        },
        paneIdx,
      )
      indicatorSeriesRef.current.set("macd_line", macdLine)
    }
    const macdData = candles
      .map((c, idx) => {
        const v = macd[idx]?.macd
        return v != null
          ? { time: c.time as UTCTimestamp, value: v }
          : null
      })
      .filter(Boolean) as { time: UTCTimestamp; value: number }[]
    macdLine.setData(macdData)

    // Signal line
    let signalLine = indicatorSeriesRef.current.get("macd_signal") as
      | ISeriesApi<"Line">
      | undefined
    if (!signalLine) {
      signalLine = chart.addSeries(
        LineSeries,
        {
          color: "#E3B23C",
          lineWidth: 1,
          lastValueVisible: false,
          priceLineVisible: false,
        },
        paneIdx,
      )
      indicatorSeriesRef.current.set("macd_signal", signalLine)
    }
    const signalData = candles
      .map((c, idx) => {
        const v = macd[idx]?.signal
        return v != null
          ? { time: c.time as UTCTimestamp, value: v }
          : null
      })
      .filter(Boolean) as { time: UTCTimestamp; value: number }[]
    signalLine.setData(signalData)

    // Histogram
    let histSeries = indicatorSeriesRef.current.get("macd_hist") as
      | ISeriesApi<"Histogram">
      | undefined
    if (!histSeries) {
      histSeries = chart.addSeries(
        HistogramSeries,
        {
          lastValueVisible: false,
          priceLineVisible: false,
        },
        paneIdx,
      )
      indicatorSeriesRef.current.set("macd_hist", histSeries)
    }
    const histData = candles
      .map((c, idx) => {
        const v = macd[idx]?.histogram
        return v != null
          ? {
              time: c.time as UTCTimestamp,
              value: v,
              color: v >= 0 ? "#ef4444" : "#3b82f6",
            }
          : null
      })
      .filter(Boolean) as {
      time: UTCTimestamp
      value: number
      color: string
    }[]
    histSeries.setData(histData)
  }

  // 실시간 틱으로 마지막 캔들 업데이트
  useEffect(() => {
    if (!seriesRef.current || !lastTick || !data.length) return

    // placeholderData로 이전 인터벌 데이터가 남아있을 때 update 방지
    // (예: 일봉→주봉 전환 시 일봉 데이터에 주봉 버킷 시간을 넣으면 크래시)
    if (dataIntervalRef.current !== interval) return

    const bucketSeconds = intervalToSeconds(interval)
    const now = Math.floor(Date.now() / 1000) + 9 * 3600 // KST 오프셋
    const currentBucket = Math.floor(now / bucketSeconds) * bucketSeconds
    const lastCandle = data[data.length - 1]

    const volColor =
      lastTick.price >= lastCandle.open
        ? "rgba(239,68,68,0.3)"
        : "rgba(59,130,246,0.3)"

    try {
      if (lastCandle.time === currentBucket) {
        seriesRef.current.update({
          time: currentBucket as UTCTimestamp,
          open: lastCandle.open,
          high: Math.max(lastCandle.high, lastTick.price),
          low: Math.min(lastCandle.low, lastTick.price),
          close: lastTick.price,
        })
        volumeSeriesRef.current?.update({
          time: currentBucket as UTCTimestamp,
          value: lastTick.volume,
          color: volColor,
        })
      } else if (currentBucket > lastCandle.time) {
        seriesRef.current.update({
          time: currentBucket as UTCTimestamp,
          open: lastTick.price,
          high: lastTick.price,
          low: lastTick.price,
          close: lastTick.price,
        })
        volumeSeriesRef.current?.update({
          time: currentBucket as UTCTimestamp,
          value: lastTick.volume,
          color: volColor,
        })
      } else {
        seriesRef.current.update({
          time: lastCandle.time as UTCTimestamp,
          open: lastCandle.open,
          high: Math.max(lastCandle.high, lastTick.price),
          low: Math.min(lastCandle.low, lastTick.price),
          close: lastTick.price,
        })
        volumeSeriesRef.current?.update({
          time: lastCandle.time as UTCTimestamp,
          value: lastTick.volume,
          color: volColor,
        })
      }
    } catch {
      // 인터벌 전환 중 타이밍 이슈로 발생할 수 있는 에러 무시
    }
  }, [lastTick, data, interval])

  return (
    <div className="relative">
      {maConfigs && maConfigs.filter((c) => c.visible).length > 0 && (
        <div className="absolute top-1 left-1 z-10 flex gap-2.5 pointer-events-none">
          {maConfigs
            .filter((c) => c.visible)
            .map((c) => (
              <div key={c.id} className="flex items-center gap-1">
                <span
                  className="inline-block w-3 h-0.5 rounded-full"
                  style={{ backgroundColor: c.color }}
                />
                <span className="text-[10px] text-muted-foreground">
                  {c.period}
                </span>
              </div>
            ))}
        </div>
      )}
      <div ref={containerRef} />
    </div>
  )
}

export default CandleChart
