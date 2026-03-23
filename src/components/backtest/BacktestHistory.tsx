import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Term } from "@/components/ui/term"
import { useBacktestRuns, useDeleteBacktestRun } from "@/hooks/queries"
import { cn } from "@/lib/utils"
import type { BacktestRunSummary } from "@/types"

interface SortEntry {
  column: string
  order: "asc" | "desc"
}

interface BacktestHistoryProps {
  selectedRunId: string | null
  onSelectRun: (runId: string) => void
}

const STATUS_MAP: Record<
  string,
  { label: string; variant: "default" | "secondary" | "outline" | "destructive" }
> = {
  PENDING: { label: "대기", variant: "outline" },
  RUNNING: { label: "실행중", variant: "secondary" },
  COMPLETED: { label: "완료", variant: "default" },
  FAILED: { label: "실패", variant: "destructive" },
}

function SortHeader({
  label,
  column,
  sort,
  onSortChange,
}: {
  label: string
  column: string
  sort: SortEntry | null
  onSortChange: (column: string) => void
}) {
  const isActive = sort?.column === column
  const icon = isActive ? (sort!.order === "asc" ? "\u25B2" : "\u25BC") : "\u25BD"
  return (
    <th className="px-2 py-2 text-right font-medium">
      <button
        onClick={() => onSortChange(column)}
        className={`inline-flex items-center gap-0.5 hover:text-foreground ${isActive ? "text-foreground" : "text-muted-foreground"}`}
      >
        {label}
        <span className="text-[10px]">{icon}</span>
      </button>
    </th>
  )
}

function PaginationBar({
  page,
  totalPages,
  onPageChange,
  pageSize,
  onPageSizeChange,
}: {
  page: number
  totalPages: number
  onPageChange: (p: number) => void
  pageSize: number
  onPageSizeChange: (s: number) => void
}) {
  return (
    <div className="flex items-center justify-between px-3 py-1.5">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 0}
        className="rounded px-2 py-0.5 text-xs font-medium text-muted-foreground hover:bg-muted disabled:opacity-30"
      >
        이전
      </button>
      <div className="flex items-center gap-2">
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="rounded border bg-background px-1.5 py-0.5 text-xs"
        >
          {[10, 20, 50, 100].map((n) => (
            <option key={n} value={n}>{n}개</option>
          ))}
        </select>
        <span className="text-xs text-muted-foreground">
          {page + 1} / {totalPages || 1}
        </span>
      </div>
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={!totalPages || page >= totalPages - 1}
        className="rounded px-2 py-0.5 text-xs font-medium text-muted-foreground hover:bg-muted disabled:opacity-30"
      >
        다음
      </button>
    </div>
  )
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  const dd = String(d.getDate()).padStart(2, "0")
  const hh = String(d.getHours()).padStart(2, "0")
  const mi = String(d.getMinutes()).padStart(2, "0")
  return `${mm}-${dd} ${hh}:${mi}`
}

function BacktestHistory({ selectedRunId, onSelectRun }: BacktestHistoryProps) {
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(20)
  const [sort, setSort] = useState<SortEntry | null>(null)
  const [statusFilter, setStatusFilter] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")

  const deleteMutation = useDeleteBacktestRun()

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
      setPage(0)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const { data, isLoading } = useBacktestRuns({
    page,
    limit: pageSize,
    sort_by: sort?.column,
    order: sort?.order,
    status: statusFilter || undefined,
    search: debouncedSearch || undefined,
  })

  const runs = data?.items ?? []
  const total = data?.total ?? 0
  const totalPages = Math.ceil(total / pageSize)

  const handleSortChange = (column: string) => {
    setSort((prev) => {
      if (!prev || prev.column !== column) return { column, order: "desc" }
      if (prev.order === "desc") return { column, order: "asc" }
      return null
    })
    setPage(0)
  }

  const handlePageSizeChange = (size: number) => {
    setPageSize(size)
    setPage(0)
  }

  return (
    <div className="overflow-auto rounded-lg border">
      {/* 상단: 검색 + 페이지네이션 */}
      <div className="flex items-center gap-2 border-b px-3 py-2">
        <div className="relative flex-1">
          <svg
            className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="전략명 검색..."
            className="w-full rounded border bg-background py-1 pl-8 pr-2 text-xs placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/30"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>
          )}
        </div>
        <span className="shrink-0 text-xs text-muted-foreground">{total}건</span>
      </div>

      {/* 상단 페이지네이션 */}
      {total > 0 && (
        <div className="border-b">
          <PaginationBar
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            pageSize={pageSize}
            onPageSizeChange={handlePageSizeChange}
          />
        </div>
      )}

      {/* 테이블 */}
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="px-2 py-2 text-left font-medium">전략</th>
            <th className="px-2 py-2 text-center font-medium">
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(0) }}
                className="rounded border bg-background px-1 py-0.5 text-xs font-medium"
              >
                <option value="">상태</option>
                <option value="COMPLETED">완료</option>
                <option value="RUNNING">실행중</option>
                <option value="PENDING">대기</option>
                <option value="FAILED">실패</option>
              </select>
            </th>
            <SortHeader label="수익률" column="total_return" sort={sort} onSortChange={handleSortChange} />
            <SortHeader label="Sharpe" column="sharpe_ratio" sort={sort} onSortChange={handleSortChange} />
            <SortHeader label="MDD" column="mdd" sort={sort} onSortChange={handleSortChange} />
            <SortHeader label="승률" column="win_rate" sort={sort} onSortChange={handleSortChange} />
            <SortHeader label="거래" column="total_trades" sort={sort} onSortChange={handleSortChange} />
            <SortHeader label="생성일" column="created_at" sort={sort} onSortChange={handleSortChange} />
            <th className="w-8 px-2 py-2" />
          </tr>
        </thead>
        <tbody>
          {isLoading && (
            <tr>
              <td colSpan={9} className="px-3 py-8 text-center text-muted-foreground">
                <svg className="mx-auto h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </td>
            </tr>
          )}
          {!isLoading && runs.length === 0 && (
            <tr>
              <td colSpan={9} className="px-3 py-8 text-center text-muted-foreground">
                실행 기록이 없습니다.
              </td>
            </tr>
          )}
          {runs.map((run) => {
            const status = STATUS_MAP[run.status] ?? STATUS_MAP.PENDING
            const isSelected = run.id === selectedRunId
            return (
              <tr
                key={run.id}
                className={cn(
                  "cursor-pointer border-b transition-colors hover:bg-muted/30",
                  isSelected && "bg-primary/5",
                )}
                onClick={() => onSelectRun(run.id)}
              >
                <td className="max-w-[160px] truncate px-2 py-2 font-medium">
                  {run.strategy_name}
                </td>
                <td className="px-2 py-2 text-center">
                  <Badge variant={status.variant} className="text-[10px]">
                    {status.label}
                    {run.status === "RUNNING" && ` ${run.progress}%`}
                  </Badge>
                </td>
                <td className="px-2 py-2 text-right">
                  {run.total_return != null ? (
                    <span className={cn("font-medium", run.total_return >= 0 ? "text-red-500" : "text-blue-500")}>
                      {run.total_return >= 0 ? "+" : ""}{run.total_return.toFixed(2)}%
                    </span>
                  ) : "\u2014"}
                </td>
                <td className="px-2 py-2 text-right">
                  {run.sharpe_ratio != null ? run.sharpe_ratio.toFixed(2) : "\u2014"}
                </td>
                <td className="px-2 py-2 text-right">
                  {run.mdd != null ? `${run.mdd.toFixed(1)}%` : "\u2014"}
                </td>
                <td className="px-2 py-2 text-right">
                  {run.win_rate != null ? `${run.win_rate.toFixed(1)}%` : "\u2014"}
                </td>
                <td className="px-2 py-2 text-right">
                  {run.total_trades != null ? `${run.total_trades}` : "\u2014"}
                </td>
                <td className="px-2 py-2 text-center text-muted-foreground" title={run.created_at}>
                  {formatDate(run.created_at)}
                </td>
                <td className="px-2 py-2 text-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteMutation.mutate(run.id)
                    }}
                    className="text-[10px] text-muted-foreground hover:text-destructive"
                  >
                    삭제
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {/* 하단 페이지네이션 */}
      {total > 0 && (
        <div className="border-t">
          <PaginationBar
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            pageSize={pageSize}
            onPageSizeChange={handlePageSizeChange}
          />
        </div>
      )}
    </div>
  )
}

export default BacktestHistory
