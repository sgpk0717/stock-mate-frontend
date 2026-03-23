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
  const { data: decisions = [], isLoading } = useSessionDecisions(
    sessionId,
    { action: actionFilter || undefined, limit: 100 },
  )

  const ts = tickSummary

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
          value={`${ts?.positions ?? "-"}/${ts?.max_positions ?? "-"}`}
        />
        <StatCard label="현금" value={ts?.cash ?? "-"} />
      </div>

      {ts?.status_detail && (
        <p className="text-xs text-gray-500">{ts.status_detail}</p>
      )}

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
                .map((d: DecisionLog, i: number) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-3 py-1.5 tabular-nums text-gray-500">
                      {d.timestamp
                        ? new Date(d.timestamp).toLocaleTimeString("ko-KR")
                        : "-"}
                    </td>
                    <td className="whitespace-nowrap px-3 py-1.5">
                      <span className="font-medium">{d.name || d.symbol}</span>
                      {d.name && (
                        <span className="ml-1 text-gray-400">{d.symbol}</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-3 py-1.5">
                      <span
                        className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                          ACTION_COLORS[d.action] ?? "text-gray-500 bg-gray-50"
                        }`}
                      >
                        {ACTION_LABELS[d.action] ?? d.action}
                      </span>
                    </td>
                    <td className="max-w-xs truncate px-3 py-1.5 text-gray-600">
                      {d.reason}
                    </td>
                  </tr>
                ))
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
