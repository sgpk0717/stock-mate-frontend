const PAGE_SIZE_OPTIONS = [10, 20, 50, 100, 200]

interface PaginationProps {
  page: number
  totalPages: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
}

function Pagination({
  page,
  totalPages,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
}: PaginationProps) {
  if (total === 0) return null

  return (
    <div className="flex items-center justify-between border-t px-3 py-2">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 0}
        className="rounded px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-muted disabled:opacity-30"
      >
        이전
      </button>

      <div className="flex items-center gap-3">
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
          {page + 1} / {totalPages || 1} ({total.toLocaleString()}건)
        </span>
      </div>

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages - 1}
        className="rounded px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-muted disabled:opacity-30"
      >
        다음
      </button>
    </div>
  )
}

export default Pagination
