import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { MiningReport } from "@/types/alpha"

export function ExecutiveSummary({ data }: { data: MiningReport }) {
  const { generation, elapsed, total_discovered, funnel, discovered_factors } = data
  const bestIc = Math.max(...discovered_factors.map((f) => f.ic_mean), 0)
  const bestSharpe = Math.max(...discovered_factors.map((f) => f.sharpe), 0)
  const rate = funnel.attempted > 0
    ? ((discovered_factors.length / funnel.attempted) * 100).toFixed(1)
    : "0"

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold">
            Gen {generation}
            {elapsed && <span className="ml-2 text-sm font-normal text-gray-500">{elapsed}</span>}
          </h3>
          <Badge variant={discovered_factors.length > 0 ? "default" : "secondary"}>
            {discovered_factors.length > 0 ? `${discovered_factors.length}개 발견` : "탐색 중"}
          </Badge>
        </div>
        <div className="grid grid-cols-4 gap-3">
          <div className="text-center">
            <div className="text-2xl font-bold">{total_discovered}</div>
            <div className="text-xs text-gray-500">총 발견</div>
          </div>
          <div className="text-center" title="Information Coefficient — 팩터의 미래 수익률 예측력. 0.03 이상이면 유효, 0.05 이상이면 우수.">
            <div className="text-2xl font-bold">{bestIc.toFixed(4)}</div>
            <div className="text-xs text-gray-500">최고 IC</div>
          </div>
          <div className="text-center" title="Long-only 포트폴리오의 연환산 위험 대비 수익. 1.0 이상이면 우수.">
            <div className="text-2xl font-bold">{bestSharpe.toFixed(2)}</div>
            <div className="text-xs text-gray-500">최고 Sharpe</div>
          </div>
          <div className="text-center" title="생성된 후보 중 모든 검증(IC, CPCV, 인과)을 통과한 비율.">
            <div className="text-2xl font-bold">{rate}%</div>
            <div className="text-xs text-gray-500">통과율</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
