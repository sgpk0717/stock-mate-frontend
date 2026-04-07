import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts"
import type { MiningReport } from "@/types/alpha"

export function DiscoveryRateTrend({ reports }: { reports: MiningReport[] }) {
  const data = reports.map((r) => ({
    gen: r.generation,
    rate: r.funnel.attempted > 0
      ? Number(((r.discovered_factors.length / r.funnel.attempted) * 100).toFixed(1))
      : 0,
    discovered: r.discovered_factors.length,
  }))

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">발견률 추이</CardTitle>
        <CardDescription className="text-xs">세대별 후보 대비 합격 비율(%). 하락 추세면 탐색 공간이 소진되고 있다는 신호.</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="gen" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} unit="%" />
            <Tooltip formatter={(v: number) => [`${v}%`, "발견률"]} />
            <Line type="monotone" dataKey="rate" stroke="#4056F4" strokeWidth={2} dot={{ r: 2 }} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
