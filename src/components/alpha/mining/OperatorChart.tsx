import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"

export function OperatorChart({ stats }: {
  stats: Record<string, { calls: number; avg_fitness_delta: number }>
}) {
  const chartData = Object.entries(stats)
    .map(([name, s]) => ({
      name: name.replace("ast_", "").replace("llm_", "LLM:"),
      calls: s.calls,
      delta: Number(s.avg_fitness_delta.toFixed(4)),
    }))
    .sort((a, b) => b.delta - a.delta)
    .slice(0, 7)

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">연산자 효율</CardTitle>
        <CardDescription className="text-xs">진화 연산자별 적합도 개선 기여도(천분율). 높을수록 해당 연산자가 팩터 품질 향상에 효과적. LLM 접두사는 Claude/Gemini 기반 연산자.</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} layout="vertical">
            <XAxis type="number" tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 10 }} />
            <Tooltip
              formatter={(v: number, name: string) => [
                name === "calls" ? `${v}회` : `${v}‰`,
                name === "calls" ? "호출" : "Δfitness",
              ]}
            />
            <Bar dataKey="delta" fill="#4056F4" name="Δfitness (‰)" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
