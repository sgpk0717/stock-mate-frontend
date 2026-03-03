import { useEffect, useRef } from "react"
import {
  createChart,
  LineSeries,
  HistogramSeries,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from "lightweight-charts"
import type { TickDataPoint, RealtimeTick } from "@/types"

interface TickChartProps {
  data?: TickDataPoint[]
  height?: number
  lastTick?: RealtimeTick | null
}

function TickChart({ data = [], height = 460, lastTick }: TickChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const lineSeriesRef = useRef<ISeriesApi<"Line"> | null>(null)
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null)

  // 차트 인스턴스 생성
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
        secondsVisible: true,
        fixLeftEdge: true,
        fixRightEdge: true,
      },
    })

    const lineSeries = chart.addSeries(LineSeries, {
      color: "#4056F4",
      lineWidth: 2,
      lastValueVisible: true,
      priceLineVisible: true,
      priceLineColor: "#4056F4",
    })

    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceScaleId: "volume",
      priceFormat: { type: "volume" },
      lastValueVisible: false,
      priceLineVisible: false,
    })
    chart.priceScale("volume").applyOptions({
      scaleMargins: { top: 0.85, bottom: 0 },
    })

    chartRef.current = chart
    lineSeriesRef.current = lineSeries
    volumeSeriesRef.current = volumeSeries

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        chart.applyOptions({ width: entry.contentRect.width })
      }
    })
    observer.observe(containerRef.current)

    return () => {
      observer.disconnect()
      chart.remove()
      chartRef.current = null
      lineSeriesRef.current = null
      volumeSeriesRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // height 변경 반응 (재생성 없이 옵션만 업데이트)
  useEffect(() => {
    chartRef.current?.applyOptions({ height })
  }, [height])

  // REST 데이터 반영
  useEffect(() => {
    if (!lineSeriesRef.current || !data.length) return

    lineSeriesRef.current.setData(
      data.map((t) => ({
        time: t.time as UTCTimestamp,
        value: t.price,
      })),
    )

    if (volumeSeriesRef.current) {
      volumeSeriesRef.current.setData(
        data.map((t, i) => ({
          time: t.time as UTCTimestamp,
          value: t.volume,
          color:
            i === 0 || t.price >= data[i - 1].price
              ? "rgba(239,68,68,0.3)"
              : "rgba(59,130,246,0.3)",
        })),
      )
    }

    chartRef.current?.timeScale().fitContent()
  }, [data])

  // 실시간 틱 추가
  useEffect(() => {
    if (!lineSeriesRef.current || !lastTick) return

    const now = Math.floor(Date.now() / 1000) + 9 * 3600 // KST

    lineSeriesRef.current.update({
      time: now as UTCTimestamp,
      value: lastTick.price,
    })

    const prevPrice =
      data.length > 0 ? data[data.length - 1].price : lastTick.price
    volumeSeriesRef.current?.update({
      time: now as UTCTimestamp,
      value: lastTick.volume,
      color:
        lastTick.price >= prevPrice
          ? "rgba(239,68,68,0.3)"
          : "rgba(59,130,246,0.3)",
    })
  }, [lastTick, data])

  return <div ref={containerRef} />
}

export default TickChart
