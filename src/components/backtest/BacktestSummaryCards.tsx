import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { formatKRW } from "@/lib/format"

interface BacktestSummaryCardsProps {
  metrics: Record<string, number> | null
  strategyJson?: Record<string, unknown> | null
  startDate?: string
  endDate?: string
  initialCapital?: number
  maxPositions?: number
  positionSizePct?: number
}

// ── 메트릭 행 ──
function Row({
  label,
  value,
  color,
  bold,
}: {
  label: string
  value: string
  color?: "red" | "blue" | "neutral"
  bold?: boolean
}) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span
        className={cn(
          "text-xs tabular-nums",
          bold && "font-semibold text-sm",
          color === "red" && "text-red-500",
          color === "blue" && "text-blue-500",
        )}
      >
        {value}
      </span>
    </div>
  )
}

function BacktestSummaryCards({
  metrics,
  strategyJson,
  startDate,
  endDate,
  initialCapital,
  maxPositions,
  positionSizePct,
}: BacktestSummaryCardsProps) {
  if (!metrics) return null

  const m = (k: string) => metrics[k] ?? 0
  const pnlColor = (v: number): "red" | "blue" => (v >= 0 ? "red" : "blue")

  // 설정값 추출
  const risk = (strategyJson?.risk_management ?? {}) as Record<string, unknown>
  const scaling = (strategyJson?.scaling ?? {}) as Record<string, unknown>
  const ps = (strategyJson?.position_sizing ?? {}) as Record<string, unknown>
  const hasAdvanced = !!(risk.stop_loss_pct || risk.trailing_stop_pct || risk.atr_stop_multiplier || scaling.enabled)

  // 분할매매 지표
  const hasScaleMetrics =
    m("scale_in_count") > 0 || m("partial_exit_count") > 0 || m("stop_loss_count") > 0 || m("eod_close_count") > 0

  const payoff = m("avg_loss") !== 0 ? Math.abs(m("avg_win") / m("avg_loss")) : 0

  // 팩터/전략 정보
  const strategyName = strategyJson?.name as string | undefined
  const buyConds = strategyJson?.buy_conditions as Array<Record<string, unknown>> | undefined
  const sellConds = strategyJson?.sell_conditions as Array<Record<string, unknown>> | undefined

  const formatCond = (c: Record<string, unknown>) => {
    const ind = String(c.indicator ?? "")
    const params = c.params as Record<string, unknown> | undefined
    const paramStr = params ? Object.entries(params).map(([k, v]) => `${k}=${v}`).join(",") : ""
    return `${ind}${paramStr ? `(${paramStr})` : ""} ${c.operator ?? ""} ${c.value ?? ""}`
  }

  return (
    <div className="space-y-3">
      {/* 설정값 + 전략 스펙 */}
      <Card>
        <CardContent className="py-3 px-4 space-y-2">
          <div className="text-[10px] font-medium text-muted-foreground">설정값</div>
          <div className="grid gap-x-8 gap-y-0 sm:grid-cols-2 lg:grid-cols-3">
            {strategyName && <Row label="전략" value={strategyName} />}
            {startDate && endDate && <Row label="기간" value={`${startDate} ~ ${endDate}`} />}
            {initialCapital != null && <Row label="초기 자본금" value={formatKRW(initialCapital)} />}
            {maxPositions != null && <Row label="최대 보유 종목" value={`${maxPositions}종목`} />}
            {positionSizePct != null && <Row label="종목당 비중" value={`${(positionSizePct * 100).toFixed(0)}%`} />}
            {(strategyJson?.timeframe || strategyJson?.interval) && <Row label="타임프레임" value={String(strategyJson.timeframe || strategyJson.interval)} />}
            {ps.mode && ps.mode !== "fixed" && <Row label="포지션 사이징" value={String(ps.mode)} />}
            {risk.stop_loss_pct != null && <Row label="손절" value={`${risk.stop_loss_pct}%`} />}
            {risk.trailing_stop_pct != null && <Row label="트레일링 스탑" value={`${risk.trailing_stop_pct}%`} />}
            {risk.atr_stop_multiplier != null && <Row label="ATR 스탑" value={`×${risk.atr_stop_multiplier}`} />}
            {scaling.enabled && (
              <>
                <Row label="분할매수" value={`${scaling.scale_in_drop_pct ?? "-"}% 하락 시`} />
                <Row label="부분익절" value={`${scaling.partial_exit_gain_pct ?? "-"}% 수익 시`} />
              </>
            )}
          </div>
          {/* 전략 스펙: 팩터 수식 또는 매수/매도 조건 */}
          {strategyJson?.expression ? (
            <div className="border-t pt-2 space-y-1">
              <div className="text-[10px] font-medium text-muted-foreground">팩터 수식</div>
              <div className="text-[11px] font-mono text-foreground break-all leading-relaxed bg-muted/50 rounded px-2 py-1.5">
                {String(strategyJson.expression)}
              </div>
              <div className="grid gap-x-8 gap-y-0 sm:grid-cols-3">
                {strategyJson.mode && <Row label="모드" value={String(strategyJson.mode)} />}
                {strategyJson.interval && <Row label="인터벌" value={String(strategyJson.interval)} />}
                {strategyJson.top_pct != null && <Row label="상위 비율" value={`${Number(strategyJson.top_pct) * 100}%`} />}
                {strategyJson.rebalance_freq && <Row label="리밸런싱" value={String(strategyJson.rebalance_freq)} />}
                {strategyJson.band_threshold != null && <Row label="밴드 임계" value={`${Number(strategyJson.band_threshold) * 100}%`} />}
              </div>
            </div>
          ) : (buyConds?.length || sellConds?.length) ? (
            <div className="border-t pt-2 grid gap-x-8 gap-y-0 sm:grid-cols-2">
              {buyConds?.length ? (
                <div>
                  <span className="text-[10px] font-medium text-red-500">매수 ({strategyJson?.buy_logic === "OR" ? "OR" : "AND"})</span>
                  {buyConds.map((c, i) => (
                    <div key={i} className="text-[11px] text-muted-foreground font-mono">{formatCond(c)}</div>
                  ))}
                </div>
              ) : null}
              {sellConds?.length ? (
                <div>
                  <span className="text-[10px] font-medium text-blue-500">매도 ({strategyJson?.sell_logic === "AND" ? "AND" : "OR"})</span>
                  {sellConds.map((c, i) => (
                    <div key={i} className="text-[11px] text-muted-foreground font-mono">{formatCond(c)}</div>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* 통계 — 3열 레이아웃 */}
      <div className="grid gap-3 lg:grid-cols-3">
        {/* 수익 성과 */}
        <Card>
          <CardContent className="py-3 px-4">
            <div className="text-[10px] font-medium text-muted-foreground mb-1">수익 성과</div>
            <Row label="총 수익률" value={`${m("total_return") > 0 ? "+" : ""}${m("total_return").toFixed(2)}%`} color={pnlColor(m("total_return"))} bold />
            <Row label="수익금" value={`${m("total_return_amount") >= 0 ? "+" : ""}${Math.round(m("total_return_amount")).toLocaleString()}원`} color={pnlColor(m("total_return_amount"))} />
            <Row label="연환산 수익률" value={`${m("annualized_return") > 0 ? "+" : ""}${m("annualized_return").toFixed(1)}%`} color={pnlColor(m("annualized_return"))} />
            <Row label="Sharpe Ratio" value={m("sharpe_ratio").toFixed(2)} color={m("sharpe_ratio") >= 1 ? "red" : m("sharpe_ratio") < 0 ? "blue" : "neutral"} />
            <Row label="Profit Factor" value={m("profit_factor").toFixed(2)} color={m("profit_factor") >= 1 ? "red" : "blue"} />
          </CardContent>
        </Card>

        {/* 매매 통계 */}
        <Card>
          <CardContent className="py-3 px-4">
            <div className="text-[10px] font-medium text-muted-foreground mb-1">매매 통계</div>
            <Row label="총 거래" value={`${m("total_trades").toLocaleString()}건`} bold />
            <Row label="승률" value={`${m("win_rate").toFixed(1)}%`} />
            <Row label="평균 수익" value={m("avg_win") ? `+${m("avg_win").toFixed(2)}%` : "-"} color="red" />
            <Row label="평균 손실" value={m("avg_loss") ? `${m("avg_loss").toFixed(2)}%` : "-"} color="blue" />
            <Row label="Payoff Ratio" value={payoff > 0 ? payoff.toFixed(2) : "-"} color={payoff >= 1 ? "red" : "blue"} />
            <Row label="평균 보유기간" value={m("avg_holding_days") > 0 ? `${m("avg_holding_days").toFixed(1)}일` : "-"} />
          </CardContent>
        </Card>

        {/* 리스크 */}
        <Card>
          <CardContent className="py-3 px-4">
            <div className="text-[10px] font-medium text-muted-foreground mb-1">리스크</div>
            <Row label="MDD" value={`${m("mdd").toFixed(2)}%`} color="blue" bold />
            <Row label="MDD 금액" value={`${Math.round(m("mdd_amount")).toLocaleString()}원`} color="blue" />
            <Row label="최대 연승" value={`${m("max_consecutive_wins")}연승`} color="red" />
            <Row label="최대 연패" value={`${m("max_consecutive_losses")}연패`} color="blue" />
            {hasScaleMetrics && (
              <>
                <Row label="분할매수" value={`${m("scale_in_count")}건`} />
                <Row label="부분익절" value={`${m("partial_exit_count")}건`} />
                <Row label="손절" value={`${m("stop_loss_count")}건`} color="blue" />
                {m("eod_close_count") > 0 && (
                  <Row label="장종료 청산" value={`${m("eod_close_count")}건`} />
                )}
                {m("band_trades_saved") > 0 && (
                  <Row label="밴드 억제" value={`${m("band_trades_saved")}건`} />
                )}
              </>
            )}
            {/* 장중 전용 메트릭 */}
            {m("cost_drag_pct") > 0 && (
              <Row label="비용 드래그" value={`${m("cost_drag_pct")}%`} color="blue" />
            )}
            {m("intraday_mdd_worst") > 0 && (
              <>
                <Row label="장중 MDD 최악" value={`${m("intraday_mdd_worst")}%`} color="blue" />
                <Row label="장중 MDD 평균" value={`${m("intraday_mdd_avg")}%`} />
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default BacktestSummaryCards
