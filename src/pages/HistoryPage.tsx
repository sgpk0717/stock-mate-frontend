import { useState } from "react"
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
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Term } from "@/components/ui/term"
import { useOrders } from "@/hooks/queries"
import { formatKRW, formatNumber } from "@/lib/format"
import { cn } from "@/lib/utils"

type SideFilter = "ALL" | "BUY" | "SELL"
type StatusFilter = "ALL" | "FILLED" | "PENDING" | "CANCELLED" | "REJECTED" | "PARTIAL"

const statusConfig: Record<
  string,
  { label: string; className: string }
> = {
  PENDING: { label: "대기", className: "border-yellow-200 text-yellow-600 bg-yellow-50" },
  FILLED: { label: "체결", className: "border-emerald-200 text-emerald-600 bg-emerald-50" },
  PARTIAL: { label: "부분체결", className: "border-orange-200 text-orange-600 bg-orange-50" },
  CANCELLED: { label: "취소", className: "border-gray-200 text-gray-500 bg-gray-50" },
  REJECTED: { label: "거부", className: "border-red-200 text-red-500 bg-red-50" },
}

function HistoryPage() {
  const [sideFilter, setSideFilter] = useState<SideFilter>("ALL")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL")

  const { data: allOrders, isLoading } = useOrders()

  const orders = allOrders?.filter((o) => {
    if (sideFilter !== "ALL" && o.side !== sideFilter) return false
    if (statusFilter !== "ALL" && o.status !== statusFilter) return false
    return true
  })

  const filledCount = allOrders?.filter((o) => o.status === "FILLED").length ?? 0
  const pendingCount = allOrders?.filter((o) => o.status === "PENDING").length ?? 0

  return (
    <div className="space-y-4">
      {/* 요약 */}
      <div data-tour="hist-summary" className="flex gap-4">
        <div className="text-sm text-muted-foreground">
          전체 <span className="font-medium text-foreground">{allOrders?.length ?? 0}</span>건
        </div>
        <div className="text-sm text-muted-foreground">
          <Term>체결</Term> <span className="font-medium text-emerald-600">{filledCount}</span>건
        </div>
        <div className="text-sm text-muted-foreground">
          대기 <span className="font-medium text-yellow-600">{pendingCount}</span>건
        </div>
      </div>

      {/* 필터 */}
      <div data-tour="hist-filters" className="flex flex-wrap gap-2">
        <div className="flex gap-1 rounded-lg border p-1">
          {(["ALL", "BUY", "SELL"] as SideFilter[]).map((f) => (
            <Button
              key={f}
              size="sm"
              variant={sideFilter === f ? "secondary" : "ghost"}
              className="h-7 text-xs"
              onClick={() => setSideFilter(f)}
            >
              {f === "ALL" ? "전체" : f === "BUY" ? "매수" : "매도"}
            </Button>
          ))}
        </div>

        <div className="flex gap-1 rounded-lg border p-1">
          {(["ALL", "FILLED", "PENDING", "CANCELLED", "REJECTED"] as StatusFilter[]).map(
            (f) => (
              <Button
                key={f}
                size="sm"
                variant={statusFilter === f ? "secondary" : "ghost"}
                className="h-7 text-xs"
                onClick={() => setStatusFilter(f)}
              >
                {f === "ALL"
                  ? "전체"
                  : statusConfig[f]?.label ?? f}
              </Button>
            ),
          )}
        </div>
      </div>

      {/* 테이블 */}
      <Card data-tour="hist-table">
        <CardHeader>
          <CardTitle className="text-base">
            주문내역
            {orders && orders.length > 0 && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                {orders.length}건
              </span>
            )}
          </CardTitle>
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
                  <TableHead>주문일시</TableHead>
                  <TableHead>종목</TableHead>
                  <TableHead className="text-center">구분</TableHead>
                  <TableHead className="text-center">유형</TableHead>
                  <TableHead className="text-right">가격</TableHead>
                  <TableHead className="text-right">수량</TableHead>
                  <TableHead className="text-right">금액</TableHead>
                  <TableHead className="text-center">상태</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders?.map((order) => {
                  const st = statusConfig[order.status]
                  const amount = order.price * order.qty
                  const dateStr = order.created_at.replace("T", " ").slice(0, 16)

                  return (
                    <TableRow key={order.order_id}>
                      <TableCell className="text-xs text-muted-foreground">
                        {dateStr}
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{order.name}</span>
                        <span className="ml-1.5 text-xs text-muted-foreground">
                          {order.symbol}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs",
                            order.side === "BUY"
                              ? "border-red-200 text-red-500"
                              : "border-blue-200 text-blue-500",
                          )}
                        >
                          {order.side === "BUY" ? "매수" : "매도"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center text-xs text-muted-foreground">
                        {order.type === "MARKET" ? <Term>시장가</Term> : <Term>지정가</Term>}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatKRW(order.price)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatNumber(order.qty)}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {formatKRW(amount)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className={cn("text-xs", st?.className)}>
                          {st?.label ?? order.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )
                })}
                {orders?.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="py-8 text-center text-muted-foreground"
                    >
                      주문 내역이 없습니다
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

export default HistoryPage
