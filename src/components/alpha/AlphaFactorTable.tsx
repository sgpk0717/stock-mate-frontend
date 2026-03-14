import { useState } from "react"
import CausalBadge from "@/components/alpha/CausalBadge"
import AlphaFactorDetail from "@/components/alpha/AlphaFactorDetail"
import { Term } from "@/components/ui/term"
import type { AlphaFactor } from "@/types/alpha"

interface SortEntry {
  column: string
  order: "asc" | "desc"
}

interface ValidationProgress {
  status: "running" | "completed"
  total: number
  completed: number
  failed: number
  robust: number
  mirage: number
  estimated_remaining_ms: number | null
}

interface AlphaFactorTableProps {
  factors: AlphaFactor[]
  onDelete: (factorId: string) => void
  onDeleteBatch: (factorIds: string[]) => void
  onValidateBatch: (factorIds: string[]) => void
  onBacktest: (factorId: string) => void
  isValidating?: boolean
  validationProgress?: ValidationProgress | null
  isLoading?: boolean
  page?: number
  totalPages?: number
  onPageChange?: (page: number) => void
  pageSize?: number
  onPageSizeChange?: (size: number) => void
  sorts?: SortEntry[]
  onSortChange?: (column: string) => void
  onClearSorts?: () => void
  statusFilter?: string
  onStatusFilterChange?: (status: string) => void
  causalFilter?: string
  onCausalFilterChange?: (value: string) => void
  intervalFilter?: string
  onIntervalFilterChange?: (value: string) => void
}

const COL_COUNT = 11

function formatCreatedAt(iso: string): string {
  const d = new Date(iso)
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  const dd = String(d.getDate()).padStart(2, "0")
  const hh = String(d.getHours()).padStart(2, "0")
  const mi = String(d.getMinutes()).padStart(2, "0")
  return `${mm}-${dd} ${hh}:${mi}`
}

function SortHeader({
  label,
  column,
  sorts,
  onSortChange,
  align = "right",
  term = false,
  termKey,
}: {
  label: string
  column: string
  sorts?: SortEntry[]
  onSortChange?: (column: string) => void
  align?: "left" | "right" | "center"
  term?: boolean
  termKey?: string
}) {
  const sortIndex = sorts?.findIndex((s) => s.column === column) ?? -1
  const isActive = sortIndex !== -1
  const sortOrder = isActive ? sorts![sortIndex].order : undefined
  const icon = isActive ? (sortOrder === "asc" ? "\u25B2" : "\u25BC") : "\u25BD"

  const alignClass =
    align === "right"
      ? "justify-end text-right"
      : align === "center"
        ? "justify-center text-center"
        : "justify-start text-left"

  return (
    <th className={`px-3 py-2 font-medium ${align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left"}`}>
      <button
        onClick={() => onSortChange?.(column)}
        className={`inline-flex items-center gap-0.5 hover:text-foreground ${isActive ? "text-foreground" : "text-muted-foreground"} ${alignClass}`}
      >
        {term ? <Term k={termKey}>{label}</Term> : label}
        {isActive && (sorts?.length ?? 0) > 1 && (
          <span className="text-[9px] font-semibold text-primary">{sortIndex + 1}</span>
        )}
        <span className="text-[10px]">{icon}</span>
      </button>
    </th>
  )
}

function AlphaFactorTable({
  factors,
  onDelete,
  onDeleteBatch,
  onValidateBatch,
  onBacktest,
  isValidating,
  validationProgress,
  isLoading,
  page,
  totalPages,
  onPageChange,
  sorts,
  onSortChange,
  onClearSorts,
  statusFilter,
  onStatusFilterChange,
  causalFilter,
  onCausalFilterChange,
  intervalFilter,
  onIntervalFilterChange,
  pageSize,
  onPageSizeChange,
}: AlphaFactorTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [lastClickedId, setLastClickedId] = useState<string | null>(null)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center rounded-lg border p-8">
        <svg className="h-5 w-5 animate-spin text-muted-foreground" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span className="ml-2 text-sm text-muted-foreground">팩터 불러오는 중...</span>
      </div>
    )
  }

  const hasFilters = !!(onStatusFilterChange || onCausalFilterChange || onIntervalFilterChange)
  const allSelected = factors.length > 0 && factors.every((f) => selected.has(f.id))

  const handleToggleAll = () => {
    if (allSelected) {
      setSelected(new Set())
    } else {
      setSelected(new Set(factors.map((f) => f.id)))
    }
  }

  const handleToggleOne = (id: string, shiftKey: boolean) => {
    if (shiftKey && lastClickedId && lastClickedId !== id) {
      const ids = factors.map((f) => f.id)
      const from = ids.indexOf(lastClickedId)
      const to = ids.indexOf(id)
      if (from !== -1 && to !== -1) {
        const start = Math.min(from, to)
        const end = Math.max(from, to)
        setSelected((prev) => {
          const next = new Set(prev)
          for (let i = start; i <= end; i++) next.add(ids[i])
          return next
        })
        setLastClickedId(id)
        return
      }
    }
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
    setLastClickedId(id)
  }

  const handleRowClick = (factor: AlphaFactor) => {
    setExpandedId((prev) => (prev === factor.id ? null : factor.id))
  }

  const handleDeleteSelected = () => {
    onDeleteBatch(Array.from(selected))
    setSelected(new Set())
  }

  const handleValidateSelected = () => {
    onValidateBatch(Array.from(selected))
  }

  return (
    <div className="overflow-auto rounded-lg border">
      {/* 선택 액션 바 */}
      {selected.size > 0 && (
        <div className="border-b bg-muted/60 px-3 py-2">
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium">{selected.size}개 선택</span>
            <button
              onClick={handleValidateSelected}
              disabled={isValidating}
              className="inline-flex items-center gap-1.5 rounded bg-blue-500 px-2.5 py-1 text-xs font-medium text-white hover:bg-blue-600 disabled:opacity-60"
            >
              {isValidating && (
                <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {isValidating ? "검증 중..." : "인과 검증"}
            </button>
            <button
              onClick={handleDeleteSelected}
              className="rounded bg-red-500 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-600"
            >
              선택 삭제
            </button>
            <button
              onClick={() => setSelected(new Set())}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              선택 해제
            </button>
          </div>
          {/* 검증 진행률 바 */}
          {isValidating && validationProgress && validationProgress.status === "running" && (
            <div className="mt-2">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>
                  {validationProgress.completed + validationProgress.failed}/{validationProgress.total}
                  {" "}(robust {validationProgress.robust}, mirage {validationProgress.mirage}, fail {validationProgress.failed})
                </span>
                <span>
                  {validationProgress.estimated_remaining_ms != null && validationProgress.estimated_remaining_ms > 0
                    ? `약 ${Math.ceil(validationProgress.estimated_remaining_ms / 1000)}초 남음`
                    : "계산 중..."}
                </span>
              </div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full rounded-full bg-blue-500 transition-all duration-300"
                  style={{
                    width: `${validationProgress.total > 0 ? ((validationProgress.completed + validationProgress.failed) / validationProgress.total) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="w-8 px-2 py-2 text-center">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={handleToggleAll}
                className="h-3.5 w-3.5 cursor-pointer rounded border-gray-300"
              />
            </th>
            <th className="px-3 py-2 text-left font-medium">이름</th>
            <th className="px-3 py-2 text-left font-medium">수식</th>
            <SortHeader label="IC" column="ic_mean" sorts={sorts} onSortChange={onSortChange} term />
            <SortHeader label="ICIR" column="icir" sorts={sorts} onSortChange={onSortChange} term />
            <SortHeader label="Net Sharpe" column="sharpe" sorts={sorts} onSortChange={onSortChange} term termKey="Net Sharpe" />
            <th className="px-3 py-2 text-center font-medium">상태</th>
            <th className="px-3 py-2 text-center font-medium"><Term>인과</Term></th>
            <SortHeader label="세대" column="generation" sorts={sorts} onSortChange={onSortChange} align="center" term />
            <SortHeader label="생성일" column="created_at" sorts={sorts} onSortChange={onSortChange} align="center" />
            <th className="px-3 py-2 text-center font-medium">
              {(sorts?.length ?? 0) > 0 && (
                <button
                  onClick={onClearSorts}
                  className="text-[10px] text-muted-foreground hover:text-foreground"
                  title="정렬 초기화"
                >
                  ✕ 정렬
                </button>
              )}
            </th>
          </tr>
          {hasFilters && (
            <tr className="border-b bg-muted/30">
              <td className="px-2 py-1" />
              <td className="px-3 py-1">
                {onIntervalFilterChange && (
                  <select
                    value={intervalFilter ?? ""}
                    onChange={(e) => onIntervalFilterChange(e.target.value)}
                    className="w-full rounded border bg-background px-1.5 py-0.5 text-xs"
                  >
                    <option value="">전체</option>
                    <option value="1d">1d</option>
                    <option value="1h">1h</option>
                    <option value="30m">30m</option>
                    <option value="15m">15m</option>
                    <option value="5m">5m</option>
                    <option value="3m">3m</option>
                    <option value="1m">1m</option>
                  </select>
                )}
              </td>
              <td className="px-3 py-1" />
              <td className="px-3 py-1" />
              <td className="px-3 py-1" />
              <td className="px-3 py-1" />
              <td className="px-3 py-1">
                {onStatusFilterChange && (
                  <select
                    value={statusFilter ?? ""}
                    onChange={(e) => onStatusFilterChange(e.target.value)}
                    className="w-full rounded border bg-background px-1.5 py-0.5 text-xs"
                  >
                    <option value="">전체</option>
                    <option value="discovered">discovered</option>
                    <option value="validated">validated</option>
                    <option value="mirage">mirage</option>
                    <option value="deployed">deployed</option>
                  </select>
                )}
              </td>
              <td className="px-3 py-1">
                {onCausalFilterChange && (
                  <select
                    value={causalFilter ?? ""}
                    onChange={(e) => onCausalFilterChange(e.target.value)}
                    className="w-full rounded border bg-background px-1.5 py-0.5 text-xs"
                  >
                    <option value="">전체</option>
                    <option value="true">통과</option>
                    <option value="false">미통과</option>
                  </select>
                )}
              </td>
              <td className="px-3 py-1" />
              <td className="px-3 py-1" />
              <td className="px-3 py-1" />
            </tr>
          )}
        </thead>
        <tbody>
          {factors.length === 0 ? (
            <tr>
              <td colSpan={COL_COUNT} className="px-3 py-8 text-center text-sm text-muted-foreground">
                발견된 팩터가 없습니다.
              </td>
            </tr>
          ) : (
            factors.map((f) => {
              const isExpanded = expandedId === f.id
              return (
                <FactorRow
                  key={f.id}
                  factor={f}
                  isExpanded={isExpanded}
                  isSelected={selected.has(f.id)}
                  onToggleSelect={(shiftKey: boolean) => handleToggleOne(f.id, shiftKey)}
                  onToggle={() => handleRowClick(f)}
                  onDelete={onDelete}
                  onBacktest={onBacktest}
                  onClose={() => setExpandedId(null)}
                />
              )
            })
          )}
        </tbody>
      </table>

      {/* 페이지네이션 */}
      {factors.length > 0 && onPageChange && page != null && (
        <div className="flex items-center justify-between border-t px-3 py-2">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 0}
            className="rounded px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-muted disabled:opacity-30"
          >
            이전
          </button>
          <div className="flex items-center gap-3">
            {onPageSizeChange && (
              <select
                value={pageSize ?? 100}
                onChange={(e) => onPageSizeChange(Number(e.target.value))}
                className="rounded border bg-background px-1.5 py-0.5 text-xs"
              >
                {[10, 20, 50, 100, 200, 500, 1000].map((n) => (
                  <option key={n} value={n}>{n}개</option>
                ))}
              </select>
            )}
            <span className="text-xs text-muted-foreground">
              {page + 1} / {totalPages ?? 1}
            </span>
          </div>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={!totalPages || page >= totalPages - 1}
            className="rounded px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-muted disabled:opacity-30"
          >
            다음
          </button>
        </div>
      )}
    </div>
  )
}

function FactorRow({
  factor,
  isExpanded,
  isSelected,
  onToggleSelect,
  onToggle,
  onDelete,
  onBacktest,
  onClose,
}: {
  factor: AlphaFactor
  isExpanded: boolean
  isSelected: boolean
  onToggleSelect: (shiftKey: boolean) => void
  onToggle: () => void
  onDelete: (factorId: string) => void
  onBacktest: (factorId: string) => void
  onClose: () => void
}) {
  return (
    <>
      <tr
        className={`cursor-pointer border-b transition-colors hover:bg-muted/30 ${isExpanded ? "bg-muted/20" : ""} ${isSelected ? "bg-blue-50" : ""}`}
        onClick={onToggle}
      >
        <td className="w-8 px-2 py-2 text-center">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => {}}
            onClick={(e) => {
              e.stopPropagation()
              onToggleSelect(e.shiftKey)
            }}
            className="h-3.5 w-3.5 cursor-pointer rounded border-gray-300"
          />
        </td>
        <td className="px-3 py-2 font-medium">
          <span>{factor.name}</span>
          {factor.interval && (
            <span className="ml-1.5 inline-flex rounded border px-1 py-0 text-[10px] font-normal text-muted-foreground">
              {factor.interval}
            </span>
          )}
        </td>
        <td className="max-w-[200px] truncate px-3 py-2 font-mono text-xs">
          {factor.expression_str}
        </td>
        <td className="px-3 py-2 text-right">
          {factor.ic_mean != null ? factor.ic_mean.toFixed(4) : "\u2014"}
        </td>
        <td className="px-3 py-2 text-right">
          {factor.icir != null ? factor.icir.toFixed(2) : "\u2014"}
        </td>
        <td className="px-3 py-2 text-right">
          {factor.sharpe != null ? factor.sharpe.toFixed(2) : "\u2014"}
        </td>
        <td className="px-3 py-2 text-center">
          <StatusBadge status={factor.status} />
        </td>
        <td className="px-3 py-2 text-center">
          <CausalBadge
            causalRobust={factor.causal_robust}
            effectSize={factor.causal_effect_size}
            pValue={factor.causal_p_value}
          />
        </td>
        <td className="px-3 py-2 text-center text-xs">{factor.generation}</td>
        <td className="px-3 py-2 text-center text-xs text-muted-foreground" title={factor.created_at}>
          {formatCreatedAt(factor.created_at)}
        </td>
        <td className="px-3 py-2 text-center">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete(factor.id)
            }}
            className="text-xs text-red-500 hover:text-red-700"
          >
            삭제
          </button>
        </td>
      </tr>
      {isExpanded && (
        <tr>
          <td colSpan={COL_COUNT} className="border-b bg-muted/10 p-0">
            <div className="p-3">
              <AlphaFactorDetail
                factor={factor}
                onBacktest={onBacktest}
                onClose={onClose}
              />
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    discovered: "bg-blue-100 text-blue-700",
    validated: "bg-green-100 text-green-700",
    mirage: "bg-red-100 text-red-700",
    deployed: "bg-purple-100 text-purple-700",
  }

  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${styles[status] || "bg-gray-100 text-gray-700"}`}
    >
      {status}
    </span>
  )
}

export default AlphaFactorTable
