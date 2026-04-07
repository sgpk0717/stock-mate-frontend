import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useReplay, useReplayHistory } from "@/hooks/queries/use-replay"
import { formatKRW } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { ReplayResult, ReplaySession, ReplayTrade } from "@/types/replay"

function ReplayPanel() {
  const [targetDate, setTargetDate] = useState("")
  const [expandedSession, setExpandedSession] = useState<string | null>(null)

  const replay = useReplay()
  const { data: history, isLoading: historyLoading } = useReplayHistory()

  const result: ReplayResult | null = replay.result

  function handleRun() {
    replay.execute({
      target_date: targetDate || undefined,
    })
  }

  function toggleSession(factorId: string) {
    setExpandedSession((prev) => (prev === factorId ? null : factorId))
  }

  return (
    <div className="space-y-6">
      {/* 실행 컨트롤 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">리플레이 실행</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-3">
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">
                대상 날짜 (비워두면 최근 거래일)
              </label>
              <Input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-44"
              />
            </div>
            <Button
              onClick={handleRun}
              disabled={replay.isRunning}
              size="sm"
            >
              {replay.isRunning ? "실행 중..." : "실행"}
            </Button>
            {result && (
              <Button onClick={replay.reset} variant="ghost" size="sm">
                초기화
              </Button>
            )}
          </div>
          {replay.isRunning && (
            <p className="mt-2 text-xs text-muted-foreground">
              {replay.progress}
            </p>
          )}
          {replay.error && (
            <p className="mt-2 text-xs text-destructive">{replay.error}</p>
          )}
        </CardContent>
      </Card>

      {/* 실행 결과 */}
      {result && (
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            대상: {result.target_date} / {result.factors?.length ?? 0}개 팩터
          </p>

          {/* 집계 요약 */}
          <div className="grid gap-3 md:grid-cols-4">
            <SummaryCard
              label="세션 수"
              value={`${result.aggregate_metrics?.total_sessions ?? 0}개`}
            />
            <SummaryCard
              label="총 매매"
              value={`${result.aggregate_metrics?.total_trades ?? 0}건`}
            />
            <SummaryCard
              label="총 손익"
              value={formatKRW(result.aggregate_metrics?.total_pnl ?? 0)}
              highlight={result.aggregate_metrics?.total_pnl}
            />
            <SummaryCard
              label="총 매수"
              value={`${result.aggregate_metrics?.total_buys ?? 0}건`}
            />
          </div>

          {/* 세션별 카드 */}
          <div className="space-y-3">
            {result.sessions.map((session) => (
              <SessionResultCard
                key={session.factor_id}
                session={session}
                expanded={expandedSession === session.factor_id}
                onToggle={() => toggleSession(session.factor_id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* 과거 히스토리 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">
            리플레이 히스토리
          </CardTitle>
        </CardHeader>
        <CardContent>
          {historyLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded" />
              ))}
            </div>
          ) : history && Array.isArray(history) && history.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>날짜</TableHead>
                  <TableHead className="text-right">팩터</TableHead>
                  <TableHead className="text-right">매매</TableHead>
                  <TableHead className="text-right">총 손익</TableHead>
                  <TableHead className="text-right">실행 시각</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((item) => {
                  const pnl = item.aggregate_metrics?.total_pnl ?? 0
                  const trades = item.aggregate_metrics?.total_trades ?? 0
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        {item.target_date}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {item.factor_ids?.length ?? 0}개
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {trades}건
                      </TableCell>
                      <TableCell
                        className={cn(
                          "text-right tabular-nums",
                          pnl > 0 ? "text-red-600" : pnl < 0 ? "text-blue-600" : "",
                        )}
                      >
                        {formatKRW(pnl)}
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">
                        {formatCreatedAt(item.created_at)}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">
              리플레이 히스토리가 없습니다.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ── Session Result Card ──────────────────────────────────

function SessionResultCard({
  session,
  expanded,
  onToggle,
}: {
  session: ReplaySession
  expanded: boolean
  onToggle: () => void
}) {
  const m = session.metrics || {}
  const pnl = m.total_pnl ?? 0
  const pnlPct = m.total_pnl_pct ?? 0
  const winRate = m.win_rate ?? 0

  if (session.error) {
    return (
      <Card>
        <CardContent className="px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{session.factor_name}</span>
            <Badge variant="outline" className="text-[10px]">
              {session.interval}
            </Badge>
            <span className="text-xs text-destructive">{session.error}</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="px-4 py-3">
        <button
          type="button"
          className="flex w-full items-center justify-between text-left"
          onClick={onToggle}
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{session.factor_name}</span>
            <Badge variant="outline" className="text-[10px]">
              {session.interval}
            </Badge>
          </div>
          <div className="flex items-center gap-4 text-xs tabular-nums">
            <span className="text-muted-foreground">
              {session.trade_count}건
            </span>
            <span
              className={cn(
                "font-medium",
                pnl > 0 ? "text-red-600" : pnl < 0 ? "text-blue-600" : "text-muted-foreground",
              )}
            >
              {formatKRW(pnl)}
              <span className="ml-1 text-[10px]">
                ({pnlPct > 0 ? "+" : ""}{pnlPct.toFixed(2)}%)
              </span>
            </span>
            <span className="text-muted-foreground">
              승률 {winRate.toFixed(1)}%
            </span>
            <span className="text-muted-foreground text-[10px]">
              {expanded ? "접기" : "펼치기"}
            </span>
          </div>
        </button>

        {expanded && session.trade_log.length > 0 && (
          <div className="mt-3 border-t pt-3">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">시각</TableHead>
                  <TableHead className="text-xs">종목</TableHead>
                  <TableHead className="text-center text-xs">구분</TableHead>
                  <TableHead className="text-right text-xs">수량</TableHead>
                  <TableHead className="text-right text-xs">가격</TableHead>
                  <TableHead className="text-right text-xs">손익</TableHead>
                  <TableHead className="text-xs">사유</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {session.trade_log.map((t: ReplayTrade, i: number) => (
                  <TableRow key={i}>
                    <TableCell className="text-xs tabular-nums text-muted-foreground">
                      {formatTradeTime(t.candle_dt)}
                    </TableCell>
                    <TableCell className="text-xs font-medium">
                      {t.name ?? t.symbol}
                      {t.name && (
                        <span className="ml-1 text-[10px] text-muted-foreground">
                          {t.symbol}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <span
                        className={cn(
                          "rounded px-1.5 py-0.5 text-[10px]",
                          t.side === "BUY"
                            ? "bg-red-50 text-red-600"
                            : "bg-blue-50 text-blue-600",
                        )}
                      >
                        {t.side === "BUY" ? "매수" : "매도"}
                        {t.step && ` (${t.step})`}
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-xs tabular-nums">
                      {t.qty.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right text-xs tabular-nums">
                      {Math.round(t.price).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right text-xs tabular-nums">
                      {t.pnl_amount != null ? (
                        <span
                          className={cn(
                            t.pnl_amount > 0 ? "text-red-600" : t.pnl_amount < 0 ? "text-blue-600" : "",
                          )}
                        >
                          {formatKRW(t.pnl_amount)}
                          {t.pnl_pct != null && (
                            <span className="ml-0.5 text-[10px]">
                              ({t.pnl_pct > 0 ? "+" : ""}{t.pnl_pct.toFixed(2)}%)
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">
                      {t.reason}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {expanded && session.trade_log.length === 0 && (
          <div className="mt-3 border-t pt-3">
            <p className="text-center text-xs text-muted-foreground">
              매매 기록이 없습니다.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ── Summary Card ─────────────────────────────────────────

function SummaryCard({
  label,
  value,
  highlight,
}: {
  label: string
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

// ── Helpers ──────────────────────────────────────────────

function formatTradeTime(dt: string): string {
  if (!dt) return "-"
  try {
    // candle_dt format: "2026-03-26T09:05:00"
    const parts = dt.split("T")
    if (parts.length >= 2) return parts[1].substring(0, 8)
    return dt
  } catch {
    return dt
  }
}

function formatCreatedAt(ts: string): string {
  if (!ts) return "-"
  try {
    const d = new Date(ts)
    const M = String(d.getMonth() + 1).padStart(2, "0")
    const D = String(d.getDate()).padStart(2, "0")
    const hh = String(d.getHours()).padStart(2, "0")
    const mm = String(d.getMinutes()).padStart(2, "0")
    return `${M}/${D} ${hh}:${mm}`
  } catch {
    return ts
  }
}

export default ReplayPanel
