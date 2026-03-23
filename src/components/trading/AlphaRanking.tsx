import { useAlphaRanking } from "@/hooks/queries/use-trading"
import type { AlphaCandidate } from "@/api/trading"

export default function AlphaRanking() {
  const { data, isLoading } = useAlphaRanking(10)

  if (isLoading || !data) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <RankingCard title="매수 임박" items={[]} loading />
        <RankingCard title="매도 임박" items={[]} loading />
      </div>
    )
  }

  const hasData = data.scored_count > 0

  return (
    <div className="space-y-3">
      {/* 상태 바 */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>
          {hasData
            ? `${data.scored_count}종목 스코어링 (v${data.version})`
            : "스코어 엔진 대기 중"}
        </span>
        <span>
          {data.updated_at
            ? `갱신: ${new Date(data.updated_at).toLocaleTimeString("ko-KR")}`
            : ""}
        </span>
      </div>

      {/* 랭킹 카드 2열 */}
      <div className="grid gap-4 md:grid-cols-2">
        <RankingCard
          title="매수 임박"
          items={data.buy_candidates}
          type="buy"
        />
        <RankingCard
          title="매도 임박"
          items={data.sell_candidates}
          type="sell"
        />
      </div>
    </div>
  )
}

function RankingCard({
  title,
  items,
  type = "buy",
  loading = false,
}: {
  title: string
  items: AlphaCandidate[]
  type?: "buy" | "sell"
  loading?: boolean
}) {
  const isBuy = type === "buy"
  const borderColor = isBuy ? "border-red-200" : "border-blue-200"
  const headerBg = isBuy ? "bg-red-50" : "bg-blue-50"
  const headerText = isBuy ? "text-red-700" : "text-blue-700"

  return (
    <div className={`overflow-hidden rounded-lg border ${borderColor}`}>
      <div className={`px-3 py-2 ${headerBg}`}>
        <h3 className={`text-xs font-semibold ${headerText}`}>{title} TOP 10</h3>
      </div>
      <div className="max-h-80 overflow-auto">
        <table className="w-full text-left text-xs">
          <thead className="sticky top-0 bg-white text-gray-500">
            <tr>
              <th className="w-6 px-2 py-1.5 text-center font-medium">#</th>
              <th className="px-2 py-1.5 font-medium">종목</th>
              <th className="px-2 py-1.5 text-right font-medium">스코어</th>
              <th className="px-2 py-1.5 text-right font-medium">RSI</th>
              <th className="px-2 py-1.5 text-right font-medium">거래비</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-gray-400">
                  로딩 중...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-gray-400">
                  데이터 준비 중
                </td>
              </tr>
            ) : (
              items.map((item, i) => {
                const score = item.score
                const scoreColor =
                  score >= 0.7
                    ? "text-red-600 font-semibold"
                    : score <= 0.3
                      ? "text-blue-600 font-semibold"
                      : "text-gray-700"

                return (
                  <tr key={item.symbol} className="hover:bg-gray-50">
                    <td className="px-2 py-1.5 text-center text-gray-400">
                      {i + 1}
                    </td>
                    <td className="px-2 py-1.5">
                      <span className="font-medium text-gray-900">
                        {item.name || item.symbol}
                      </span>
                      <span className="ml-1 text-gray-400">{item.symbol}</span>
                    </td>
                    <td className={`px-2 py-1.5 text-right tabular-nums ${scoreColor}`}>
                      {score.toFixed(3)}
                    </td>
                    <td className="px-2 py-1.5 text-right tabular-nums text-gray-600">
                      {Number(item.rsi).toFixed(0)}
                    </td>
                    <td className="px-2 py-1.5 text-right tabular-nums text-gray-600">
                      {Number(item.volume_ratio).toFixed(1)}
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
