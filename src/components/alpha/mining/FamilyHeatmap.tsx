import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { MiningReport } from "@/types/alpha"

const FAMILIES = ["price", "volume", "momentum", "volatility", "supply", "fundamental", "sentiment", "market_micro"]
const FAMILY_LABELS: Record<string, string> = {
  price: "가격", volume: "거래량", momentum: "모멘텀", volatility: "변동성",
  supply: "수급", fundamental: "재무", sentiment: "감성", market_micro: "미시구조",
}

export function FamilyHeatmap({ reports }: { reports: MiningReport[] }) {
  if (!reports.length) return null

  const maxPct = Math.max(
    ...reports.flatMap((r) => Object.values(r.family_distribution || {})),
    0.01
  )

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">패밀리 다양성 히트맵</CardTitle>
        <CardDescription className="text-xs">세대별 피처 패밀리 비율 변화. 특정 행이 진해지면 해당 패밀리로 수렴 중. 골고루 분산되어야 건강.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="flex">
            <div className="flex flex-col shrink-0 w-16 text-xs text-right pr-1 gap-0.5">
              {FAMILIES.map((f) => (
                <div key={f} className="h-5 flex items-center justify-end">{FAMILY_LABELS[f]}</div>
              ))}
            </div>
            <div className="flex gap-px overflow-x-auto">
              {reports.map((r) => (
                <div key={r.generation} className="flex flex-col gap-px shrink-0" title={`Gen ${r.generation}`}>
                  {FAMILIES.map((f) => {
                    const val = r.family_distribution?.[f] || 0
                    const intensity = val / maxPct
                    return (
                      <div
                        key={f}
                        className="w-4 h-5 rounded-sm"
                        style={{ backgroundColor: `rgba(64, 86, 244, ${0.05 + intensity * 0.85})` }}
                        title={`${FAMILY_LABELS[f]}: ${(val * 100).toFixed(0)}%`}
                      />
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
          <div className="flex mt-1 text-[10px] text-gray-400">
            <div className="w-16" />
            <div className="flex-1 flex justify-between">
              <span>Gen {reports[0]?.generation}</span>
              <span>Gen {reports[reports.length - 1]?.generation}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
