import { useState } from "react"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import type { DateRange } from "react-day-picker"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface DateRangePickerProps {
  startDate?: string
  endDate?: string
  onStartDateChange?: (v: string) => void
  onEndDateChange?: (v: string) => void
}

function DateRangePicker({ startDate, endDate, onStartDateChange, onEndDateChange }: DateRangePickerProps) {
  const [open, setOpen] = useState(false)

  const from = startDate ? new Date(startDate + "T00:00:00") : undefined
  const to = endDate ? new Date(endDate + "T00:00:00") : undefined
  const selected: DateRange | undefined = from || to ? { from, to } : undefined

  const label = from && to
    ? `${format(from, "yy.MM.dd")} ~ ${format(to, "yy.MM.dd")}`
    : from
      ? `${format(from, "yy.MM.dd")} ~`
      : "날짜 선택"

  function handleSelect(range: DateRange | undefined) {
    const f = range?.from ? format(range.from, "yyyy-MM-dd") : ""
    const t = range?.to ? format(range.to, "yyyy-MM-dd") : ""
    onStartDateChange?.(f)
    onEndDateChange?.(t)
    if (range?.from && range?.to) setOpen(false)
  }

  function handleClear() {
    onStartDateChange?.("")
    onEndDateChange?.("")
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-1.5 rounded-md border border-input bg-background px-2.5 py-1 text-xs transition-colors hover:bg-muted",
            selected ? "text-foreground" : "text-muted-foreground",
          )}
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
          </svg>
          {label}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <Calendar
          mode="range"
          selected={selected}
          onSelect={handleSelect}
          numberOfMonths={2}
          locale={ko}
          defaultMonth={to ?? from ?? new Date()}
        />
        {selected && (
          <div className="border-t px-3 py-2">
            <button onClick={handleClear} className="text-xs text-muted-foreground hover:text-foreground">
              날짜 초기화
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

export default DateRangePicker
