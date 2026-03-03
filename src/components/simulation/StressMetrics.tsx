import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { StressTestMetrics } from "@/types/simulation"

interface StressMetricsProps {
  metrics: StressTestMetrics | null
}

function MetricCard({
  title,
  value,
  suffix,
  highlight,
}: {
  title: string
  value: string
  suffix?: string
  highlight?: "positive" | "negative" | "neutral"
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-normal text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p
          className={cn(
            "text-xl font-bold",
            highlight === "positive" && "text-red-500",
            highlight === "negative" && "text-blue-500",
            highlight === "neutral" && "text-foreground",
          )}
        >
          {value}
          {suffix && (
            <span className="ml-0.5 text-sm font-normal">{suffix}</span>
          )}
        </p>
      </CardContent>
    </Card>
  )
}

function StressMetrics({ metrics }: StressMetricsProps) {
  if (!metrics) return null

  const pnl = metrics.strategy_pnl_pct ?? 0
  const mdd = metrics.max_drawdown ?? 0
  const crashDepth = metrics.crash_depth ?? 0
  const recovery = metrics.recovery_steps ?? 0

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="전략 손익"
          value={`${pnl > 0 ? "+" : ""}${pnl.toFixed(2)}`}
          suffix="%"
          highlight={pnl >= 0 ? "positive" : "negative"}
        />
        <MetricCard
          title="MDD (최대 낙폭)"
          value={mdd.toFixed(2)}
          suffix="%"
          highlight="negative"
        />
        <MetricCard
          title="충격 깊이"
          value={crashDepth.toFixed(2)}
          suffix="%"
          highlight="negative"
        />
        <MetricCard
          title="회복 시간"
          value={recovery.toLocaleString()}
          suffix="스텝"
          highlight={recovery === 0 ? "negative" : "neutral"}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="최종 가격"
          value={metrics.final_price.toLocaleString()}
          highlight="neutral"
        />
        <MetricCard
          title="가격 변화"
          value={`${metrics.price_change_pct > 0 ? "+" : ""}${metrics.price_change_pct.toFixed(2)}`}
          suffix="%"
          highlight={metrics.price_change_pct >= 0 ? "positive" : "negative"}
        />
        <MetricCard
          title="연환산 변동성"
          value={metrics.annualized_volatility.toFixed(2)}
          suffix="%"
          highlight="neutral"
        />
        <MetricCard
          title="평균 스프레드"
          value={metrics.avg_spread.toFixed(1)}
          highlight="neutral"
        />
      </div>
    </div>
  )
}

export default StressMetrics
