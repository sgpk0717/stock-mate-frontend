import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts"
import type { IcTrendPoint } from "@/types/alpha"

export function IcTrendChart({ data }: { data: IcTrendPoint[] }) {
  if (!data.length) return null

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">IC 추이</CardTitle>
        <CardDescription className="text-xs">세대별 평균 IC(파랑)와 최고 IC(금색) 변화. 우상향이면 진화가 효과적으로 진행 중, 정체되면 탐색 전략 변경 필요.</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="gen" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} domain={["auto", "auto"]} />
            <Tooltip
              formatter={(v: number, name: string) => [v.toFixed(4), name]}
            />
            <Line
              type="monotone"
              dataKey="avg_ic"
              name="평균 IC"
              stroke="#4056F4"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
            <Line
              type="monotone"
              dataKey="best_ic"
              name="최고 IC"
              stroke="#E3B23C"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
