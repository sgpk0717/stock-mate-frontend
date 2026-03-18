import type { ReactNode } from "react"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Term } from "@/components/ui/term"
import ContextPanel from "@/components/trading/ContextPanel"
import ModeSwitch from "@/components/trading/ModeSwitch"
import SessionCard from "@/components/trading/SessionCard"
import TradeJournalChart from "@/components/trading/TradeJournalChart"
import {
  useKISBalance,
  useSessionTrades,
  useTradingStatus,
} from "@/hooks/queries/use-trading"
import { formatKRW } from "@/lib/format"
import { cn } from "@/lib/utils"

function TradingPage() {
  const [mode, setMode] = useState<"paper" | "real">("paper")
  const [selectedSession, setSelectedSession] = useState<string | null>(null)
  const isMock = mode === "paper"

  const { data: balance } = useKISBalance(isMock)
  const { data: sessions, isLoading: sessionsLoading } = useTradingStatus()
  const { data: trades } = useSessionTrades(selectedSession)

  // Auto-select the first session if none selected
  const activeSession = sessions?.find((s) => s.id === selectedSession)
  const effectiveSessionId =
    activeSession?.id ?? (sessions?.length ? sessions[0].id : null)

  // If we auto-selected, update trades query
  const effectiveTrades =
    selectedSession === effectiveSessionId
      ? trades
      : undefined

  // Get strategy interval from the selected session context
  const sessionInterval = activeSession?.mode === "paper" ? "5m" : "5m"

  return (
    <div className="space-y-6">
      {/* Header */}
      <div data-tour="trading-mode" className="flex items-center justify-between">
        <h1 className="text-lg font-bold">
          <Term desc="전략 기반으로 자동으로 매수/매도하는 기능">
            자동매매
          </Term>
        </h1>
        <ModeSwitch mode={mode} onModeChange={setMode} />
      </div>

      {/* KIS Summary Cards */}
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

      {/* Main Tabs */}
      <Tabs defaultValue="sessions">
        <TabsList>
          <TabsTrigger value="sessions">실행 세션</TabsTrigger>
          <TabsTrigger value="contexts">전략 관리</TabsTrigger>
        </TabsList>

        {/* ── Tab 1: Sessions ── */}
        <TabsContent value="sessions" className="space-y-4">
          {/* Session card strip (horizontal scroll) */}
          {sessionsLoading ? (
            <div className="flex gap-3 overflow-x-auto pb-1">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-[120px] min-w-[200px] shrink-0 rounded-lg" />
              ))}
            </div>
          ) : sessions && sessions.length > 0 ? (
            <div className="flex gap-3 overflow-x-auto pb-1">
              {sessions.map((s) => (
                <SessionCard
                  key={s.id}
                  session={s}
                  selected={
                    (selectedSession ?? effectiveSessionId) === s.id
                  }
                  onSelect={(id) => setSelectedSession(id)}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8">
                <p className="text-center text-sm text-muted-foreground">
                  실행 중인 세션이 없습니다. 전략 관리 탭에서 전략을 실행하세요.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Selected session detail */}
          {(selectedSession || effectiveSessionId) && sessions && sessions.length > 0 && (
            <SessionDetail
              sessionId={selectedSession ?? effectiveSessionId!}
              trades={effectiveTrades ?? trades}
              interval={sessionInterval}
              balance={balance}
            />
          )}
        </TabsContent>

        {/* ── Tab 2: Context Management ── */}
        <TabsContent value="contexts">
          <div data-tour="trading-context">
            <ContextPanel mode={mode} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ── Session Detail with sub-tabs ──────────────────────────────────

interface SessionDetailProps {
  sessionId: string
  trades: import("@/types").TradeLog[] | undefined
  interval: string
  balance: import("@/types").KISBalance | undefined
}

function SessionDetail({ sessionId, trades, interval, balance }: SessionDetailProps) {
  // Re-fetch trades for this specific session
  const { data: sessionTrades } = useSessionTrades(sessionId)
  const displayTrades = trades ?? sessionTrades ?? []

  return (
    <Tabs defaultValue="journal">
      <TabsList variant="line">
        <TabsTrigger value="journal">매매일지 차트</TabsTrigger>
        <TabsTrigger value="trades">
          매매 기록{displayTrades.length > 0 && ` (${displayTrades.length})`}
        </TabsTrigger>
        <TabsTrigger value="positions">보유 포지션</TabsTrigger>
      </TabsList>

      {/* Sub-tab: Trade Journal Chart */}
      <TabsContent value="journal" className="pt-2">
        {displayTrades.length > 0 ? (
          <TradeJournalChart trades={displayTrades} interval={interval} />
        ) : (
          <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
            아직 매매 기록이 없습니다.
          </div>
        )}
      </TabsContent>

      {/* Sub-tab: Trade Records */}
      <TabsContent value="trades" className="pt-2">
        {displayTrades.length > 0 ? (
          <TradeRecordTable trades={displayTrades} />
        ) : (
          <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
            아직 매매 기록이 없습니다.
          </div>
        )}
      </TabsContent>

      {/* Sub-tab: Positions */}
      <TabsContent value="positions" className="pt-2">
        {balance && balance.positions.length > 0 ? (
          <PositionTable positions={balance.positions} />
        ) : (
          <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
            보유 포지션이 없습니다.
          </div>
        )}
      </TabsContent>
    </Tabs>
  )
}

// ── Trade Record Table (extracted from original) ─────────────────

function TradeRecordTable({
  trades,
}: {
  trades: import("@/types").TradeLog[]
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">
          매매 기록 ({trades.length}건)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="max-h-96 overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-background">
              <tr className="border-b text-muted-foreground">
                <th className="py-1.5 text-left font-medium">시각</th>
                <th className="py-1.5 text-left font-medium">종목</th>
                <th className="py-1.5 text-center font-medium">구분</th>
                <th className="py-1.5 text-right font-medium">수량</th>
                <th className="py-1.5 text-right font-medium">가격</th>
                <th className="py-1.5 text-right font-medium">손익</th>
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
                  <td className="py-1.5 text-right tabular-nums">
                    {t.pnl_amount != null ? (
                      <span
                        className={cn(
                          t.pnl_amount > 0
                            ? "text-red-600"
                            : t.pnl_amount < 0
                              ? "text-blue-600"
                              : "text-muted-foreground",
                        )}
                      >
                        {formatKRW(t.pnl_amount)}
                        {t.pnl_pct != null && (
                          <span className="ml-0.5 text-[10px]">
                            ({t.pnl_pct > 0 ? "+" : ""}
                            {t.pnl_pct.toFixed(1)}%)
                          </span>
                        )}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
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
  )
}

// ── Position Table ───────────────────────────────────────────────

function PositionTable({
  positions,
}: {
  positions: import("@/types").KISBalance["positions"]
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">
          보유 종목 ({positions.length}개)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b text-muted-foreground">
              <th className="py-1.5 text-left font-medium">종목</th>
              <th className="py-1.5 text-right font-medium">수량</th>
              <th className="py-1.5 text-right font-medium">
                <Term>평단가</Term>
              </th>
              <th className="py-1.5 text-right font-medium">현재가</th>
              <th className="py-1.5 text-right font-medium">
                <Term>손익</Term>
              </th>
              <th className="py-1.5 text-right font-medium">
                <Term>수익률</Term>
              </th>
            </tr>
          </thead>
          <tbody>
            {positions.map((p) => (
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
                    p.pnl > 0
                      ? "text-red-600"
                      : p.pnl < 0
                        ? "text-blue-600"
                        : "",
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
  )
}

// ── Summary Card ─────────────────────────────────────────────────

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
