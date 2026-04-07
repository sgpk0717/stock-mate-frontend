import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function FeatureUsageGrid({ usage }: { usage: Record<string, number> }) {
  const sorted = Object.entries(usage).sort((a, b) => b[1] - a[1])
  const maxCount = Math.max(...sorted.map(([, v]) => v), 1)

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">파생 피처 활용률</CardTitle>
        <CardDescription className="text-xs">이번 업그레이드에서 추가된 15개 파생 피처(수급 EMA, 재무 decay, 뉴스 EMA 등)가 실제 팩터 수식에 얼마나 사용되고 있는지. 색이 진할수록 많이 사용됨.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-2">
          {sorted.map(([name, count]) => {
            const intensity = count / maxCount
            const bg = count > 0
              ? `rgba(64, 86, 244, ${0.1 + intensity * 0.5})`
              : "#f9fafb"
            return (
              <div
                key={name}
                className="rounded px-2 py-1.5 text-xs"
                style={{ backgroundColor: bg }}
              >
                <div className="font-medium truncate">{name}</div>
                <div className="text-gray-600">{count}회</div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
