import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useCollectionStatus } from "@/hooks/queries"
import { formatNumber } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { CollectionStatusItem } from "@/types/data-explorer"
import LoadingSpinner from "./LoadingSpinner"

function getBorderColor(item: CollectionStatusItem): string {
  if (item.total_rows === 0) return "border-red-500"
  if (!item.last_collected_at) return "border-red-500"

  const last = new Date(item.last_collected_at)
  const now = new Date()
  const diffDays = (now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24)

  if (diffDays < 1) return "border-green-500"
  if (diffDays <= 7) return "border-yellow-500"
  return "border-red-500"
}

function formatDateRange(earliest: string | null, latest: string | null): string {
  if (!earliest || !latest) return "-"
  return `${earliest.slice(0, 10)} ~ ${latest.slice(0, 10)}`
}

function formatCollectedAt(collected: string | null): string {
  if (!collected) return "-"
  const d = new Date(collected)
  return d.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function CollectionOverview() {
  const { data: items, isPending, isError } = useCollectionStatus()

  if (isPending) {
    return <LoadingSpinner label="수집 현황 로딩 중" />
  }

  if (isError) {
    return <p className="text-sm text-destructive">수집 현황 조회 실패</p>
  }

  if (!items || items.length === 0) {
    return <p className="text-sm text-muted-foreground">수집 현황 데이터가 없습니다</p>
  }

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {items.map((item) => (
        <Card
          key={item.table_name}
          className={cn("border-l-4", getBorderColor(item))}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{item.display_name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <p className="text-2xl font-bold">
              {formatNumber(item.total_rows)}
              <span className="ml-1 text-xs font-normal text-muted-foreground">건</span>
            </p>
            <p className="text-xs text-muted-foreground">
              {formatDateRange(item.earliest_date, item.latest_date)}
            </p>
            <p className="text-xs text-muted-foreground">
              최종 수집: {formatCollectedAt(item.last_collected_at)}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default CollectionOverview
