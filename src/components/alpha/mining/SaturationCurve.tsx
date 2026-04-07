import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts"
import type { MiningReport } from "@/types/alpha"

export function SaturationCurve({ reports }: { reports: MiningReport[] }) {
  const data = reports.map((r) => ({
    gen: r.generation,
    total: r.total_discovered,
  }))

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">누적 발견 포화 곡선</CardTitle>
        <CardDescription className="text-xs">총 발견 팩터 수의 누적 추이. 기울기가 완만해지면 탐색 공간이 포화 상태에 접근 중.</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="gen" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v: number) => [`${v}개`, "누적 발견"]} />
            <Line type="monotone" dataKey="total" stroke="#E3B23C" strokeWidth={2} dot={{ r: 2 }} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
