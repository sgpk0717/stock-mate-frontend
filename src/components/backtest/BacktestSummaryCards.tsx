import type { ReactNode } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Term } from "@/components/ui/term"
import { cn } from "@/lib/utils"

interface BacktestSummaryCardsProps {
  metrics: Record<string, number> | null
}

function MetricCard({
  title,
  value,
  suffix,
  highlight,
}: {
  title: ReactNode
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

function BacktestSummaryCards({ metrics }: BacktestSummaryCardsProps) {
  if (!metrics) return null

  const totalReturn = metrics.total_return ?? 0
  const mdd = metrics.mdd ?? 0
  const winRate = metrics.win_rate ?? 0
  const totalTrades = metrics.total_trades ?? 0

  // 분할매매 지표 (있을 때만 표시)
  const hasScaleMetrics =
    (metrics.scale_in_count ?? 0) > 0 ||
    (metrics.partial_exit_count ?? 0) > 0 ||
    (metrics.stop_loss_count ?? 0) > 0

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title={<Term k="총 수익률">총 수익률</Term>}
          value={`${totalReturn > 0 ? "+" : ""}${totalReturn.toFixed(2)}`}
          suffix="%"
          highlight={totalReturn >= 0 ? "positive" : "negative"}
        />
        <MetricCard
          title={<Term k="MDD">MDD (최대 낙폭)</Term>}
          value={mdd.toFixed(2)}
          suffix="%"
          highlight="negative"
        />
        <MetricCard
          title={<Term>승률</Term>}
          value={winRate.toFixed(1)}
          suffix="%"
          highlight="neutral"
        />
        <MetricCard
          title="총 거래 횟수"
          value={totalTrades.toLocaleString()}
          suffix="건"
          highlight="neutral"
        />
      </div>

      {hasScaleMetrics && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title={<Term>확신도</Term>}
            value={(metrics.avg_conviction ?? 0).toFixed(2)}
            highlight="neutral"
          />
          <MetricCard
            title={<Term desc="가격이 내려갔을 때 추가로 더 사는 것">분할매수</Term>}
            value={(metrics.scale_in_count ?? 0).toLocaleString()}
            suffix="건"
            highlight="neutral"
          />
          <MetricCard
            title={<Term>부분익절</Term>}
            value={(metrics.partial_exit_count ?? 0).toLocaleString()}
            suffix="건"
            highlight="neutral"
          />
          <MetricCard
            title={<Term>손절</Term>}
            value={(metrics.stop_loss_count ?? 0).toLocaleString()}
            suffix="건"
            highlight="negative"
          />
        </div>
      )}
    </div>
  )
}

export default BacktestSummaryCards
