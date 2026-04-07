import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts"
import type { FunnelData } from "@/types/alpha"

const FUNNEL_COLORS = ["#6B7280", "#3B82F6", "#4056F4", "#E3B23C", "#10B981"]

export function FunnelChart({ data, discovered }: { data: FunnelData; discovered: number }) {
  const chartData = [
    { name: "후보 생성", value: data.attempted },
    { name: "평가 완료", value: data.eval_ok },
    { name: "IC 통과", value: data.ic_pass },
    { name: "CPCV", value: data.cpcv_candidates },
    { name: "최종 합격", value: discovered },
  ]

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">탐색 파이프라인</CardTitle>
        <CardDescription className="text-xs">후보 생성 → 평가 → IC 통과 → CPCV 교차검증 → 최종 합격. 각 단계에서 얼마나 걸러지는지 보여줌.</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} layout="vertical">
            <XAxis type="number" tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="name" width={70} tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {chartData.map((_, i) => (
                <Cell key={i} fill={FUNNEL_COLORS[i]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
