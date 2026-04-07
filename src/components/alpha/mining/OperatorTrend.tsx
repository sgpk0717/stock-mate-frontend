import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts"
import type { MiningReport } from "@/types/alpha"

const OP_COLORS: Record<string, string> = {
  mutate_feature: "#4056F4",
  mutate_operator: "#3B82F6",
  mutate_constant: "#6B7280",
  mutate_function: "#10B981",
  crossover: "#E3B23C",
  hoist: "#F59E0B",
  ephemeral_constant: "#8B5CF6",
  "LLM:seed": "#EF4444",
  "LLM:mutate": "#EC4899",
  "LLM:crossover": "#F97316",
}

export function OperatorTrend({ reports }: { reports: MiningReport[] }) {
  const allOps = new Set<string>()
  reports.forEach((r) => {
    Object.keys(r.operator_stats || {}).forEach((op) => {
      allOps.add(op.replace("ast_", "").replace("llm_", "LLM:"))
    })
  })
  const ops = Array.from(allOps)

  const data = reports.map((r) => {
    const point: Record<string, number> = { gen: r.generation }
    Object.entries(r.operator_stats || {}).forEach(([op, stats]) => {
      const key = op.replace("ast_", "").replace("llm_", "LLM:")
      point[key] = Number((stats.avg_fitness_delta * stats.calls).toFixed(2))
    })
    return point
  })

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">연산자 기여도 추이</CardTitle>
        <CardDescription className="text-xs">세대별 각 진화 연산자의 적합도 기여 총량. 특정 연산자가 사라지면 해당 전략이 소진된 것.</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="gen" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            {ops.map((op) => (
              <Area
                key={op}
                type="monotone"
                dataKey={op}
                stackId="1"
                fill={OP_COLORS[op] || "#9CA3AF"}
                stroke={OP_COLORS[op] || "#9CA3AF"}
                fillOpacity={0.6}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
