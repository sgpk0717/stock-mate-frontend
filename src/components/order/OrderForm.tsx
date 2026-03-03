import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useCreatePaperOrder } from "@/hooks/queries"
import { useAppStore } from "@/stores/use-app-store"
import { useStockList } from "@/hooks/queries"
import StockSearch from "@/components/stock/StockSearch"
import { Term } from "@/components/ui/term"
import { cn } from "@/lib/utils"
import { formatNumber } from "@/lib/format"

interface OrderFormProps {
  defaultPrice?: number
}

function OrderForm({ defaultPrice }: OrderFormProps) {
  const selectedSymbol = useAppStore((s) => s.selectedSymbol)
  const createOrder = useCreatePaperOrder()
  const { data: stocks = [] } = useStockList()

  const [side, setSide] = useState<"BUY" | "SELL">("BUY")
  const [orderType, setOrderType] = useState<"MARKET" | "LIMIT">("LIMIT")
  const [price, setPrice] = useState(defaultPrice?.toString() ?? "")
  const [qty, setQty] = useState("")

  const stock = stocks.find((s) => s.symbol === selectedSymbol)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!qty || Number(qty) <= 0) return
    if (orderType === "LIMIT" && (!price || Number(price) <= 0)) return

    createOrder.mutate({
      symbol: selectedSymbol,
      side,
      type: orderType,
      price: orderType === "LIMIT" ? Number(price) : undefined,
      qty: Number(qty),
    })

    setQty("")
    if (orderType === "MARKET") setPrice("")
  }

  const totalAmount =
    orderType === "LIMIT" && price && qty ? Number(price) * Number(qty) : 0

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* 종목 선택 */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">종목</Label>
        <StockSearch className="w-full" />
        {stock && (
          <p className="text-xs text-muted-foreground">
            {stock.market}
          </p>
        )}
      </div>

      {/* 매수/매도 토글 */}
      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant={side === "BUY" ? "default" : "outline"}
          className={cn(
            side === "BUY" && "bg-red-500 text-white hover:bg-red-600",
          )}
          onClick={() => setSide("BUY")}
        >
          매수
        </Button>
        <Button
          type="button"
          variant={side === "SELL" ? "default" : "outline"}
          className={cn(
            side === "SELL" && "bg-blue-500 text-white hover:bg-blue-600",
          )}
          onClick={() => setSide("SELL")}
        >
          매도
        </Button>
      </div>

      {/* 주문 유형 */}
      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          size="sm"
          variant={orderType === "LIMIT" ? "secondary" : "ghost"}
          onClick={() => setOrderType("LIMIT")}
        >
          <Term>지정가</Term>
        </Button>
        <Button
          type="button"
          size="sm"
          variant={orderType === "MARKET" ? "secondary" : "ghost"}
          onClick={() => setOrderType("MARKET")}
        >
          <Term>시장가</Term>
        </Button>
      </div>

      {/* 가격 */}
      {orderType === "LIMIT" && (
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">가격</Label>
          <Input
            type="number"
            placeholder="주문 가격"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </div>
      )}

      {/* 수량 */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">수량</Label>
        <Input
          type="number"
          placeholder="주문 수량"
          value={qty}
          onChange={(e) => setQty(e.target.value)}
          min={1}
        />
      </div>

      {/* 예상 금액 */}
      {totalAmount > 0 && (
        <div className="flex justify-between rounded-md bg-muted/50 px-3 py-2 text-sm">
          <span className="text-muted-foreground">예상 금액</span>
          <span className="font-medium">{formatNumber(totalAmount)}원</span>
        </div>
      )}

      {/* 주문 버튼 */}
      <Button
        type="submit"
        className={cn(
          "w-full",
          side === "BUY"
            ? "bg-red-500 hover:bg-red-600"
            : "bg-blue-500 hover:bg-blue-600",
        )}
        disabled={createOrder.isPending}
      >
        {createOrder.isPending
          ? "주문 중..."
          : `${side === "BUY" ? "매수" : "매도"} 주문`}
      </Button>

      {createOrder.isSuccess && (
        <p className="text-center text-xs text-emerald-600">
          주문이 접수되었습니다
        </p>
      )}
    </form>
  )
}

export default OrderForm
