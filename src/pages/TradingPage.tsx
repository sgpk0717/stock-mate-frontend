import type { ReactNode } from "react"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Term } from "@/components/ui/term"
import AlphaRanking from "@/components/trading/AlphaRanking"
import ContextPanel from "@/components/trading/ContextPanel"
import DecisionMonitor from "@/components/trading/DecisionMonitor"
import ModeSwitch from "@/components/trading/ModeSwitch"
import ReplayPanel from "@/components/trading/ReplayPanel"
import SessionCard from "@/components/trading/SessionCard"
import TradeDailyHistory from "@/components/trading/TradeDailyHistory"
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

  // #2: Paper 모드 요약 — 세션 데이터에서 현금/포지션 합산
  const paperSummary = (() => {
    if (mode !== "paper" || !sessions || sessions.length === 0) return null
    let totalCash = 0
    let totalPositions = 0
    let totalTradeCount = 0
    for (const s of sessions) {
      const raw = s as unknown as Record<string, string>
      totalCash += Number(raw.cash || 0)
      totalTradeCount += Number(raw.trade_count || s.trade_count || 0)
      try {
        const pos = typeof s.positions === "string"
          ? JSON.parse(s.positions as string)
          : s.positions
        if (pos && typeof pos === "object") {
          totalPositions += Object.keys(pos).length
        }
      } catch { /* ignore */ }
    }
    // 포지션이 없으면 초기 자본 = 첫 세션의 cash
    return {
      cash: totalCash || 100_000_000,
      positionCount: totalPositions,
      tradeCount: totalTradeCount,
    }
  })()

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

      {/* Summary Cards — Paper: 세션 데이터, Real: KIS API */}
      <div data-tour="trading-summary" className="grid gap-3 md:grid-cols-4">
        {mode === "paper" && paperSummary ? (
          <>
            <SummaryCard label="현금 잔액" value={formatKRW(paperSummary.cash)} />
            <SummaryCard label="보유종목" value={`${paperSummary.positionCount}개`} />
            <SummaryCard label="총 매매" value={`${paperSummary.tradeCount}건`} />
            <SummaryCard label="실행 세션" value={`${sessions?.length ?? 0}개`} />
          </>
        ) : balance ? (
          <>
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
          </>
        ) : (
          <>
            <SummaryCard label="총 평가" value="-" />
            <SummaryCard label={<Term>예수금</Term>} value="-" />
            <SummaryCard label={<Term>손익</Term>} value="-" />
            <SummaryCard label="보유종목" value="-" />
          </>
        )}
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="sessions">
        <TabsList>
          <TabsTrigger value="sessions">실행 세션</TabsTrigger>
          <TabsTrigger value="ranking">알파 랭킹</TabsTrigger>
          <TabsTrigger value="contexts">전략 관리</TabsTrigger>
          <TabsTrigger value="history">매매 이력</TabsTrigger>
          <TabsTrigger value="replay">리플레이</TabsTrigger>
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
          {(selectedSession || effectiveSessionId) && sessions && sessions.length > 0 && (() => {
            const sid = selectedSession ?? effectiveSessionId!
            const s = sessions.find((s: Record<string, unknown>) => s.id === sid) as Record<string, string> | undefined
            const tickSummary = s ? {
              last_tick_at: s.last_tick_at,
              bars_count: s.bars_count,
              buy_signals: s.buy_signals,
              sell_signals: s.sell_signals,
              skip_buy: s.skip_buy,
              hold_count: s.hold_count,
              positions: s.positions as unknown as string,
              max_positions: s.max_positions,
              cash: s.cash,
              trade_count: s.trade_count as unknown as string,
              status_detail: s.status_detail,
            } : undefined
            return (
              <SessionDetail
                sessionId={sid}
                trades={effectiveTrades ?? trades}
                interval={sessionInterval}
                balance={balance}
                tickSummary={tickSummary}
              />
            )
          })()}
        </TabsContent>

        {/* ── Tab: Alpha Ranking ── */}
        <TabsContent value="ranking" className="pt-2">
          <AlphaRanking />
        </TabsContent>

        {/* ── Tab 2: Context Management ── */}
        <TabsContent value="contexts">
          <div data-tour="trading-context">
            <ContextPanel mode={mode} />
          </div>
        </TabsContent>

        {/* ── Tab 3: Daily Trade History ── */}
        <TabsContent value="history">
          <TradeDailyHistory />
        </TabsContent>

        {/* ── Tab 4: Replay ── */}
        <TabsContent value="replay">
          <ReplayPanel />
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
  tickSummary?: Record<string, string>
}

function SessionDetail({ sessionId, trades, interval, balance, tickSummary }: SessionDetailProps) {
  // Re-fetch trades for this specific session
  const { data: sessionTrades } = useSessionTrades(sessionId)
  const displayTrades = trades ?? sessionTrades ?? []

  return (
    <Tabs defaultValue="monitor">
      <TabsList variant="line">
        <TabsTrigger value="monitor">모니터링</TabsTrigger>
        <TabsTrigger value="journal">매매일지 차트</TabsTrigger>
        <TabsTrigger value="trades">
          매매 기록{displayTrades.length > 0 && ` (${displayTrades.length})`}
        </TabsTrigger>
        <TabsTrigger value="positions">보유 포지션</TabsTrigger>
      </TabsList>

      {/* Sub-tab: Decision Monitor */}
      <TabsContent value="monitor" className="pt-2">
        <DecisionMonitor sessionId={sessionId} tickSummary={tickSummary} />
      </TabsContent>

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

      {/* Sub-tab: Positions — Paper: 세션 내부 포지션, Real: KIS API */}
      <TabsContent value="positions" className="pt-2">
        <PaperPositionSection sessionId={sessionId} balance={balance} />
      </TabsContent>
    </Tabs>
  )
}

// ── Trade Record Table (extracted from original) ─────────────────

// #17: step 코드 → 사용자 친화적 한국어 변환
const STEP_LABELS: Record<string, string> = {
  B1: "1차 매수",
  B2: "추가 매수",
  "S-HALF": "부분 익절",
  "S-STOP": "손절 매도",
  "S-TRAIL": "추적 매도",
}

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
                    {formatTradeTime(t.timestamp)}
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
                      {t.step ? (STEP_LABELS[t.step] ?? `${t.side === "BUY" ? "매수" : "매도"} (${t.step})`) : (t.side === "BUY" ? "매수" : "매도")}
                    </span>
                  </td>
                  <td className="py-1.5 text-right tabular-nums">
                    {t.qty.toLocaleString()}
                  </td>
                  <td className="py-1.5 text-right tabular-nums">
                    {Math.round(t.price).toLocaleString()}
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
                  <td className="py-1.5 max-w-[200px] text-muted-foreground">
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

// #3: 시간 보정 — UTC+00:00 타임스탬프를 KST 봉 시각으로 변환
function formatTradeTime(ts: string): string {
  if (!ts) return "-"
  try {
    const d = new Date(ts)
    // 타임존 없는 ISO 문자열(캔들 dt)이 UTC로 해석되는 문제 보정:
    // 장중 시간(09:00~15:30 KST)인지 확인하고, 범위 밖이면 UTC→KST 보정이 필요한 것으로 판단
    const kstHour = d.getHours() // 브라우저 로컬(KST) 기준
    if (kstHour >= 16 || kstHour < 9) {
      // 오후 4시 이후 or 오전 9시 이전이면 UTC 값이 KST로 잘못 해석된 것
      // 원본이 UTC 봉 시각이므로 KST 기준 시간만 추출
      // 예: UTC 00:35 → KST 09:35, UTC 09:35(잘못된 KST 해석) → 실제 의도 09:35
      // 시간대 정보 제거 후 재파싱
      const noTz = ts.replace(/[+-]\d{2}:\d{2}$/, "").replace("Z", "")
      const naive = new Date(noTz + "+09:00")
      return naive.toLocaleTimeString("ko-KR")
    }
    return d.toLocaleTimeString("ko-KR")
  } catch {
    return ts
  }
}

// ── Paper Position Section (세션 내부 포지션 or KIS API) ─────────

function PaperPositionSection({
  sessionId,
  balance,
}: {
  sessionId: string
  balance: import("@/types").KISBalance | undefined
}) {
  const { data: sessions } = useTradingStatus()
  const session = sessions?.find((s) => s.id === sessionId) as Record<string, unknown> | undefined

  // Paper 모드: 세션 positions 파싱
  const paperPositions = (() => {
    if (!session?.positions) return []
    try {
      const raw = typeof session.positions === "string"
        ? JSON.parse(session.positions as string)
        : session.positions
      if (!raw || typeof raw !== "object") return []
      return Object.entries(raw as Record<string, Record<string, unknown>>).map(([symbol, pos]) => ({
        symbol,
        name: String(pos.name || symbol),
        qty: Number(pos.qty || 0),
        avg_price: Math.round(Number(pos.avg_price || 0)),
        current_price: Math.round(Number(pos.current_price || pos.avg_price || 0)),
        pnl: 0,
        pnl_pct: 0,
      }))
    } catch {
      return []
    }
  })()

  // Paper 모드에서 포지션이 있으면 그걸 표시
  if (paperPositions.length > 0) {
    return <PositionTable positions={paperPositions} />
  }

  // Real 모드: KIS API 사용
  if (balance && balance.positions.length > 0) {
    return <PositionTable positions={balance.positions} />
  }

  return (
    <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
      보유 포지션이 없습니다.
    </div>
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
