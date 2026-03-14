import { useEffect, useRef } from "react"
import {
  AreaSeries,
  createChart,
  createSeriesMarkers,
  type IChartApi,
  type ISeriesApi,
  type ISeriesMarkersPluginApi,
  type SeriesMarker,
  type Time,
} from "lightweight-charts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Term } from "@/components/ui/term"
import type { BacktestTrade } from "@/types"

interface BacktestEquityCurveProps {
  equityCurve: Array<{ date: string; equity: number }> | null
  trades?: BacktestTrade[] | null
}

const MARKER_COLORS: Record<string, string> = {
  "S-HALF": "#4056F4",
  "S-TRAIL": "#22c55e",
  "S-STOP": "#ef4444",
}

const MARKER_LABELS: Record<string, string> = {
  "S-HALF": "익절",
  "S-TRAIL": "트레일링",
  "S-STOP": "손절",
}

function BacktestEquityCurve({ equityCurve, trades }: BacktestEquityCurveProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<"Area"> | null>(null)
  const markersRef = useRef<ISeriesMarkersPluginApi<Time> | null>(null)

  // 차트 인스턴스 생성 (한 번만)
  useEffect(() => {
    if (!containerRef.current) return

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: 300,
      layout: {
        background: { color: "transparent" },
        textColor: "#71717a",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: "#f4f4f5" },
        horzLines: { color: "#f4f4f5" },
      },
      rightPriceScale: {
        borderColor: "#e4e4e7",
      },
      timeScale: {
        borderColor: "#e4e4e7",
        timeVisible: false,
      },
      crosshair: {
        horzLine: { labelBackgroundColor: "#4056F4" },
        vertLine: { labelBackgroundColor: "#4056F4" },
      },
    })

    const series = chart.addSeries(AreaSeries, {
      lineColor: "#4056F4",
      topColor: "rgba(64, 86, 244, 0.3)",
      bottomColor: "rgba(64, 86, 244, 0.02)",
      lineWidth: 2,
    })

    chartRef.current = chart
    seriesRef.current = series

    const handleResize = () => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth })
      }
    }
    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
      if (markersRef.current) {
        markersRef.current.detach()
        markersRef.current = null
      }
      chart.remove()
    }
  }, [])

  // 데이터 + 마커 업데이트
  useEffect(() => {
    if (!seriesRef.current || !equityCurve?.length) return

    // 분봉 데이터 여부 감지 (datetime 문자열에 시간 포함)
    const isIntraday =
      equityCurve[0].date.includes(" ") || equityCurve[0].date.includes("T")

    // datetime → UTCTimestamp (초), date → 문자열 그대로
    const toTime = (s: string): Time => {
      if (isIntraday) {
        const iso = s.replace(" ", "T")
        return (Math.floor(new Date(iso).getTime() / 1000)) as unknown as Time
      }
      return s as Time
    }

    // 분봉: 시간 축 표시 활성화
    chartRef.current?.applyOptions({
      timeScale: {
        borderColor: "#e4e4e7",
        timeVisible: isIntraday,
        secondsVisible: false,
      },
    })

    // 분봉 데이터가 많을 경우 다운샘플링 (5000포인트 이하로)
    let curveData = equityCurve
    if (curveData.length > 5000) {
      const step = Math.ceil(curveData.length / 5000)
      curveData = curveData.filter((_, i) => i % step === 0 || i === curveData.length - 1)
    }

    const data = curveData.map((p) => ({
      time: toTime(p.date),
      value: p.equity,
    }))

    seriesRef.current.setData(data)

    // 마커 생성 (exit_date가 있고 scale_step이 있는 완결 거래만)
    if (trades?.length) {
      const scaleTrades = trades.filter((t) => t.scale_step && t.exit_date)
      if (scaleTrades.length > 0 && scaleTrades.length <= 500) {
        const equityDates = new Set(curveData.map((p) => p.date))
        const markers: SeriesMarker<Time>[] = scaleTrades
          .filter((t) => t.exit_date && equityDates.has(t.exit_date))
          .map((t) => {
            const step = t.scale_step ?? ""
            return {
              time: toTime(t.exit_date!) as Time,
              position: "aboveBar" as const,
              color: MARKER_COLORS[step] ?? "#71717a",
              shape: "arrowDown" as const,
              text: MARKER_LABELS[step] ?? "",
            }
          })
          .sort((a, b) => (a.time as number) - (b.time as number))

        if (markersRef.current) {
          markersRef.current.setMarkers(markers)
        } else {
          markersRef.current = createSeriesMarkers(
            seriesRef.current,
            markers,
          )
        }
      } else {
        if (markersRef.current) {
          markersRef.current.setMarkers([])
        }
      }
    } else {
      if (markersRef.current) {
        markersRef.current.setMarkers([])
      }
    }

    chartRef.current?.timeScale().fitContent()
  }, [equityCurve, trades])

  if (!equityCurve?.length) return null

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium"><Term>Equity Curve</Term></CardTitle>
      </CardHeader>
      <CardContent>
        <div ref={containerRef} />
      </CardContent>
    </Card>
  )
}

export default BacktestEquityCurve
