import { useState } from "react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Term } from "@/components/ui/term"
import OrderForm from "@/components/order/OrderForm"
import OrderBook from "@/components/order/OrderBook"
import {
  usePaperOrders,
  useCancelPaperOrder,
  usePaperPositions,
  usePaperAccount,
  useResetPaper,
} from "@/hooks/queries"
import { useAppStore } from "@/stores/use-app-store"
import { useTickStore } from "@/stores/use-tick-store"
import { useOrderBookStream } from "@/hooks/use-websocket"
import { formatKRW, formatNumber } from "@/lib/format"
import { cn } from "@/lib/utils"

const statusMap: Record<
  string,
  { label: string; variant: "default" | "secondary" | "outline" | "destructive" }
> = {
  PENDING: { label: "대기", variant: "secondary" },
  FILLED: { label: "체결", variant: "default" },
  PARTIAL: { label: "부분체결", variant: "outline" },
  CANCELLED: { label: "취소", variant: "outline" },
  REJECTED: { label: "거부", variant: "destructive" },
}

function OrderPage() {
  const selectedSymbol = useAppStore((s) => s.selectedSymbol)
  const [formPrice, setFormPrice] = useState<number | undefined>()
  const [orderTab, setOrderTab] = useState<"pending" | "history">("pending")

  const { data: pendingOrders } = usePaperOrders({ status: "PENDING" })
  const { data: allOrders } = usePaperOrders()
  const cancelOrder = useCancelPaperOrder()
  const { data: positions } = usePaperPositions()
  const { data: account } = usePaperAccount()
  const resetPaper = useResetPaper()

  // WebSocket 호가 구독
  useOrderBookStream(selectedSymbol)
  const wsOrderBook = useTickStore((s) => s.orderBooks[selectedSymbol])
  const orderBook = {
    symbol: selectedSymbol,
    asks: wsOrderBook?.asks ?? [],
    bids: wsOrderBook?.bids ?? [],
  }

  const pending = pendingOrders ?? []
  const history = allOrders?.filter((o) => o.status !== "PENDING") ?? []

  return (
    <div className="space-y-4">
      {/* 모의투자 계좌 요약 */}
      {account && (
        <div className="flex items-center gap-4">
          <Badge variant="secondary" className="text-xs">
            <Term>모의투자</Term>
          </Badge>
          <div className="flex items-baseline gap-3 text-sm">
            <span className="text-muted-foreground">총자산</span>
            <span className="font-medium tabular-nums">
              {formatKRW(account.total_capital)}
            </span>
            <span className="text-muted-foreground">잔고</span>
            <span className="font-medium tabular-nums">
              {formatKRW(account.current_balance)}
            </span>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="ml-auto text-xs text-muted-foreground hover:text-red-500"
            onClick={() => resetPaper.mutate()}
            disabled={resetPaper.isPending}
          >
            초기화
          </Button>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[1fr_280px_320px]">
        {/* 주문 폼 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base"><Term desc="실제 돈 없이 가상으로 매매 연습">모의주문</Term></CardTitle>
          </CardHeader>
          <CardContent>
            <OrderForm defaultPrice={formPrice} />
          </CardContent>
        </Card>

        {/* 호가창 */}
        <OrderBook
          data={orderBook}
          onPriceClick={(price) => setFormPrice(price)}
        />

        {/* 주문 내역 + 포지션 */}
        <div className="space-y-4">
          {/* 주문 탭 */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant={orderTab === "pending" ? "secondary" : "ghost"}
                  className="text-xs"
                  onClick={() => setOrderTab("pending")}
                >
                  <Term>미체결</Term>
                  {pending.length > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {pending.length}
                    </Badge>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant={orderTab === "history" ? "secondary" : "ghost"}
                  className="text-xs"
                  onClick={() => setOrderTab("history")}
                >
                  <Term>체결</Term>내역
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {orderTab === "pending" ? (
                pending.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    미체결 주문이 없습니다
                  </p>
                ) : (
                  <div className="space-y-2">
                    {pending.map((order) => (
                      <div
                        key={order.order_id}
                        className="flex items-center justify-between rounded-md border p-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">
                              {order.name}
                            </span>
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
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {formatKRW(order.price)} × {order.qty}주
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs text-muted-foreground hover:text-red-500"
                          onClick={() => cancelOrder.mutate(order.order_id)}
                          disabled={cancelOrder.isPending}
                        >
                          취소
                        </Button>
                      </div>
                    ))}
                  </div>
                )
              ) : history.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  체결 내역이 없습니다
                </p>
              ) : (
                <div className="space-y-2">
                  {history.slice(0, 20).map((order) => {
                    const st = statusMap[order.status]
                    return (
                      <div
                        key={order.order_id}
                        className="flex items-center justify-between rounded-md border p-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">
                              {order.name}
                            </span>
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
                            <Badge variant={st.variant} className="text-xs">
                              {st.label}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {formatKRW(order.price)} × {order.qty}주
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 모의 포지션 */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">보유종목</CardTitle>
            </CardHeader>
            <CardContent>
              {!positions || positions.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  보유 종목이 없습니다
                </p>
              ) : (
                <div className="space-y-2">
                  {positions.map((pos) => (
                    <div
                      key={pos.id}
                      className="flex items-center justify-between rounded-md border p-3"
                    >
                      <div className="space-y-1">
                        <span className="text-sm font-medium">{pos.name}</span>
                        <p className="text-xs text-muted-foreground">
                          {pos.qty}주 · 평균 {formatNumber(pos.avg_price)}원
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium tabular-nums">
                          {formatNumber(pos.current_price)}원
                        </p>
                        <p
                          className={cn(
                            "text-xs tabular-nums",
                            pos.pnl > 0
                              ? "text-red-500"
                              : pos.pnl < 0
                                ? "text-blue-500"
                                : "text-muted-foreground",
                          )}
                        >
                          {pos.pnl >= 0 ? "+" : ""}
                          {formatNumber(pos.pnl)}원 ({pos.pnl_percent >= 0 ? "+" : ""}
                          {pos.pnl_percent.toFixed(2)}%)
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default OrderPage
