import { useEffect, useRef, useState } from "react"
import {
  ChevronsUpDown,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  X,
  RotateCcw,
  Trash2,
  ShieldCheck,
  Loader2,
} from "lucide-react"
import CausalBadge from "@/components/alpha/CausalBadge"
import AlphaFactorDetail from "@/components/alpha/AlphaFactorDetail"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Term } from "@/components/ui/term"
import { cn } from "@/lib/utils"
import type { AlphaFactor, CausalValidationProgress } from "@/types/alpha"

/* ── Types ─────────────────────────────────────────────────── */

interface SortEntry {
  column: string
  order: "asc" | "desc"
}

interface AlphaFactorTableProps {
  factors: AlphaFactor[]
  onDelete: (factorId: string) => void
  onDeleteBatch: (factorIds: string[]) => void
  onValidateBatch: (factorIds: string[]) => void
  onBacktest: (factorId: string) => void
  isValidating?: boolean
  validationProgress?: CausalValidationProgress | null
  onCancelValidation?: () => void
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
  searchQuery?: string
  onSearchChange?: (query: string) => void
}

/* ── Constants ─────────────────────────────────────────────── */

const COL_COUNT = 11

/* ── Helpers ───────────────────────────────────────────────── */

function formatCreatedAt(iso: string): string {
  const d = new Date(iso)
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  const dd = String(d.getDate()).padStart(2, "0")
  const hh = String(d.getHours()).padStart(2, "0")
  const mi = String(d.getMinutes()).padStart(2, "0")
  return `${mm}-${dd} ${hh}:${mi}`
}

/* ── SortHeader ────────────────────────────────────────────── */

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

  const alignClass =
    align === "right"
      ? "text-right"
      : align === "center"
        ? "text-center"
        : "text-left"

  return (
    <th className={cn("whitespace-nowrap px-3 py-2 text-xs font-medium text-muted-foreground", alignClass)}>
      <button
        onClick={() => onSortChange?.(column)}
        className={cn(
          "inline-flex h-8 -ml-3 items-center gap-1 rounded-md px-3 text-xs font-medium hover:bg-muted/80 transition-colors",
          align === "right" && "ml-auto",
          align === "center" && "mx-auto",
          isActive && "text-foreground",
        )}
      >
        {term ? <Term k={termKey}>{label}</Term> : label}
        {isActive && (sorts?.length ?? 0) > 1 && (
          <span className="text-[9px] font-semibold text-primary">{sortIndex + 1}</span>
        )}
        {isActive ? (
          sortOrder === "asc" ? (
            <ChevronUp className="size-3.5 text-foreground" />
          ) : (
            <ChevronDown className="size-3.5 text-foreground" />
          )
        ) : (
          <ChevronsUpDown className="size-3.5 text-muted-foreground/60" />
        )}
      </button>
    </th>
  )
}

/* ── StatusBadge ───────────────────────────────────────────── */

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    discovered: "bg-blue-100 text-blue-700",
    validated: "bg-green-100 text-green-700",
    mirage: "bg-red-100 text-red-700",
    deployed: "bg-purple-100 text-purple-700",
  }

  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${styles[status] || "bg-gray-100 text-gray-700"}`}>
      {status}
    </span>
  )
}

/* ── FactorRow ─────────────────────────────────────────────── */

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
        className={cn(
          "cursor-pointer border-b transition-colors hover:bg-muted/50",
          isExpanded && "bg-muted/30",
          isSelected && "bg-muted/50",
        )}
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
        <td className="whitespace-nowrap px-3 py-2">
          <span className="text-sm font-medium">{factor.name}</span>
          {factor.interval && (
            <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5 py-0">
              {factor.interval}
            </Badge>
          )}
        </td>
        <td className="max-w-[120px] truncate px-3 py-2 font-mono text-xs text-muted-foreground">
          {factor.expression_str}
        </td>
        <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums text-sm">
          {factor.ic_mean != null ? factor.ic_mean.toFixed(4) : "\u2014"}
        </td>
        <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums text-sm">
          {factor.icir != null ? factor.icir.toFixed(2) : "\u2014"}
        </td>
        <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums text-sm">
          {factor.sharpe != null ? factor.sharpe.toFixed(2) : "\u2014"}
        </td>
        <td className="whitespace-nowrap px-3 py-2 text-center">
          <StatusBadge status={factor.status} />
        </td>
        <td className="whitespace-nowrap px-3 py-2 text-center">
          <CausalBadge
            causalRobust={factor.causal_robust}
            effectSize={factor.causal_effect_size}
            pValue={factor.causal_p_value}
          />
        </td>
        <td className="whitespace-nowrap px-3 py-2 text-center text-xs tabular-nums">{factor.generation}</td>
        <td className="whitespace-nowrap px-3 py-2 text-center text-xs text-muted-foreground tabular-nums" title={factor.created_at}>
          {formatCreatedAt(factor.created_at)}
        </td>
        <td className="w-10 whitespace-nowrap px-2 py-2 text-center">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={(e) => {
              e.stopPropagation()
              onDelete(factor.id)
            }}
            className="text-muted-foreground hover:text-destructive"
          >
            <X className="size-3.5" />
          </Button>
        </td>
      </tr>
      {isExpanded && (
        <tr>
          <td colSpan={COL_COUNT} className="border-b bg-muted/30 p-0">
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

/* ── ValidationPanel ───────────────────────────────────────── */

function ValidationPanel({
  validationProgress,
  onCancelValidation,
  logEndRef,
}: {
  validationProgress: CausalValidationProgress
  onCancelValidation?: () => void
  logEndRef: React.RefObject<HTMLDivElement | null>
}) {
  if (validationProgress.status !== "running") return null

  const progressPct =
    validationProgress.total > 0
      ? ((validationProgress.completed + validationProgress.failed) / validationProgress.total) * 100
      : 0

  return (
    <div className="border-t px-4 py-3">
      {/* Progress bar */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {validationProgress.completed + validationProgress.failed}/{validationProgress.total}
          {" "}(robust {validationProgress.robust}, mirage {validationProgress.mirage}, fail {validationProgress.failed})
        </span>
        <div className="flex items-center gap-3">
          <span>
            {validationProgress.estimated_remaining_ms != null && validationProgress.estimated_remaining_ms > 0
              ? `~${Math.ceil(validationProgress.estimated_remaining_ms / 1000)}s`
              : "..."}
          </span>
          {onCancelValidation && (
            <Button
              variant="outline"
              size="xs"
              onClick={() => {
                if (window.confirm("진행 중인 팩터 검증 완료 후 중단합니다."))
                  onCancelValidation()
              }}
              className="text-destructive border-destructive/30 hover:bg-destructive/10"
            >
              중단
            </Button>
          )}
        </div>
      </div>
      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all duration-300"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Logs */}
      {validationProgress.logs && validationProgress.logs.length > 0 && (
        <div className="mt-2 max-h-48 overflow-y-auto rounded-md border bg-gray-950 p-2 font-mono text-[10px] leading-relaxed">
          {validationProgress.logs.map((log, i) => (
            <div
              key={i}
              className={cn(
                "py-0.5",
                log.step === "result" && log.message.includes("VALIDATED") && "text-emerald-400",
                log.step === "result" && (log.message.includes("MIRAGE") || log.message.includes("ERROR")) && "text-red-400",
                log.step === "cancelled" && "text-yellow-400",
                log.step === "batch_start" && "text-blue-400 font-bold",
                !["result", "cancelled", "batch_start"].includes(log.step) && "text-gray-400",
              )}
            >
              <span className="text-gray-600">
                {new Date(log.ts * 1000).toLocaleTimeString()}
              </span>
              {" "}{log.message}
            </div>
          ))}
          <div ref={logEndRef} />
        </div>
      )}
    </div>
  )
}

/* ── Main Component ────────────────────────────────────────── */

function AlphaFactorTable({
  factors,
  onDelete,
  onDeleteBatch,
  onValidateBatch,
  onBacktest,
  isValidating,
  validationProgress,
  onCancelValidation,
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
  searchQuery,
  onSearchChange,
}: AlphaFactorTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [lastClickedId, setLastClickedId] = useState<string | null>(null)
  const logEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [validationProgress?.logs?.length])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center rounded-md border p-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">팩터 불러오는 중...</span>
      </div>
    )
  }

  const hasActiveFilters =
    !!(statusFilter) || !!(causalFilter) || !!(intervalFilter)
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

  const handleResetFilters = () => {
    onStatusFilterChange?.("")
    onCausalFilterChange?.("")
    onIntervalFilterChange?.("")
    onSearchChange?.("")
  }

  return (
    <div className="flex flex-col gap-4">
      {/* ── Toolbar ──────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        {/* Left: Search + Filters */}
        <div className="flex flex-1 items-center gap-2">
          {onSearchChange && (
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery ?? ""}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="팩터 검색..."
                className="h-8 w-[200px] pl-8 text-xs lg:w-[300px]"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3" />
                </button>
              )}
            </div>
          )}

          {onIntervalFilterChange && (
            <Select value={intervalFilter || "_all"} onValueChange={(v) => onIntervalFilterChange(v === "_all" ? "" : v)}>
              <SelectTrigger size="sm" className="h-8 w-[90px] text-xs">
                <SelectValue placeholder="Interval" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">전체</SelectItem>
                <SelectItem value="1d">1d</SelectItem>
                <SelectItem value="1h">1h</SelectItem>
                <SelectItem value="30m">30m</SelectItem>
                <SelectItem value="15m">15m</SelectItem>
                <SelectItem value="5m">5m</SelectItem>
                <SelectItem value="3m">3m</SelectItem>
                <SelectItem value="1m">1m</SelectItem>
              </SelectContent>
            </Select>
          )}

          {onStatusFilterChange && (
            <Select value={statusFilter || "_all"} onValueChange={(v) => onStatusFilterChange(v === "_all" ? "" : v)}>
              <SelectTrigger size="sm" className="h-8 w-[110px] text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">전체</SelectItem>
                <SelectItem value="discovered">discovered</SelectItem>
                <SelectItem value="validated">validated</SelectItem>
                <SelectItem value="mirage">mirage</SelectItem>
                <SelectItem value="deployed">deployed</SelectItem>
              </SelectContent>
            </Select>
          )}

          {onCausalFilterChange && (
            <Select value={causalFilter || "_all"} onValueChange={(v) => onCausalFilterChange(v === "_all" ? "" : v)}>
              <SelectTrigger size="sm" className="h-8 w-[90px] text-xs">
                <SelectValue placeholder="인과" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">전체</SelectItem>
                <SelectItem value="true">통과</SelectItem>
                <SelectItem value="false">미통과</SelectItem>
              </SelectContent>
            </Select>
          )}

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" className="h-8 px-2" onClick={handleResetFilters}>
              <RotateCcw className="size-3.5" />
              리셋
            </Button>
          )}
        </div>

        {/* Right: Selected actions */}
        <div className="flex items-center gap-2">
          {selected.size > 0 && (
            <>
              <span className="text-sm text-muted-foreground">{selected.size}개 선택</span>
              <Button
                size="sm"
                className="h-8"
                onClick={handleValidateSelected}
                disabled={isValidating}
              >
                {isValidating ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <ShieldCheck className="size-3.5" />
                )}
                {isValidating ? "검증 중..." : "인과 검증"}
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="h-8"
                onClick={handleDeleteSelected}
              >
                <Trash2 className="size-3.5" />
                삭제
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-8"
                onClick={() => setSelected(new Set())}
              >
                해제
              </Button>
            </>
          )}

          {(sorts?.length ?? 0) > 0 && (
            <Button variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground" onClick={onClearSorts} title="정렬 초기화">
              <X className="size-3.5" />
              정렬
            </Button>
          )}
        </div>
      </div>

      {/* ── Validation Progress ──────────────────────────── */}
      {isValidating && validationProgress && (
        <ValidationPanel
          validationProgress={validationProgress}
          onCancelValidation={onCancelValidation}
          logEndRef={logEndRef}
        />
      )}

      {/* ── Table ────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-md border">
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
              <th className="whitespace-nowrap px-3 py-2 text-left text-xs font-medium text-muted-foreground">이름</th>
              <th className="whitespace-nowrap px-3 py-2 text-left text-xs font-medium text-muted-foreground">수식</th>
              <SortHeader label="IC" column="ic_mean" sorts={sorts} onSortChange={onSortChange} term />
              <SortHeader label="ICIR" column="icir" sorts={sorts} onSortChange={onSortChange} term />
              <SortHeader label="Sharpe" column="sharpe" sorts={sorts} onSortChange={onSortChange} term termKey="Net Sharpe" />
              <th className="whitespace-nowrap px-3 py-2 text-center text-xs font-medium text-muted-foreground">상태</th>
              <th className="whitespace-nowrap px-3 py-2 text-center text-xs font-medium text-muted-foreground"><Term>인과</Term></th>
              <SortHeader label="세대" column="generation" sorts={sorts} onSortChange={onSortChange} align="center" term />
              <SortHeader label="생성일" column="created_at" sorts={sorts} onSortChange={onSortChange} align="center" />
              <th className="w-10 px-2 py-2" />
            </tr>
          </thead>
          <tbody>
            {factors.length === 0 ? (
              <tr>
                <td colSpan={COL_COUNT} className="px-3 py-12 text-center text-sm text-muted-foreground">
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
      </div>

      {/* ── Pagination ───────────────────────────────────── */}
      {factors.length > 0 && onPageChange && page != null && (
        <div className="flex items-center justify-between px-2">
          {/* Left: count */}
          <div className="flex-1 text-sm text-muted-foreground">
            {selected.size > 0
              ? `${selected.size}개 선택`
              : `${factors.length}개 팩터`}
          </div>

          {/* Right: page size + indicator + nav */}
          <div className="flex items-center gap-6">
            {onPageSizeChange && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">페이지당</span>
                <select
                  value={pageSize ?? 100}
                  onChange={(e) => onPageSizeChange(Number(e.target.value))}
                  className="h-8 w-[70px] rounded-md border bg-background px-2 text-sm"
                >
                  {[20, 50, 100, 200].map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
            )}
            <span className="text-sm font-medium">
              {page + 1} / {totalPages || 1}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => onPageChange(0)}
                disabled={page <= 0}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border text-sm disabled:opacity-50 hover:bg-muted transition-colors"
              >
                <ChevronsLeft className="size-4" />
              </button>
              <button
                onClick={() => onPageChange(page - 1)}
                disabled={page <= 0}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border text-sm disabled:opacity-50 hover:bg-muted transition-colors"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                onClick={() => onPageChange(page + 1)}
                disabled={!totalPages || page >= totalPages - 1}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border text-sm disabled:opacity-50 hover:bg-muted transition-colors"
              >
                <ChevronRight className="size-4" />
              </button>
              <button
                onClick={() => onPageChange((totalPages ?? 1) - 1)}
                disabled={!totalPages || page >= totalPages - 1}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border text-sm disabled:opacity-50 hover:bg-muted transition-colors"
              >
                <ChevronsRight className="size-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AlphaFactorTable
