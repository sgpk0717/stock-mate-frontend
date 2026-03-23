import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useWorkflowHistory } from "@/hooks/queries/use-workflow"
import { useTradingDayDetail } from "@/hooks/queries/use-trading"
import { formatKRW } from "@/lib/format"
import type { WorkflowRun } from "@/types/workflow"

function pnlColor(pnl: number | null) {
  if (pnl == null || pnl === 0) return "text-muted-foreground"
  return pnl > 0 ? "text-emerald-600" : "text-red-500"
}

function pnlSign(pnl: number | null) {
  if (pnl == null) return "-"
  return pnl > 0 ? `+${pnl.toFixed(2)}%` : `${pnl.toFixed(2)}%`
}

function TradingResultBadge({
  tradeCount,
  pnlPct,
}: {
  tradeCount: number
  pnlPct: number | null
}) {
  if (!tradeCount || tradeCount === 0) {
    return <Badge variant="outline">매매 없음</Badge>
  }
  if (pnlPct == null || pnlPct === 0) {
    return <Badge variant="secondary">보합</Badge>
  }
  if (pnlPct > 0) {
    return <Badge className="bg-emerald-600 text-white">수익</Badge>
  }
  return <Badge variant="destructive">손실</Badge>
}

function FactorChip({ name, pnlPct }: { name: string; pnlPct?: number }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs">
      <span className="font-mono">{name}</span>
      {pnlPct != null && (
        <span className={pnlColor(pnlPct)}>{pnlSign(pnlPct)}</span>
      )}
    </span>
  )
}

function DayRow({
  run,
  isExpanded,
  onToggle,
}: {
  run: WorkflowRun
  isExpanded: boolean
  onToggle: () => void
}) {
  const rs = run.review_summary as Record<string, unknown> | null
  const winRate = rs?.win_rate as number | undefined
  const perSession = (rs?.per_session ?? []) as Array<{
    factor_name: string
    pnl_pct: number
    trade_count: number
    win_rate: number
  }>
  const factors = (
    run.config as Record<string, unknown> | null
  )?.selected_factors as Array<{ name: string }> | undefined

  return (
    <div className="rounded-lg border">
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/30 transition-colors"
      >
        <span className="w-24 shrink-0 font-mono text-sm">{run.date}</span>
        <TradingResultBadge tradeCount={run.trade_count} pnlPct={run.pnl_pct} />
        <div className="flex flex-1 flex-wrap gap-1">
          {factors?.map((f) => {
            const session = perSession.find((s) => s.factor_name === f.name)
            return (
              <FactorChip
                key={f.name}
                name={f.name}
                pnlPct={session?.pnl_pct}
              />
            )
          })}
        </div>
        <span className="w-16 text-right text-sm tabular-nums">
          {run.trade_count ?? 0}건
        </span>
        <span className="w-16 text-right text-sm tabular-nums">
          {winRate != null ? `${winRate.toFixed(0)}%` : "-"}
        </span>
        <span className={`w-24 text-right font-mono text-sm tabular-nums ${pnlColor(run.pnl_pct)}`}>
          {pnlSign(run.pnl_pct)}
        </span>
        <span className={`w-28 text-right text-xs tabular-nums ${pnlColor(run.pnl_amount)}`}>
          {run.pnl_amount != null ? formatKRW(run.pnl_amount) : "-"}
        </span>
        <span className="text-muted-foreground">{isExpanded ? "\u25B2" : "\u25BC"}</span>
      </button>
      {isExpanded && <DayDetail run={run} />}
    </div>
  )
}

function DayDetail({ run }: { run: WorkflowRun }) {
  const { data: dayTrades, isLoading } = useTradingDayDetail(run.date)
  const rs = run.review_summary as Record<string, unknown> | null
  const perSession = (rs?.per_session ?? []) as Array<{
    context_id: string
    factor_name: string
    expression: string
    ic_mean: number
    trade_count: number
    sell_count: number
    win_count: number
    loss_count: number
    win_rate: number
    pnl_amount: number
    pnl_pct: number
  }>
  const improvements = (rs?.improvements ?? []) as string[]
  const timeBreakdown = rs?.time_breakdown as Record<string, number> | undefined

  return (
    <div className="space-y-4 border-t px-4 py-3">
      {/* 팩터별 성과 */}
      {perSession.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            팩터별 성과
          </p>
          <div className="space-y-2">
            {perSession.map((s) => (
              <div
                key={s.context_id}
                className="flex items-center gap-3 rounded border px-3 py-2 text-sm"
              >
                <span className="w-28 shrink-0 truncate font-mono text-xs">
                  {s.factor_name}
                </span>
                <span className="w-16 text-right tabular-nums">
                  {s.trade_count}건
                </span>
                <span className="w-16 text-right tabular-nums">
                  승률 {s.win_rate?.toFixed(0)}%
                </span>
                <span className={`w-28 text-right font-mono tabular-nums ${pnlColor(s.pnl_pct)}`}>
                  {pnlSign(s.pnl_pct)}
                </span>
                <span className={`flex-1 text-right text-xs tabular-nums ${pnlColor(s.pnl_amount)}`}>
                  {formatKRW(s.pnl_amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 시간대별 수익 */}
      {timeBreakdown && (
        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            시간대별 수익률
          </p>
          <div className="flex gap-4 text-sm">
            {Object.entries(timeBreakdown).map(([period, pnl]) => (
              <div key={period} className="flex items-center gap-1">
                <span className="text-muted-foreground">{period}:</span>
                <span className={`font-mono tabular-nums ${pnlColor(pnl)}`}>
                  {pnl > 0 ? "+" : ""}{pnl.toFixed(2)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 리뷰 개선 제안 */}
      {improvements.length > 0 && (
        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            개선 제안
          </p>
          <ul className="list-inside list-disc space-y-0.5 text-sm text-muted-foreground">
            {improvements.map((imp, i) => (
              <li key={i}>{imp}</li>
            ))}
          </ul>
        </div>
      )}

      {/* 개별 매매 목록 */}
      {isLoading ? (
        <p className="text-sm text-muted-foreground">매매 기록 불러오는 중...</p>
      ) : dayTrades && dayTrades.trades.length > 0 ? (
        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            매매 기록 ({dayTrades.trade_count}건)
          </p>
          <div className="max-h-60 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-background">
                <tr className="border-b text-muted-foreground">
                  <th className="py-1 text-left">시간</th>
                  <th className="py-1 text-left">종목</th>
                  <th className="py-1 text-center">유형</th>
                  <th className="py-1 text-right">수량</th>
                  <th className="py-1 text-right">가격</th>
                  <th className="py-1 text-right">손익</th>
                </tr>
              </thead>
              <tbody>
                {dayTrades.trades.slice(0, 100).map((t) => (
                  <tr key={t.id} className="border-b border-muted/30">
                    <td className="py-1 font-mono">
                      {t.executed_at
                        ? new Date(t.executed_at).toLocaleTimeString("ko-KR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "-"}
                    </td>
                    <td className="py-1">{t.symbol}</td>
                    <td className="py-1 text-center">
                      <Badge variant={t.side === "BUY" ? "default" : "destructive"} className="text-[10px] px-1">
                        {t.step ?? t.side}
                      </Badge>
                    </td>
                    <td className="py-1 text-right tabular-nums">{t.qty}</td>
                    <td className="py-1 text-right tabular-nums font-mono">
                      {t.price?.toLocaleString()}
                    </td>
                    <td className={`py-1 text-right tabular-nums font-mono ${pnlColor(t.pnl_pct)}`}>
                      {t.pnl_pct != null ? `${t.pnl_pct > 0 ? "+" : ""}${t.pnl_pct.toFixed(2)}%` : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {dayTrades.trades.length > 100 && (
              <p className="py-1 text-center text-xs text-muted-foreground">
                ... 외 {dayTrades.trades.length - 100}건
              </p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default function TradeDailyHistory() {
  const { data: history, isLoading } = useWorkflowHistory(30)
  const [expandedDate, setExpandedDate] = useState<string | null>(null)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        불러오는 중...
      </div>
    )
  }

  const runs = (history ?? []).filter(
    (r: WorkflowRun) => r.trade_count > 0 || r.status === "COMPLETED" || r.status === "MINING"
  )

  if (runs.length === 0) {
    return (
      <div className="rounded-lg border p-8 text-center text-muted-foreground">
        아직 매매 이력이 없습니다.
      </div>
    )
  }

  // 누적 P&L 계산
  const sortedRuns = [...runs].sort(
    (a, b) => a.date.localeCompare(b.date),
  )
  let cumPnl = 0
  const cumPnlByDate: Record<string, number> = {}
  for (const r of sortedRuns) {
    cumPnl += r.pnl_pct ?? 0
    cumPnlByDate[r.date] = cumPnl
  }

  return (
    <div className="space-y-4">
      {/* 요약 카드 */}
      <div className="grid grid-cols-4 gap-3">
        <SummaryCard label="매매 일수" value={`${runs.length}일`} />
        <SummaryCard
          label="누적 P&L"
          value={`${cumPnl > 0 ? "+" : ""}${cumPnl.toFixed(2)}%`}
          color={pnlColor(cumPnl)}
        />
        <SummaryCard
          label="승일 / 패일"
          value={`${runs.filter((r) => (r.pnl_pct ?? 0) > 0).length} / ${runs.filter((r) => (r.pnl_pct ?? 0) < 0).length}`}
        />
        <SummaryCard
          label="총 거래 수"
          value={`${runs.reduce((s, r) => s + (r.trade_count ?? 0), 0).toLocaleString()}건`}
        />
      </div>

      {/* 컬럼 헤더 */}
      <div className="flex items-center gap-3 px-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        <span className="w-24 shrink-0">날짜</span>
        <span className="w-14">상태</span>
        <span className="flex-1">팩터</span>
        <span className="w-16 text-right">매매 수</span>
        <span className="w-16 text-right">승률</span>
        <span className="w-24 text-right">P&L %</span>
        <span className="w-28 text-right">P&L 원</span>
        <span className="w-4" />
      </div>

      {/* 일자별 행 */}
      {runs.map((run: WorkflowRun) => (
        <DayRow
          key={run.id}
          run={run}
          isExpanded={expandedDate === run.date}
          onToggle={() =>
            setExpandedDate(expandedDate === run.date ? null : run.date)
          }
        />
      ))}
    </div>
  )
}

function SummaryCard({
  label,
  value,
  color,
}: {
  label: string
  value: string
  color?: string
}) {
  return (
    <Card>
      <CardContent className="px-4 py-3">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`text-lg font-semibold tabular-nums ${color ?? ""}`}>
          {value}
        </p>
      </CardContent>
    </Card>
  )
}
