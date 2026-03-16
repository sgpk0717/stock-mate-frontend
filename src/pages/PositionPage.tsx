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
import { useAccount, usePositions } from "@/hooks/queries"
import { formatKRW, formatPercent, formatChange, formatNumber } from "@/lib/format"
import { cn } from "@/lib/utils"

function PositionPage() {
  const { data: account } = useAccount()
  const { data: positions, isLoading } = usePositions()

  const totalEval =
    positions?.reduce((sum, p) => sum + p.current_price * p.qty, 0) ?? 0
  const totalCost =
    positions?.reduce((sum, p) => sum + p.avg_price * p.qty, 0) ?? 0
  const totalPnl = positions?.reduce((sum, p) => sum + p.pnl, 0) ?? 0
  const totalPnlPercent = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0

  return (
    <div className="space-y-6">
      {/* 요약 카드 */}
      <div data-tour="pos-summary" className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-normal text-muted-foreground">
              총 평가금액
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatKRW(totalEval)}</div>
            <p className="mt-1 text-xs text-muted-foreground">
              <Term>투자원금</Term> {formatKRW(account?.total_capital ?? 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-normal text-muted-foreground">
              총 <Term>평가손익</Term>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={cn(
                "text-2xl font-bold",
                totalPnl >= 0 ? "text-emerald-600" : "text-red-500",
              )}
            >
              {formatChange(totalPnl)}
            </div>
            <p
              className={cn(
                "mt-1 text-sm",
                totalPnl >= 0 ? "text-emerald-600" : "text-red-500",
              )}
            >
              {formatPercent(totalPnlPercent)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-normal text-muted-foreground">
              보유 종목 수
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{positions?.length ?? 0}개</div>
            <p className="mt-1 text-xs text-muted-foreground">
              <Term>예수금</Term> {formatKRW(account?.current_balance ?? 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 종목 상세 테이블 */}
      <Card data-tour="pos-table">
        <CardHeader>
          <CardTitle className="text-base">보유 종목 상세</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
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
                  <TableHead className="text-right"><Term>현재가</Term></TableHead>
                  <TableHead className="text-right"><Term>매입금액</Term></TableHead>
                  <TableHead className="text-right"><Term>평가금액</Term></TableHead>
                  <TableHead className="text-right"><Term>평가손익</Term></TableHead>
                  <TableHead className="text-right"><Term>수익률</Term></TableHead>
                  <TableHead className="text-right"><Term>비중</Term></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {positions?.map((pos) => {
                  const cost = pos.avg_price * pos.qty
                  const eval_ = pos.current_price * pos.qty
                  const weight = totalEval > 0 ? (eval_ / totalEval) * 100 : 0

                  return (
                    <TableRow key={pos.id}>
                      <TableCell>
                        <div>
                          <span className="font-medium">{pos.name}</span>
                          <span className="ml-2 text-xs text-muted-foreground">
                            {pos.symbol}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatNumber(pos.qty)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatKRW(pos.avg_price)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatKRW(pos.current_price)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatKRW(cost)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatKRW(eval_)}
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
                      <TableCell className="text-right text-muted-foreground">
                        {weight.toFixed(1)}%
                      </TableCell>
                    </TableRow>
                  )
                })}
                {positions?.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={9}
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

export default PositionPage
