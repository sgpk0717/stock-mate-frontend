import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"

const COLORS = [
  "#4056F4", "#E3B23C", "#6B7280", "#3B82F6",
  "#10B981", "#F59E0B", "#EF4444", "#8B5CF6",
]

const FAMILY_LABELS: Record<string, string> = {
  price: "가격", volume: "거래량", momentum: "모멘텀",
  volatility: "변동성", supply: "수급", fundamental: "재무",
  sentiment: "감성", market_micro: "미시구조",
}

export function NicheDonut({ distribution, delta }: {
  distribution: Record<string, number>
  delta: Record<string, number>
}) {
  const chartData = Object.entries(distribution)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({
      name: FAMILY_LABELS[name] || name,
      value: Math.round(value * 100),
      delta: Math.round((delta[name] || 0) * 100),
    }))
    .sort((a, b) => b.value - a.value)

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">패밀리 분포</CardTitle>
        <CardDescription className="text-xs">모집단 팩터들이 어떤 데이터 카테고리를 주로 사용하는지 비율. 골고루 분산될수록 다양한 알파 탐색이 이루어지고 있다는 의미.</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              dataKey="value"
              label={({ name, value }) => `${name} ${value}%`}
              labelLine={false}
            >
              {chartData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number, name: string, props: any) => {
                const d = props.payload.delta
                const sign = d > 0 ? "+" : ""
                return [`${value}% (${sign}${d}pp)`, name]
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
