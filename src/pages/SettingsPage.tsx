import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useAppStore } from "@/stores/use-app-store"
import { useStockList } from "@/hooks/queries"

function SettingsPage() {
  const tradingMode = useAppStore((s) => s.tradingMode)
  const setTradingMode = useAppStore((s) => s.setTradingMode)
  const expertMode = useAppStore((s) => s.expertMode)
  const setExpertMode = useAppStore((s) => s.setExpertMode)
  const { data: stocks = [] } = useStockList()

  // 감시 종목: 주요 8종목만 표시
  const watchedSymbols = [
    "005930",
    "000660",
    "035720",
    "005380",
    "035420",
    "051910",
    "006400",
    "068270",
  ]
  const watchedStocks = watchedSymbols
    .map((sym) => stocks.find((s) => s.symbol === sym))
    .filter(Boolean)

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* 화면 모드 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">화면 모드</CardTitle>
          <CardDescription>
            초보자 모드에서는 전문 용어에 마우스를 올리면 쉬운 설명이
            표시됩니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Label htmlFor="expert-mode" className="text-sm">
                전문가 모드
              </Label>
              <Badge variant={expertMode ? "default" : "secondary"}>
                {expertMode ? "전문가" : "초보자"}
              </Badge>
            </div>
            <Switch
              id="expert-mode"
              checked={expertMode}
              onCheckedChange={setExpertMode}
            />
          </div>
          {!expertMode && (
            <p className="mt-3 text-xs text-muted-foreground">
              초보자 모드 활성화: 전문 용어 위에 마우스를 올리면 쉬운 설명이
              나타납니다.
            </p>
          )}
        </CardContent>
      </Card>

      {/* 트레이딩 모드 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">트레이딩 모드</CardTitle>
          <CardDescription>
            모의투자와 실거래를 전환합니다. 실거래 모드에서는 실제 주문이
            전송됩니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Label htmlFor="trading-mode" className="text-sm">
                실거래 모드
              </Label>
              <Badge
                variant={tradingMode === "PAPER" ? "secondary" : "destructive"}
              >
                {tradingMode === "PAPER" ? "Paper" : "Real"}
              </Badge>
            </div>
            <Switch
              id="trading-mode"
              checked={tradingMode === "REAL"}
              onCheckedChange={(checked) =>
                setTradingMode(checked ? "REAL" : "PAPER")
              }
            />
          </div>
          {tradingMode === "REAL" && (
            <p className="mt-3 text-xs text-red-500">
              실거래 모드가 활성화되어 있습니다. 실제 주문이 전송될 수 있습니다.
            </p>
          )}
        </CardContent>
      </Card>

      {/* 감시 종목 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">감시 종목</CardTitle>
          <CardDescription>
            실시간 데이터를 수신할 종목 목록입니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {watchedStocks.map((stock) =>
              stock ? (
                <div
                  key={stock.symbol}
                  className="flex items-center justify-between rounded-md border px-4 py-2.5"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">{stock.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {stock.symbol}
                    </span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {stock.market}
                  </Badge>
                </div>
              ) : null,
            )}
            {watchedStocks.length === 0 && (
              <p className="text-sm text-muted-foreground">
                종목 데이터를 불러오는 중...
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* 서버 상태 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">시스템 상태</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                백엔드 서버
              </span>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-xs">연결됨</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Data Pump (키움)
              </span>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-gray-300" />
                <span className="text-xs text-muted-foreground">미연결</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                KIS API
              </span>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-gray-300" />
                <span className="text-xs text-muted-foreground">미연결</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                PostgreSQL
              </span>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-xs">연결됨</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default SettingsPage
