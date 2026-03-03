import { useEffect, useRef } from "react"
import {
  createChart,
  createSeriesMarkers,
  LineSeries,
  type ISeriesMarkersPluginApi,
  type SeriesMarker,
  type Time,
} from "lightweight-charts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { StressTestResults } from "@/types/simulation"

interface PriceChartProps {
  results: StressTestResults | null
}

function PriceChart({ results }: PriceChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<ReturnType<typeof createChart> | null>(null)
  const markersRef = useRef<ISeriesMarkersPluginApi<Time> | null>(null)

  useEffect(() => {
    if (!containerRef.current || !results?.price_series?.length) return

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: 300,
      layout: {
        background: { color: "transparent" },
        textColor: "#999",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: "rgba(0,0,0,0.06)" },
        horzLines: { color: "rgba(0,0,0,0.06)" },
      },
      crosshair: { mode: 0 },
      rightPriceScale: { borderColor: "rgba(0,0,0,0.1)" },
      timeScale: { borderColor: "rgba(0,0,0,0.1)" },
    })
    chartRef.current = chart

    const lineSeries = chart.addSeries(LineSeries, {
      color: "#4056F4",
      lineWidth: 2,
      priceFormat: { type: "price", precision: 0, minMove: 1 },
    })

    const data = results.price_series.map((price, i) => ({
      time: i as unknown as Time,
      value: price,
    }))
    lineSeries.setData(data)

    // 시나리오 주입 마커 (Lightweight Charts v5 API)
    if (results.events_injected?.length) {
      const markers: SeriesMarker<Time>[] = results.events_injected.map(
        (evt) => ({
          time: evt.step as unknown as Time,
          position: "aboveBar" as const,
          color: "#E3B23C",
          shape: "arrowDown" as const,
          text: evt.type,
        }),
      )
      markersRef.current = createSeriesMarkers(lineSeries, markers)
    }

    chart.timeScale().fitContent()

    const resizeObserver = new ResizeObserver(() => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth })
      }
    })
    resizeObserver.observe(containerRef.current)

    return () => {
      if (markersRef.current) {
        markersRef.current.detach()
        markersRef.current = null
      }
      resizeObserver.disconnect()
      chart.remove()
    }
  }, [results])

  if (!results?.price_series?.length) return null

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">가격 추이</CardTitle>
      </CardHeader>
      <CardContent>
        <div ref={containerRef} />
      </CardContent>
    </Card>
  )
}

export default PriceChart
