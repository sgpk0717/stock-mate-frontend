import type { ReactNode } from "react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Term } from "@/components/ui/term"
import { formatKRW, formatPercent, formatChange } from "@/lib/format"
import TickChart from "@/components/chart/TickChart"
import { useAccount, usePositions } from "@/hooks/queries"
import { cn } from "@/lib/utils"

function SummaryCard({
  title,
  value,
  sub,
  highlight,
  loading,
}: {
  title: ReactNode
  value: string
  sub?: string
  highlight?: "positive" | "negative" | "neutral"
  loading?: boolean
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-normal text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-32" />
        ) : (
          <>
            <div className="text-2xl font-bold tracking-tight">{value}</div>
            {sub && (
              <p
                className={cn(
                  "mt-1 text-sm",
                  highlight === "positive" && "text-emerald-600",
                  highlight === "negative" && "text-red-500",
                  highlight === "neutral" && "text-muted-foreground",
                )}
              >
                {sub}
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

function Dashboard() {
  const { data: account, isLoading: accountLoading } = useAccount()
  const { data: positions, isLoading: positionsLoading } = usePositions()

  const totalEval =
    positions?.reduce((sum, p) => sum + p.current_price * p.qty, 0) ?? 0
  const totalPnl = positions?.reduce((sum, p) => sum + p.pnl, 0) ?? 0
  const totalCost =
    positions?.reduce((sum, p) => sum + p.avg_price * p.qty, 0) ?? 0
  const totalPnlPercent = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0
  const fullAsset = totalEval + (account?.current_balance ?? 0)

  const dailyHighlight = totalPnl >= 0 ? "positive" : ("negative" as const)

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div data-tour="dash-summary" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          title="총 평가자산"
          value={formatKRW(fullAsset)}
          sub={`${formatChange(totalPnl)} (${formatPercent(totalPnlPercent)})`}
          highlight={dailyHighlight}
          loading={accountLoading}
        />
        <SummaryCard
          title={<Term>투자원금</Term>}
          value={formatKRW(account?.total_capital ?? 0)}
          highlight="neutral"
          loading={accountLoading}
        />
        <SummaryCard
          title={<Term>예수금</Term>}
          value={formatKRW(account?.current_balance ?? 0)}
          highlight="neutral"
          loading={accountLoading}
        />
        <SummaryCard
          title={<Term>평가손익</Term>}
          value={formatChange(totalPnl)}
          sub={formatPercent(totalPnlPercent)}
          highlight={dailyHighlight}
          loading={positionsLoading}
        />
      </div>

      {/* Chart */}
      <Card data-tour="dash-chart">
        <CardHeader>
          <CardTitle className="text-base">실시간 차트</CardTitle>
        </CardHeader>
        <CardContent>
          <TickChart />
        </CardContent>
      </Card>

      {/* Positions Table */}
      <Card data-tour="dash-holdings">
        <CardHeader>
          <CardTitle className="text-base">보유 종목</CardTitle>
        </CardHeader>
        <CardContent>
          {positionsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>종목</TableHead>
                  <TableHead className="text-right">수량</TableHead>
                  <TableHead className="text-right"><Term>평균단가</Term></TableHead>
                  <TableHead className="text-right">현재가</TableHead>
                  <TableHead className="text-right"><Term>평가손익</Term></TableHead>
                  <TableHead className="text-right"><Term>수익률</Term></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {positions?.map((pos) => (
                  <TableRow key={pos.id}>
                    <TableCell>
                      <div>
                        <span className="font-medium">{pos.name}</span>
                        <span className="ml-2 text-xs text-muted-foreground">
                          {pos.symbol}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{pos.qty}</TableCell>
                    <TableCell className="text-right">
                      {formatKRW(pos.avg_price)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatKRW(pos.current_price)}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-right font-medium",
                        pos.pnl >= 0 ? "text-emerald-600" : "text-red-500",
                      )}
                    >
                      {formatChange(pos.pnl)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant="outline"
                        className={cn(
                          "font-mono",
                          pos.pnl_percent >= 0
                            ? "border-emerald-200 text-emerald-600"
                            : "border-red-200 text-red-500",
                        )}
                      >
                        {formatPercent(pos.pnl_percent)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {positions?.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-8 text-center text-muted-foreground"
                    >
                      보유 종목이 없습니다
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default Dashboard
