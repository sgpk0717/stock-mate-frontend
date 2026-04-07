import { useState, useMemo, useCallback } from "react"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import type { DateRange } from "react-day-picker"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { CalendarIcon } from "lucide-react"

export type DateMode = "single" | "range" | "recent"

export interface CollectorDateValue {
  mode: DateMode
  /** YYYYMMDD (single) */
  date?: string
  /** YYYYMMDD (range start) */
  dateFrom?: string
  /** YYYYMMDD (range end) */
  dateTo?: string
  /** N days (recent) */
  recentDays?: number
  /** 유효한 날짜가 선택되었는지 */
  valid: boolean
}

interface CollectorDateSelectorProps {
  value: CollectorDateValue
  onChange: (v: CollectorDateValue) => void
}

const MODE_LABELS: Record<DateMode, string> = {
  single: "특정일",
  range: "기간",
  recent: "최근",
}

const RECENT_PRESETS = [7, 14, 30, 90] as const

function fmtYMD(d: Date): string {
  return format(d, "yyyyMMdd")
}

function parseYMD(s: string | undefined): Date | undefined {
  if (!s || s.length < 8) return undefined
  const y = +s.slice(0, 4), m = +s.slice(4, 6) - 1, d = +s.slice(6, 8)
  return new Date(y, m, d)
}

export function useCollectorDate(initial?: Partial<CollectorDateValue>): [CollectorDateValue, (v: CollectorDateValue) => void] {
  const [val, setVal] = useState<CollectorDateValue>({
    mode: initial?.mode ?? "single",
    date: initial?.date,
    dateFrom: initial?.dateFrom,
    dateTo: initial?.dateTo,
    recentDays: initial?.recentDays ?? 7,
    valid: false,
  })
  return [val, setVal]
}

function CollectorDateSelector({ value, onChange }: CollectorDateSelectorProps) {
  const [calOpen, setCalOpen] = useState(false)
  const [rangeCalOpen, setRangeCalOpen] = useState(false)

  const setMode = useCallback((mode: DateMode) => {
    const valid = mode === "recent" ? (value.recentDays ?? 7) >= 1 : false
    onChange({ ...value, mode, valid })
  }, [value, onChange])

  // ── Single date ──
  const singleDate = useMemo(() => parseYMD(value.date), [value.date])

  const handleSingleSelect = useCallback((d: Date | undefined) => {
    if (!d) return
    onChange({ ...value, date: fmtYMD(d), valid: true })
    setCalOpen(false)
  }, [value, onChange])

  const handleToday = useCallback(() => {
    const today = fmtYMD(new Date())
    if (value.mode === "single") {
      onChange({ ...value, date: today, valid: true })
    } else if (value.mode === "range") {
      onChange({ ...value, dateFrom: today, dateTo: today, valid: true })
    }
  }, [value, onChange])

  // ── Range ──
  const rangeFrom = useMemo(() => parseYMD(value.dateFrom), [value.dateFrom])
  const rangeTo = useMemo(() => parseYMD(value.dateTo), [value.dateTo])
  const rangeSelected: DateRange | undefined = useMemo(
    () => (rangeFrom || rangeTo ? { from: rangeFrom, to: rangeTo } : undefined),
    [rangeFrom, rangeTo],
  )

  const handleRangeSelect = useCallback((range: DateRange | undefined) => {
    const from = range?.from ? fmtYMD(range.from) : undefined
    const to = range?.to ? fmtYMD(range.to) : undefined
    const valid = !!from && !!to
    onChange({ ...value, dateFrom: from, dateTo: to, valid })
    if (valid) setRangeCalOpen(false)
  }, [value, onChange])

  // ── Recent ──
  const handleRecentPreset = useCallback((days: number) => {
    onChange({ ...value, mode: "recent", recentDays: days, valid: true })
  }, [value, onChange])

  const handleRecentCustom = useCallback((days: number) => {
    const clamped = Math.max(1, Math.min(365, days || 1))
    onChange({ ...value, recentDays: clamped, valid: clamped >= 1 })
  }, [value, onChange])

  // ── Summary label ──
  const summary = useMemo(() => {
    if (value.mode === "single" && singleDate) return format(singleDate, "yyyy-MM-dd")
    if (value.mode === "range" && rangeFrom && rangeTo)
      return `${format(rangeFrom, "yy.MM.dd")} ~ ${format(rangeTo, "yy.MM.dd")}`
    if (value.mode === "recent") return `최근 ${value.recentDays ?? 7}일`
    return null
  }, [value, singleDate, rangeFrom, rangeTo])

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/30 p-2">
      {/* ── Mode tabs (segmented control) ── */}
      <div className="flex rounded-md border bg-background p-0.5">
        {(["single", "range", "recent"] as DateMode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={cn(
              "rounded px-2.5 py-1 text-[11px] font-medium transition-all",
              value.mode === m
                ? "bg-[#4056F4] text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {MODE_LABELS[m]}
          </button>
        ))}
      </div>

      {/* ── Single date picker ── */}
      {value.mode === "single" && (
        <Popover open={calOpen} onOpenChange={setCalOpen}>
          <PopoverTrigger asChild>
            <button
              className={cn(
                "flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs transition-colors hover:bg-muted",
                singleDate
                  ? "border-input bg-background text-foreground"
                  : "border-dashed border-muted-foreground/40 text-muted-foreground",
              )}
            >
              <CalendarIcon className="h-3 w-3" />
              {singleDate ? format(singleDate, "yyyy-MM-dd") : "날짜 선택"}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={singleDate}
              onSelect={handleSingleSelect}
              locale={ko}
              defaultMonth={singleDate ?? new Date()}
            />
            <div className="border-t px-3 py-2">
              <button
                onClick={() => { handleSingleSelect(new Date()); }}
                className="text-xs text-[#4056F4] hover:underline"
              >
                오늘
              </button>
            </div>
          </PopoverContent>
        </Popover>
      )}

      {/* ── Range date picker ── */}
      {value.mode === "range" && (
        <Popover open={rangeCalOpen} onOpenChange={setRangeCalOpen}>
          <PopoverTrigger asChild>
            <button
              className={cn(
                "flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs transition-colors hover:bg-muted",
                rangeFrom && rangeTo
                  ? "border-input bg-background text-foreground"
                  : "border-dashed border-muted-foreground/40 text-muted-foreground",
              )}
            >
              <CalendarIcon className="h-3 w-3" />
              {rangeFrom && rangeTo
                ? `${format(rangeFrom, "yy.MM.dd")} ~ ${format(rangeTo, "yy.MM.dd")}`
                : "기간 선택"}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              selected={rangeSelected}
              onSelect={handleRangeSelect}
              numberOfMonths={2}
              locale={ko}
              defaultMonth={rangeTo ?? rangeFrom ?? new Date()}
            />
            <div className="flex items-center justify-between border-t px-3 py-2">
              <button
                onClick={() => handleRangeSelect(undefined)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                초기화
              </button>
              <button
                onClick={() => {
                  const today = new Date()
                  handleRangeSelect({ from: today, to: today })
                }}
                className="text-xs text-[#4056F4] hover:underline"
              >
                오늘
              </button>
            </div>
          </PopoverContent>
        </Popover>
      )}

      {/* ── Recent N days (presets + custom) ── */}
      {value.mode === "recent" && (
        <div className="flex items-center gap-1.5">
          {RECENT_PRESETS.map((d) => (
            <button
              key={d}
              onClick={() => handleRecentPreset(d)}
              className={cn(
                "rounded-full border px-2 py-0.5 text-[11px] font-medium transition-all",
                value.recentDays === d
                  ? "border-[#4056F4] bg-[#4056F4]/10 text-[#4056F4]"
                  : "border-transparent text-muted-foreground hover:border-input hover:text-foreground",
              )}
            >
              {d}일
            </button>
          ))}
          <div className="flex items-center gap-1 rounded-md border bg-background px-1.5">
            <Input
              type="number"
              min={1}
              max={365}
              value={value.recentDays ?? 7}
              onChange={(e) => handleRecentCustom(Number(e.target.value))}
              className="h-6 w-12 border-0 p-0 text-center text-xs shadow-none focus-visible:ring-0"
            />
            <span className="text-[10px] text-muted-foreground">일</span>
          </div>
        </div>
      )}

      {/* ── Today shortcut (single/range only) ── */}
      {value.mode !== "recent" && (
        <button
          onClick={handleToday}
          className="rounded-full border border-transparent px-2 py-0.5 text-[11px] text-muted-foreground transition-colors hover:border-input hover:text-foreground"
        >
          오늘
        </button>
      )}

      {/* ── Summary ── */}
      {summary && (
        <span className="ml-auto text-[10px] text-muted-foreground">{summary}</span>
      )}
    </div>
  )
}

export default CollectorDateSelector
