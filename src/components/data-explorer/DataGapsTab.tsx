import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useDataGaps } from "@/hooks/queries"
import LoadingSpinner from "./LoadingSpinner"
import { cn } from "@/lib/utils"

const DATA_TYPE_LABELS: Record<string, string> = {
  investor_trading: "투자자 수급",
  margin_short_daily: "공매도/신용",
  dart_financials: "DART 재무",
  program_trading: "프로그램 매매",
  news_articles: "뉴스",
  stock_candles: "캔들",
}

const MAX_COLLAPSED = 10

function DataGapsTab() {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const { data: gaps, isPending, isError } = useDataGaps()

  if (isPending) {
    return <LoadingSpinner label="데이터 갭 분석 중" />
  }

  if (isError) {
    return <p className="py-8 text-center text-sm text-destructive">데이터 조회 실패</p>
  }

  if (!gaps || gaps.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        누락된 데이터가 없습니다
      </p>
    )
  }

  function toggleExpand(dataType: string) {
    setExpanded((prev) => ({ ...prev, [dataType]: !prev[dataType] }))
  }

  return (
    <div className="space-y-4">
      {gaps.map((gap) => {
        const isExpanded = expanded[gap.data_type] ?? false
        const dates = gap.missing_dates
        const visibleDates = isExpanded ? dates : dates.slice(0, MAX_COLLAPSED)
        const hasMore = dates.length > MAX_COLLAPSED

        return (
          <Card key={gap.data_type}>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <CardTitle className="text-sm">
                  {DATA_TYPE_LABELS[gap.data_type] ?? gap.data_type}
                </CardTitle>
                <Badge
                  variant="outline"
                  className={cn(
                    gap.gap_count > 10
                      ? "border-red-300 text-red-700"
                      : gap.gap_count > 3
                        ? "border-yellow-300 text-yellow-700"
                        : "border-green-300 text-green-700",
                  )}
                >
                  {gap.gap_count}일 누락
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1.5">
                {visibleDates.map((date) => (
                  <span
                    key={date}
                    className="rounded-md border bg-muted px-2 py-0.5 font-mono text-xs"
                  >
                    {date}
                  </span>
                ))}
              </div>
              {hasMore && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 text-xs"
                  onClick={() => toggleExpand(gap.data_type)}
                >
                  {isExpanded
                    ? "접기"
                    : `+${dates.length - MAX_COLLAPSED}개 더보기`}
                </Button>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

export default DataGapsTab
