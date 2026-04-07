import { useAlphaRankingByFactor, useTradingStatus } from "@/hooks/queries/use-trading"
import type { AlphaCandidate, FactorRanking } from "@/api/trading"

const INTERVAL_LABELS: Record<string, string> = {
  "5m": "5분봉",
  "1d": "일봉",
  "1m": "1분봉",
  "1h": "1시간봉",
}

export default function AlphaRanking() {
  const { data, isLoading } = useAlphaRankingByFactor(10)
  const { data: sessions } = useTradingStatus()

  // 세션별 보유 종목 추출 (factor_id → symbols)
  const heldByFactor = new Map<string, Set<string>>()
  if (sessions) {
    for (const s of sessions) {
      const raw = s as unknown as Record<string, string>
      const factorId = raw.factor_id || (s as unknown as Record<string, Record<string, string>>)?.strategy?.factor_id || ""
      const fid8 = factorId.slice(0, 8)
      try {
        const pos = typeof s.positions === "string"
          ? JSON.parse(s.positions as string)
          : s.positions
        if (pos && typeof pos === "object") {
          const syms = new Set(Object.keys(pos as Record<string, unknown>))
          if (syms.size > 0) {
            heldByFactor.set(fid8, syms)
          }
        }
      } catch { /* ignore */ }
    }
  }

  if (isLoading) {
    return <div className="py-12 text-center text-sm text-muted-foreground">스코어 로딩 중...</div>
  }

  if (!data || data.factors.length === 0) {
    return (
      <div className="rounded-lg border p-6 text-center text-sm text-muted-foreground">
        활성 팩터가 없거나 스코어 엔진이 아직 시작되지 않았습니다.
        <br />
        <span className="text-[10px]">market_open 이후 5분 내에 스코어가 계산됩니다.</span>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* 상태 바 */}
      <div className="flex items-center justify-between text-[10px] text-gray-500">
        <span>{data.factors.length}개 팩터 활성</span>
        <span>
          {data.updated_at
            ? `갱신: ${new Date(data.updated_at).toLocaleTimeString("ko-KR")} · v${data.version} · 5초 주기`
            : "대기 중"}
        </span>
      </div>

      {/* 팩터별 랭킹보드 */}
      {data.factors.map((factor) => {
        const held = heldByFactor.get(factor.factor_id) ?? new Set<string>()
        const filteredSell = factor.sell_candidates.filter((c) => held.has(c.symbol))

        return (
          <FactorBoard
            key={factor.factor_id}
            factor={factor}
            sellCandidates={filteredSell}
            heldCount={held.size}
          />
        )
      })}

      {/* 컬럼 설명 */}
      <div className="flex gap-4 text-[10px] text-gray-400">
        <span>스코어: 0~1 (높을수록 매수 유력)</span>
        <span>RSI: 상대강도지수</span>
        <span>거래량 비율: 20일 평균 대비</span>
      </div>
    </div>
  )
}

function FactorBoard({
  factor,
  sellCandidates,
  heldCount,
}: {
  factor: FactorRanking
  sellCandidates: AlphaCandidate[]
  heldCount: number
}) {
  const intervalLabel = INTERVAL_LABELS[factor.interval] || factor.interval
  const allSameScore =
    factor.buy_candidates.length > 1 &&
    factor.buy_candidates.every((c) => c.score === factor.buy_candidates[0].score)

  return (
    <div className="rounded-lg border">
      {/* 헤더 */}
      <div className="flex items-center justify-between border-b bg-gray-50 px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">{factor.factor_name}</span>
          <span
            className={`rounded px-1.5 py-0.5 text-[9px] font-semibold ${
              factor.interval === "1d"
                ? "bg-amber-100 text-amber-700"
                : "bg-blue-100 text-blue-700"
            }`}
          >
            {intervalLabel}
          </span>
        </div>
        <span className="text-[10px] text-gray-500">
          {factor.scored_count}종목 스코어링
        </span>
      </div>

      {/* 경고: 모든 스코어 동일 */}
      {allSameScore && (
        <div className="bg-amber-50 px-4 py-1.5 text-[10px] text-amber-700">
          모든 스코어가 동일합니다 ({factor.buy_candidates[0]?.score.toFixed(3)}).
          데이터 부족이거나 엔진이 계산을 시작하지 않았습니다.
        </div>
      )}

      {/* 매수/매도 2열 */}
      <div className="grid grid-cols-2 divide-x">
        <RankingTable
          title="매수 임박"
          items={factor.buy_candidates}
          type="buy"
        />
        <RankingTable
          title={`매도 임박 (보유 ${heldCount}종목)`}
          items={sellCandidates}
          type="sell"
          emptyMessage={heldCount === 0 ? "보유 종목 없음" : "매도 대상 없음"}
        />
      </div>
    </div>
  )
}

function RankingTable({
  title,
  items,
  type,
  emptyMessage,
}: {
  title: string
  items: AlphaCandidate[]
  type: "buy" | "sell"
  emptyMessage?: string
}) {
  const headerColor = type === "buy" ? "text-red-700" : "text-blue-700"

  return (
    <div className="p-2">
      <p className={`mb-1 text-[10px] font-semibold ${headerColor}`}>{title}</p>
      {items.length === 0 ? (
        <p className="py-4 text-center text-[10px] text-gray-400">{emptyMessage || "데이터 없음"}</p>
      ) : (
        <table className="w-full text-[10px]">
          <thead className="text-gray-500">
            <tr>
              <th className="w-5 py-0.5 text-center">#</th>
              <th className="py-0.5 text-left">종목</th>
              <th className="py-0.5 text-right">스코어</th>
              <th className="py-0.5 text-right">RSI</th>
            </tr>
          </thead>
          <tbody>
            {items.slice(0, 10).map((item, i) => {
              const scoreColor =
                item.score >= 0.7
                  ? "text-red-600 font-semibold"
                  : item.score <= 0.3
                    ? "text-blue-600 font-semibold"
                    : "text-gray-700"
              return (
                <tr key={item.symbol} className="hover:bg-gray-50">
                  <td className="py-0.5 text-center text-gray-400">{i + 1}</td>
                  <td className="py-0.5">
                    <span className="font-medium">{item.name || item.symbol}</span>
                    <span className="ml-1 text-gray-400">{item.symbol}</span>
                  </td>
                  <td className={`py-0.5 text-right tabular-nums ${scoreColor}`}>
                    {item.score.toFixed(3)}
                  </td>
                  <td className="py-0.5 text-right tabular-nums text-gray-600">
                    {Number(item.rsi).toFixed(0)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}
