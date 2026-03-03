import { useEffect, useRef } from "react"
import { createChart, type IChartApi, HistogramSeries } from "lightweight-charts"
import type { NewsSentimentDaily } from "@/types/news"

interface NewsSentimentChartProps {
  data: NewsSentimentDaily[]
  height?: number
}

function NewsSentimentChart({ data, height = 120 }: NewsSentimentChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const chart = createChart(containerRef.current, {
      height,
      layout: {
        background: { color: "transparent" },
        textColor: "#888",
        fontSize: 10,
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { color: "#f0f0f0" },
      },
      timeScale: {
        borderVisible: false,
      },
      rightPriceScale: {
        borderVisible: false,
      },
    })

    const series = chart.addSeries(HistogramSeries, {
      priceFormat: { type: "price", precision: 3, minMove: 0.001 },
    })

    const chartData = data
      .map((d) => ({
        time: d.date as string,
        value: d.event_score,
        color: d.event_score >= 0 ? "#4056F4" : "#ef4444",
      }))
      .sort((a, b) => a.time.localeCompare(b.time))

    series.setData(chartData)
    chart.timeScale().fitContent()
    chartRef.current = chart

    return () => {
      chart.remove()
      chartRef.current = null
    }
  }, [data, height])

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
        감성 데이터가 없습니다.
      </div>
    )
  }

  return (
    <div>
      <p className="mb-1 text-xs font-medium text-muted-foreground">
        이벤트 스코어 추이
      </p>
      <div ref={containerRef} />
    </div>
  )
}

export default NewsSentimentChart
