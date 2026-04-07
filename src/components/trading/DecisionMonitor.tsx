import { useState } from "react"
import { useSessionDecisions } from "@/hooks/queries/use-trading"
import type { DecisionLog } from "@/api/trading"

const ACTION_COLORS: Record<string, string> = {
  BUY: "text-red-600 bg-red-50",
  SELL: "text-blue-600 bg-blue-50",
  RISK_STOP: "text-amber-600 bg-amber-50",
  RISK_TRAIL: "text-amber-600 bg-amber-50",
  RISK_ATR_STOP: "text-amber-600 bg-amber-50",
  PARTIAL_EXIT: "text-purple-600 bg-purple-50",
  SCALE_IN: "text-red-500 bg-red-50",
  SKIP_BUY: "text-gray-500 bg-gray-50",
  SKIP_DATA: "text-gray-400 bg-gray-50",
  SKIP_ERROR: "text-gray-400 bg-gray-50",
  SKIP_STRATEGY_FILTER: "text-gray-400 bg-gray-50",
  SKIP_PENDING: "text-gray-400 bg-gray-50",
}

const ACTION_LABELS: Record<string, string> = {
  BUY: "매수",
  SELL: "매도",
  RISK_STOP: "손절",
  RISK_TRAIL: "트레일링",
  RISK_ATR_STOP: "ATR손절",
  PARTIAL_EXIT: "부분익절",
  SCALE_IN: "추가매수",
  SKIP_BUY: "매수스킵",
  SKIP_DATA: "데이터부족",
  SKIP_ERROR: "시그널오류",
  SKIP_STRATEGY_FILTER: "필터제외",
  SKIP_PENDING: "체결대기",
}

const FILTER_OPTIONS = [
  { value: "", label: "전체" },
  { value: "BUY", label: "매수" },
  { value: "SELL", label: "매도" },
  { value: "SKIP_BUY", label: "매수스킵" },
  { value: "RISK_STOP", label: "손절" },
  { value: "RISK_TRAIL", label: "트레일링" },
]

interface Props {
  sessionId: string
  tickSummary?: {
    last_tick_at?: string
    bars_count?: string
    buy_signals?: string
    sell_signals?: string
    skip_buy?: string
    hold_count?: string
    positions?: string
    max_positions?: string
    cash?: string
    trade_count?: string
    status_detail?: string
  }
}

export default function DecisionMonitor({ sessionId, tickSummary }: Props) {
  const [actionFilter, setActionFilter] = useState("")
  const [expandedRow, setExpandedRow] = useState<number | null>(null)
  const { data: decisions = [], isLoading } = useSessionDecisions(
    sessionId,
    { action: actionFilter || undefined, limit: 100 },
  )

  const ts = tickSummary

  // #1: positions를 JSON 파싱하여 보유 종목 수 산출
  const positionCount = (() => {
    if (!ts?.positions) return "-"
    try {
      const parsed = JSON.parse(ts.positions)
      if (typeof parsed === "object" && parsed !== null) {
        return String(Object.keys(parsed).length)
      }
    } catch {
      // 숫자 문자열이면 그대로 사용
      if (/^\d+$/.test(ts.positions)) return ts.positions
    }
    return ts?.hold_count ?? "-"
  })()

  // #19: status_detail 자연어 변환
  const statusMessage = (() => {
    if (!ts?.status_detail) return null
    const raw = ts.status_detail
    const match = raw.match(/no_bars\(skip=(\d+),err=(\d+),no_today=(\d+)\)/)
    if (match) {
      const [, skip, err, noToday] = match
      const parts: string[] = []
      if (Number(noToday) > 0) parts.push(`${noToday}종목 오늘 데이터 없음`)
      if (Number(skip) > 0) parts.push(`${skip}건 스킵`)
      if (Number(err) > 0) parts.push(`${err}건 오류`)
      return parts.join(" / ")
    }
    return raw
  })()

  // 현금 포맷
  const cashDisplay = (() => {
    if (!ts?.cash) return "-"
    const n = Number(ts.cash)
    if (isNaN(n)) return ts.cash
    return n.toLocaleString("ko-KR")
  })()

  return (
    <div className="space-y-4">
      {/* tick 요약 카드 */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
        <StatCard
          label="마지막 tick"
          value={ts?.last_tick_at ? new Date(ts.last_tick_at).toLocaleTimeString("ko-KR") : "-"}
        />
        <StatCard label="오늘봉" value={`${ts?.bars_count ?? "-"}종목`} />
        <StatCard
          label="BUY 시그널"
          value={ts?.buy_signals ?? "-"}
          highlight={Number(ts?.buy_signals) > 0 ? "red" : undefined}
        />
        <StatCard
          label="SELL 시그널"
          value={ts?.sell_signals ?? "-"}
          highlight={Number(ts?.sell_signals) > 0 ? "blue" : undefined}
        />
        <StatCard
          label="보유"
          value={`${positionCount}/${ts?.max_positions ?? "-"}`}
        />
        <StatCard label="현금" value={cashDisplay} />
      </div>

      {statusMessage && (
        <p className="text-xs text-amber-600">{statusMessage}</p>
      )}

      {/* #14: 실행된 매매 판단 고정 표시 (BUY/SELL만 필터) */}
      {(() => {
        const executed = decisions.filter(
          (d: DecisionLog) => d.action === "BUY" || d.action === "SELL" ||
            d.action === "RISK_STOP" || d.action === "RISK_TRAIL" ||
            d.action === "PARTIAL_EXIT" || d.action === "SCALE_IN"
        )
        if (executed.length === 0) return null
        return (
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
            <p className="mb-2 text-xs font-semibold text-primary">실행된 매매 판단 ({executed.length}건)</p>
            <div className="space-y-1">
              {executed.slice(-10).reverse().map((d: DecisionLog, i: number) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <span className="tabular-nums text-gray-500 w-16">
                    {d.timestamp ? new Date(d.timestamp).toLocaleTimeString("ko-KR") : "-"}
                  </span>
                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${ACTION_COLORS[d.action] ?? ""}`}>
                    {ACTION_LABELS[d.action] ?? d.action}
                  </span>
                  <span className="font-medium">{d.name || d.symbol}</span>
                  <span className="flex-1 truncate text-gray-500">{d.reason}</span>
                </div>
              ))}
            </div>
          </div>
        )
      })()}

      {/* 필터 */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-gray-500">필터:</span>
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setActionFilter(opt.value)}
            className={`rounded-full px-2.5 py-0.5 text-xs transition-colors ${
              actionFilter === opt.value
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* 의사결정 로그 테이블 */}
      <div className="max-h-96 overflow-auto rounded-lg border">
        <table className="w-full text-left text-xs">
          <thead className="sticky top-0 bg-gray-50 text-gray-500">
            <tr>
              <th className="px-3 py-2 font-medium">시각</th>
              <th className="px-3 py-2 font-medium">종목</th>
              <th className="px-3 py-2 font-medium">판단</th>
              <th className="px-3 py-2 font-medium">사유</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              <tr>
                <td colSpan={4} className="px-3 py-8 text-center text-gray-400">
                  로딩 중...
                </td>
              </tr>
            ) : decisions.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-8 text-center text-gray-400">
                  의사결정 기록 없음
                </td>
              </tr>
            ) : (
              decisions
                .slice()
                .reverse()
                .map((d: DecisionLog, i: number) => {
                  const isExpanded = expandedRow === i
                  return (
                    <tr
                      key={i}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => setExpandedRow(isExpanded ? null : i)}
                    >
                      <td className="whitespace-nowrap px-3 py-1.5 tabular-nums text-gray-500 align-top">
                        {d.timestamp
                          ? new Date(d.timestamp).toLocaleTimeString("ko-KR")
                          : "-"}
                      </td>
                      <td className="whitespace-nowrap px-3 py-1.5 align-top">
                        <span className="font-medium">{d.name || d.symbol}</span>
                        {d.name && (
                          <span className="ml-1 text-gray-400">{d.symbol}</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-3 py-1.5 align-top">
                        <span
                          className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                            ACTION_COLORS[d.action] ?? "text-gray-500 bg-gray-50"
                          }`}
                        >
                          {ACTION_LABELS[d.action] ?? d.action}
                        </span>
                      </td>
                      <td className="px-3 py-1.5 text-gray-600 align-top">
                        <div className={isExpanded ? "" : "max-w-xs truncate"}>
                          {d.reason}
                        </div>
                        {isExpanded && d.conditions && (
                          <div className="mt-1.5 space-y-1 rounded bg-gray-50 p-2 text-[10px]">
                            {(d.conditions as Record<string, unknown>)?.buy_conditions &&
                              (
                                (d.conditions as Record<string, unknown>)
                                  .buy_conditions as Array<Record<string, unknown>>
                              )?.map(
                                (c: Record<string, unknown>, ci: number) => (
                                  <div key={ci} className={c.met ? "text-red-600" : "text-gray-400"}>
                                    {String(c.indicator)} {String(c.op)} {String(c.threshold)} (실제: {String(c.actual)}) {c.met ? "충족" : "미충족"}
                                  </div>
                                ),
                              )}
                            {d.sizing && (
                              <div className="mt-1 border-t pt-1 text-gray-500">
                                배분: {Number((d.sizing as Record<string, number>)?.alloc_cash_limited ?? 0).toLocaleString()}원
                                / 수량: {(d.sizing as Record<string, number>)?.qty ?? "-"}주
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  highlight,
}: {
  label: string
  value: string
  highlight?: "red" | "blue"
}) {
  const colorClass =
    highlight === "red"
      ? "text-red-600"
      : highlight === "blue"
        ? "text-blue-600"
        : "text-gray-900"

  return (
    <div className="rounded-lg border bg-white p-2">
      <p className="text-[10px] text-gray-500">{label}</p>
      <p className={`text-sm font-semibold tabular-nums ${colorClass}`}>
        {value}
      </p>
    </div>
  )
}
