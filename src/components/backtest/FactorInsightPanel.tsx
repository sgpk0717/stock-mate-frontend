import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import { cn } from "@/lib/utils"
import type { BacktestTrade } from "@/types"
import {
  computeAllCorrelations,
  computeWinLossStats,
} from "@/lib/statistics"

interface FactorInsightPanelProps {
  trades: BacktestTrade[]
}

/* ── Correlation bar (symmetric around center) ── */
function CorrelationBar({ value }: { value: number }) {
  const pct = Math.min(Math.abs(value) * 100, 50)
  const isPositive = value > 0

  return (
    <div className="relative h-4 w-full">
      {/* center line */}
      <div className="absolute left-1/2 top-0 h-full w-px bg-border" />
      <div
        className={cn(
          "absolute top-0 h-full rounded-sm",
          isPositive ? "bg-red-400/50" : "bg-blue-400/50",
        )}
        style={{
          width: `${pct}%`,
          ...(isPositive
            ? { left: "50%" }
            : { right: "50%" }),
        }}
      />
    </div>
  )
}

/* ── Correlation tab content ── */
function CorrelationTable({
  correlations,
}: {
  correlations: ReturnType<typeof computeAllCorrelations>
}) {
  if (correlations.length === 0) {
    return (
      <p className="py-8 text-center text-xs text-muted-foreground">
        팩터 변수 데이터가 없습니다
      </p>
    )
  }

  return (
    <div className="space-y-0.5">
      {/* Header */}
      <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-medium px-1 pb-1">
        <span className="w-28 shrink-0">변수명</span>
        <span className="w-16 shrink-0 text-right">Pearson r</span>
        <span className="w-16 shrink-0 text-right">Spearman &rho;</span>
        <span className="w-10 shrink-0 text-right">표본</span>
        <span className="flex-1 text-center">시각 바</span>
      </div>
      {correlations.map((c) => {
        const lowSample = c.n < 30
        return (
          <div
            key={c.variable}
            className={cn(
              "flex items-center gap-2 text-xs px-1 py-0.5 rounded hover:bg-muted/50",
              lowSample && "text-amber-500",
            )}
          >
            <span className="w-28 shrink-0 truncate font-medium" title={c.variable}>
              {c.label}
            </span>
            <span className="w-16 shrink-0 text-right font-mono">
              {c.pearson.toFixed(3)}
            </span>
            <span className="w-16 shrink-0 text-right font-mono">
              {c.spearman.toFixed(3)}
            </span>
            <span className="w-10 shrink-0 text-right font-mono">
              {c.n}
              {lowSample && (
                <span className="text-[9px] ml-0.5" title="표본 부족">(부족)</span>
              )}
            </span>
            <div className="flex-1">
              <CorrelationBar value={c.pearson} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ── Win/Loss distribution tab content ── */
function WinLossDistribution({
  stats,
  totalWins,
  totalLosses,
}: {
  stats: ReturnType<typeof computeWinLossStats>
  totalWins: number
  totalLosses: number
}) {
  // Edge cases
  if (totalWins === 0 && totalLosses === 0) {
    return (
      <p className="py-8 text-center text-xs text-muted-foreground">
        팩터 변수 데이터가 없습니다
      </p>
    )
  }

  if (totalLosses === 0) {
    return (
      <div className="py-6 text-center">
        <p className="text-xs text-green-600">
          모든 거래가 수익입니다.
        </p>
      </div>
    )
  }

  if (totalWins === 0) {
    return (
      <div className="py-6 text-center">
        <p className="text-xs text-amber-500">
          모든 거래가 손실입니다. 승-패 비교 불가.
        </p>
      </div>
    )
  }

  if (stats.length === 0) {
    return (
      <p className="py-8 text-center text-xs text-muted-foreground">
        팩터 변수 데이터가 없습니다
      </p>
    )
  }

  // Only show top 15 variables max for readability
  const displayStats = stats.slice(0, 15)

  const chartData = displayStats.map((s) => ({
    name: s.label,
    winMean: Number(s.winMean.toFixed(4)),
    lossMean: Number(s.lossMean.toFixed(4)),
  }))

  const barHeight = Math.max(250, displayStats.length * 28)

  return (
    <div className="space-y-3">
      <p className="text-[10px] text-muted-foreground">
        수익 <span className="font-medium text-red-500">{totalWins}건</span>,
        손실 <span className="font-medium text-blue-500">{totalLosses}건</span>
      </p>
      <ResponsiveContainer width="100%" height={barHeight}>
        <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 20 }}>
          <XAxis type="number" tick={{ fontSize: 10 }} />
          <YAxis
            type="category"
            dataKey="name"
            width={100}
            tick={{ fontSize: 10 }}
          />
          <Tooltip
            contentStyle={{ fontSize: 11 }}
            formatter={(value: number, name: string) => [
              value.toFixed(4),
              name === "winMean" ? "수익 평균" : "손실 평균",
            ]}
          />
          <Legend
            formatter={(value: string) =>
              value === "winMean" ? "수익 평균" : "손실 평균"
            }
            wrapperStyle={{ fontSize: 11 }}
          />
          <Bar dataKey="winMean" fill="#ef4444" radius={[0, 4, 4, 0]} />
          <Bar dataKey="lossMean" fill="#3b82f6" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

/* ── Main component ── */
function FactorInsightPanel({ trades }: FactorInsightPanelProps) {
  const closedTrades = useMemo(
    () => trades.filter((t) => t.exit_date),
    [trades],
  )

  const correlations = useMemo(
    () => computeAllCorrelations(closedTrades),
    [closedTrades],
  )

  const winLossStats = useMemo(
    () => computeWinLossStats(closedTrades),
    [closedTrades],
  )

  const { totalWins, totalLosses } = useMemo(() => {
    let wins = 0
    let losses = 0
    for (const t of closedTrades) {
      if (t.pnl >= 0) wins++
      else losses++
    }
    return { totalWins: wins, totalLosses: losses }
  }, [closedTrades])

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">
          팩터 변수 인사이트
        </CardTitle>
        <p className="text-[10px] text-muted-foreground">
          상관관계는 인과를 의미하지 않습니다
        </p>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="correlation">
          <TabsList>
            <TabsTrigger value="correlation">변수-수익률 상관</TabsTrigger>
            <TabsTrigger value="distribution">승/패 분포 비교</TabsTrigger>
          </TabsList>
          <TabsContent value="correlation">
            <CorrelationTable correlations={correlations} />
          </TabsContent>
          <TabsContent value="distribution">
            <WinLossDistribution
              stats={winLossStats}
              totalWins={totalWins}
              totalLosses={totalLosses}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

export default FactorInsightPanel
