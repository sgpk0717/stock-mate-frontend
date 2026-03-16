import { cn } from "@/lib/utils"
import DateRangePicker from "./DateRangePicker"

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100, 200]

interface PaginationProps {
  page: number
  totalPages: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  startDate?: string
  endDate?: string
  onStartDateChange?: (v: string) => void
  onEndDateChange?: (v: string) => void
}

function getPageNumbers(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i)

  const pages: (number | "...")[] = [0]
  const start = Math.max(1, current - 2)
  const end = Math.min(total - 2, current + 2)

  if (start > 1) pages.push("...")
  for (let i = start; i <= end; i++) pages.push(i)
  if (end < total - 2) pages.push("...")
  pages.push(total - 1)

  return pages
}

function Pagination({
  page, totalPages, pageSize, total,
  onPageChange, onPageSizeChange,
  startDate, endDate, onStartDateChange, onEndDateChange,
}: PaginationProps) {
  if (total === 0 && !onStartDateChange) return null

  const pageNumbers = getPageNumbers(page, totalPages)
  const hasDateFilter = !!onStartDateChange

  return (
    <div className="flex items-center justify-between px-3 py-2">
      {/* 좌: 페이지 크기 + 총 건수 */}
      <div className="flex items-center gap-2">
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="rounded border bg-background px-1.5 py-0.5 text-xs"
        >
          {PAGE_SIZE_OPTIONS.map((n) => (
            <option key={n} value={n}>{n}개</option>
          ))}
        </select>
        <span className="text-xs text-muted-foreground">
          ({total.toLocaleString()}건)
        </span>
      </div>

      {/* 중앙: 페이지 번호 */}
      {totalPages > 0 && (
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 0}
            className="rounded px-1.5 py-0.5 text-xs font-medium text-muted-foreground hover:bg-muted disabled:opacity-30"
          >
            &lt;
          </button>
          {pageNumbers.map((p, i) =>
            p === "..." ? (
              <span key={`dots-${i}`} className="px-1 text-xs text-muted-foreground">...</span>
            ) : (
              <button
                key={p}
                onClick={() => onPageChange(p)}
                className={cn(
                  "min-w-[28px] rounded px-1.5 py-0.5 text-xs font-medium",
                  p === page
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted",
                )}
              >
                {p + 1}
              </button>
            ),
          )}
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages - 1}
            className="rounded px-1.5 py-0.5 text-xs font-medium text-muted-foreground hover:bg-muted disabled:opacity-30"
          >
            &gt;
          </button>
        </div>
      )}

      {/* 우: 날짜 범위 피커 */}
      {hasDateFilter ? (
        <DateRangePicker
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={onStartDateChange}
          onEndDateChange={onEndDateChange}
        />
      ) : (
        <div />
      )}
    </div>
  )
}

export default Pagination
