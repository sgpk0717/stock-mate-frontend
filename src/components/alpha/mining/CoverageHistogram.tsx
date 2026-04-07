import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { CoverageHealth } from "@/types/alpha"

export function CoverageHistogram({ data }: { data: CoverageHealth }) {
  const tiers = [
    { label: "A (>80%)", ...data.tier_a, color: "#10B981" },
    { label: "B (50-80%)", ...data.tier_b, color: "#F59E0B" },
    { label: "C (<50%)", ...data.tier_c, color: "#EF4444" },
  ]
  const total = tiers.reduce((s, t) => s + t.count, 0) || 1

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">커버리지 건강</CardTitle>
        <CardDescription className="text-xs">팩터가 평가된 기간의 데이터 충분도. A는 80%+, B는 50-80%, C는 50% 미만. A가 많을수록 신뢰할 수 있는 팩터가 많다는 의미.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {tiers.map((tier) => (
          <div key={tier.label}>
            <div className="flex justify-between text-sm mb-1">
              <span>{tier.label}</span>
              <span className="font-medium">{tier.count}개 ({(tier.avg_pct * 100).toFixed(0)}%)</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className="h-2 rounded-full transition-all"
                style={{
                  width: `${(tier.count / total) * 100}%`,
                  backgroundColor: tier.color,
                }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
