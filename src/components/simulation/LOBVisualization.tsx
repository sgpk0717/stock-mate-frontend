import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { StressTestResults } from "@/types/simulation"

interface LOBVisualizationProps {
  results: StressTestResults | null
}

function LOBVisualization({ results }: LOBVisualizationProps) {
  const [stepIdx, setStepIdx] = useState(0)

  if (!results?.depth_series?.length) return null

  const maxIdx = results.depth_series.length - 1
  const currentDepth = results.depth_series[stepIdx]
  if (!currentDepth) return null

  const bids = currentDepth.bids ?? []
  const asks = currentDepth.asks ?? []

  // 최대 수량 (바 스케일링 용)
  const allQty = [...bids.map((b) => b[1]), ...asks.map((a) => a[1])]
  const maxQty = Math.max(...allQty, 1)

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">호가 깊이</CardTitle>
          <span className="text-xs text-muted-foreground">
            스냅샷 {stepIdx + 1} / {maxIdx + 1}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* 슬라이더 */}
        <input
          type="range"
          min={0}
          max={maxIdx}
          value={stepIdx}
          onChange={(e) => setStepIdx(Number(e.target.value))}
          className="w-full accent-primary"
        />

        {/* 호가 깊이 바 */}
        <div className="space-y-0.5">
          {/* 매도호가 (위에서 아래로) */}
          {[...asks].reverse().map(([price, qty], i) => (
            <div key={`ask-${i}`} className="flex items-center gap-2 text-xs">
              <span className="w-16 text-right text-blue-500">
                {price.toLocaleString()}
              </span>
              <div className="relative h-4 flex-1">
                <div
                  className="absolute inset-y-0 right-0 rounded-sm bg-blue-500/20"
                  style={{ width: `${(qty / maxQty) * 100}%` }}
                />
                <span className="absolute right-1 top-0 text-[10px] text-blue-500/70">
                  {qty.toLocaleString()}
                </span>
              </div>
            </div>
          ))}

          {/* 구분선 */}
          <div className="my-1 border-t" />

          {/* 매수호가 (위에서 아래로) */}
          {bids.map(([price, qty], i) => (
            <div key={`bid-${i}`} className="flex items-center gap-2 text-xs">
              <span className="w-16 text-right text-red-500">
                {price.toLocaleString()}
              </span>
              <div className="relative h-4 flex-1">
                <div
                  className="absolute inset-y-0 left-0 rounded-sm bg-red-500/20"
                  style={{ width: `${(qty / maxQty) * 100}%` }}
                />
                <span className="absolute left-1 top-0 text-[10px] text-red-500/70">
                  {qty.toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default LOBVisualization
