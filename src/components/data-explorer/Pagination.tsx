import { useState, useRef } from "react"
import { cn } from "@/lib/utils"
import DateRangePicker from "./DateRangePicker"
import { ChevronsLeft, ChevronsRight, ChevronLeft, ChevronRight } from "lucide-react"

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
  const start = Math.max(1, current - 1)
  const end = Math.min(total - 2, current + 1)

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
  const [jumpInput, setJumpInput] = useState("")
  const [showJump, setShowJump] = useState(false)
  const jumpRef = useRef<HTMLInputElement>(null)

  if (total === 0 && !onStartDateChange) return null

  const pageNumbers = getPageNumbers(page, totalPages)
  const hasDateFilter = !!onStartDateChange

  const handleJump = () => {
    const target = parseInt(jumpInput, 10)
    if (!isNaN(target) && target >= 1 && target <= totalPages) {
      onPageChange(target - 1) // 0-indexed
      setJumpInput("")
      setShowJump(false)
    }
  }

  const handleDotsClick = () => {
    setShowJump(true)
    setTimeout(() => jumpRef.current?.focus(), 50)
  }

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

      {/* 중앙: 페이지네이션 */}
      {totalPages > 0 && (
        <div className="flex items-center gap-0.5">
          {/* First */}
          <button
            onClick={() => onPageChange(0)}
            disabled={page <= 0}
            className="rounded p-1 text-muted-foreground hover:bg-muted disabled:opacity-30"
            title="처음"
          >
            <ChevronsLeft className="h-3.5 w-3.5" />
          </button>
          {/* Prev */}
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 0}
            className="rounded p-1 text-muted-foreground hover:bg-muted disabled:opacity-30"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>

          {/* Page numbers */}
          {pageNumbers.map((p, i) =>
            p === "..." ? (
              <button
                key={`dots-${i}`}
                onClick={handleDotsClick}
                className="px-1 text-xs text-muted-foreground hover:text-primary cursor-pointer"
                title="페이지 이동"
              >
                ...
              </button>
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

          {/* Next */}
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages - 1}
            className="rounded p-1 text-muted-foreground hover:bg-muted disabled:opacity-30"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
          {/* Last */}
          <button
            onClick={() => onPageChange(totalPages - 1)}
            disabled={page >= totalPages - 1}
            className="rounded p-1 text-muted-foreground hover:bg-muted disabled:opacity-30"
            title="마지막"
          >
            <ChevronsRight className="h-3.5 w-3.5" />
          </button>

          {/* 현재 위치 + Jump to page */}
          <div className="ml-2 flex items-center gap-1.5">
            {showJump ? (
              <form
                onSubmit={(e) => { e.preventDefault(); handleJump() }}
                className="flex items-center gap-1"
              >
                <input
                  ref={jumpRef}
                  type="number"
                  min={1}
                  max={totalPages}
                  value={jumpInput}
                  onChange={(e) => setJumpInput(e.target.value)}
                  onBlur={() => { if (!jumpInput) setShowJump(false) }}
                  placeholder={`1-${totalPages}`}
                  className="w-16 rounded border bg-background px-1.5 py-0.5 text-xs text-center"
                />
                <button
                  type="submit"
                  className="rounded bg-primary px-2 py-0.5 text-xs text-primary-foreground hover:bg-primary/90"
                >
                  이동
                </button>
              </form>
            ) : (
              <button
                onClick={handleDotsClick}
                className="text-[11px] text-muted-foreground hover:text-primary"
              >
                {page + 1} / {totalPages.toLocaleString()}
              </button>
            )}
          </div>
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
