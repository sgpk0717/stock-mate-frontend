import type { ReactNode } from "react"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Term } from "@/components/ui/term"
import ContextPanel from "@/components/trading/ContextPanel"
import LiveStatus from "@/components/trading/LiveStatus"
import ModeSwitch from "@/components/trading/ModeSwitch"
import { useKISBalance, useSessionTrades } from "@/hooks/queries/use-trading"
import { formatKRW } from "@/lib/format"
import { cn } from "@/lib/utils"

function TradingPage() {
  const [mode, setMode] = useState<"paper" | "real">("paper")
  const [selectedSession, setSelectedSession] = useState<string | null>(null)
  const isMock = mode === "paper"

  const { data: balance } = useKISBalance(isMock)
  const { data: trades } = useSessionTrades(selectedSession)

  return (
    <div className="space-y-6">
      <div data-tour="trading-mode" className="flex items-center justify-between">
        <h1 className="text-lg font-bold"><Term desc="전략 기반으로 자동으로 매수/매도하는 기능">자동매매</Term></h1>
        <ModeSwitch mode={mode} onModeChange={setMode} />
      </div>

      {/* KIS 계좌 요약 */}
      {balance && (
        <div data-tour="trading-summary" className="grid gap-3 md:grid-cols-4">
          <SummaryCard
            label="총 평가"
            value={formatKRW(balance.account.total_eval)}
          />
          <SummaryCard
            label={<Term>예수금</Term>}
            value={formatKRW(balance.account.cash)}
          />
          <SummaryCard
            label={<Term>손익</Term>}
            value={formatKRW(balance.account.total_pnl)}
            highlight={balance.account.total_pnl}
          />
          <SummaryCard
            label="보유종목"
            value={`${balance.positions.length}개`}
          />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* 왼쪽: 전략 관리 + 매매 기록 */}
        <div className="space-y-6">
          <div data-tour="trading-context">
            <ContextPanel mode={mode} />
          </div>

          {/* 선택된 세션의 매매 기록 */}
          {selectedSession && trades && trades.length > 0 && (
            <Card data-tour="trading-trades">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">
                  매매 기록 ({trades.length}건)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-80 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-background">
                      <tr className="border-b text-muted-foreground">
                        <th className="py-1.5 text-left font-medium">시각</th>
                        <th className="py-1.5 text-left font-medium">종목</th>
                        <th className="py-1.5 text-center font-medium">구분</th>
                        <th className="py-1.5 text-right font-medium">수량</th>
                        <th className="py-1.5 text-right font-medium">가격</th>
                        <th className="py-1.5 text-center font-medium">결과</th>
                        <th className="py-1.5 text-left font-medium">사유</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trades.map((t, i) => (
                        <tr key={i} className="border-b last:border-0">
                          <td className="py-1.5 tabular-nums text-muted-foreground">
                            {new Date(t.timestamp).toLocaleTimeString("ko-KR")}
                          </td>
                          <td className="py-1.5 font-medium">
                            {t.name ? (
                              <>
                                <span>{t.name}</span>
                                <span className="ml-1 text-[10px] text-muted-foreground">
                                  {t.symbol}
                                </span>
                              </>
                            ) : (
                              t.symbol
                            )}
                          </td>
                          <td className="py-1.5 text-center">
                            <span
                              className={cn(
                                "rounded px-1.5 py-0.5 text-xs",
                                t.side === "BUY"
                                  ? "bg-red-50 text-red-600"
                                  : "bg-blue-50 text-blue-600",
                              )}
                            >
                              {t.side === "BUY" ? "매수" : "매도"}
                              {t.step && ` (${t.step})`}
                            </span>
                          </td>
                          <td className="py-1.5 text-right tabular-nums">
                            {t.qty.toLocaleString()}
                          </td>
                          <td className="py-1.5 text-right tabular-nums">
                            {t.price.toLocaleString()}
                          </td>
                          <td className="py-1.5 text-center">
                            <span
                              className={cn(
                                "text-xs",
                                t.success
                                  ? "text-green-600"
                                  : "text-destructive",
                              )}
                            >
                              {t.success ? "성공" : "실패"}
                            </span>
                          </td>
                          <td className="py-1.5 max-w-[140px] truncate text-muted-foreground">
                            {t.reason || "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* KIS 보유 포지션 */}
          {balance && balance.positions.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">
                  KIS 보유 종목
                </CardTitle>
              </CardHeader>
              <CardContent>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b text-muted-foreground">
                      <th className="py-1.5 text-left font-medium">종목</th>
                      <th className="py-1.5 text-right font-medium">수량</th>
                      <th className="py-1.5 text-right font-medium"><Term>평단가</Term></th>
                      <th className="py-1.5 text-right font-medium">현재가</th>
                      <th className="py-1.5 text-right font-medium"><Term>손익</Term></th>
                      <th className="py-1.5 text-right font-medium"><Term>수익률</Term></th>
                    </tr>
                  </thead>
                  <tbody>
                    {balance.positions.map((p) => (
                      <tr key={p.symbol} className="border-b last:border-0">
                        <td className="py-1.5">
                          <span className="font-medium">{p.name}</span>
                          <span className="ml-1 text-muted-foreground">
                            {p.symbol}
                          </span>
                        </td>
                        <td className="py-1.5 text-right tabular-nums">
                          {p.qty.toLocaleString()}
                        </td>
                        <td className="py-1.5 text-right tabular-nums">
                          {p.avg_price.toLocaleString()}
                        </td>
                        <td className="py-1.5 text-right tabular-nums">
                          {p.current_price.toLocaleString()}
                        </td>
                        <td
                          className={cn(
                            "py-1.5 text-right tabular-nums",
                            p.pnl > 0 ? "text-red-600" : p.pnl < 0 ? "text-blue-600" : "",
                          )}
                        >
                          {formatKRW(p.pnl)}
                        </td>
                        <td
                          className={cn(
                            "py-1.5 text-right tabular-nums",
                            p.pnl_pct > 0
                              ? "text-red-600"
                              : p.pnl_pct < 0
                                ? "text-blue-600"
                                : "",
                          )}
                        >
                          {p.pnl_pct > 0 ? "+" : ""}
                          {p.pnl_pct.toFixed(2)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </div>

        {/* 오른쪽: 실행 세션 */}
        <div data-tour="trading-status">
          <LiveStatus onSelectSession={setSelectedSession} />
        </div>
      </div>
    </div>
  )
}

function SummaryCard({
  label,
  value,
  highlight,
}: {
  label: ReactNode
  value: string
  highlight?: number
}) {
  return (
    <Card>
      <CardContent className="px-4 py-3">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p
          className={cn(
            "mt-0.5 text-sm font-semibold tabular-nums",
            highlight != null && highlight > 0 && "text-red-600",
            highlight != null && highlight < 0 && "text-blue-600",
          )}
        >
          {value}
        </p>
      </CardContent>
    </Card>
  )
}

export default TradingPage
