import { useCallback, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useCollectionStatus } from "@/hooks/queries"
import { formatNumber } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { CollectionStatusItem } from "@/types/data-explorer"
import { startVerification, type VerifyEvent } from "@/api/data-explorer"
import LoadingSpinner from "./LoadingSpinner"

// 테이블→검증 소스 매핑
const TABLE_TO_SOURCE: Record<string, string> = {
  stock_candles_1d: "daily_candle",
  stock_candles_1m: "minute_candle",
  margin_short_daily: "margin_short",
  investor_trading: "investor",
  program_trading: "program_trading",
}

function getBorderColor(item: CollectionStatusItem): string {
  if (item.total_rows === 0) return "border-red-500"
  const ref = item.latest_date
  if (!ref) return "border-red-500"

  const last = new Date(ref)
  const now = new Date()
  const diffDays = (now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24)

  if (diffDays < 2) return "border-green-500"
  if (diffDays <= 7) return "border-yellow-500"
  return "border-red-500"
}

function formatDateRange(earliest: string | null, latest: string | null): string {
  if (!earliest || !latest) return "-"
  return `${earliest.slice(0, 10)} ~ ${latest.slice(0, 10)}`
}

function formatDate(val: string | null, withTime = false): string {
  if (!val) return "-"
  if (withTime && val.length > 10) {
    // ISO datetime → YYYY-MM-DD HH:MM
    const d = new Date(val)
    return d.toLocaleString("ko-KR", {
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit",
    })
  }
  return val.slice(0, 10)
}

function formatCollectedAt(collected: string | null): string {
  if (!collected) return "-"
  const d = new Date(collected)
  return d.toLocaleString("ko-KR", {
    month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
  })
}

interface LogEntry {
  type: string
  message: string
  date?: string
}

function CollectionOverview() {
  const { data: items, isPending, isError } = useCollectionStatus()
  const [verifying, setVerifying] = useState<string | null>(null)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [pct, setPct] = useState(0)
  const [result, setResult] = useState<VerifyEvent | null>(null)
  const ctrlRef = useRef<AbortController | null>(null)
  const logEndRef = useRef<HTMLDivElement | null>(null)

  const handleVerify = useCallback((source: string) => {
    // 진행 중이면 취소
    if (ctrlRef.current) {
      ctrlRef.current.abort()
      ctrlRef.current = null
    }
    setVerifying(source)
    setLogs([])
    setPct(0)
    setResult(null)

    const ctrl = startVerification(source, (ev) => {
      if (ev.type === "progress") {
        setPct(ev.pct ?? 0)
        setLogs((prev) => [...prev, { type: "progress", message: ev.message ?? "" }])
      } else if (ev.type === "gap") {
        setLogs((prev) => [...prev, { type: "gap", message: ev.message ?? "", date: ev.date ?? "" }])
      } else if (ev.type === "error") {
        setLogs((prev) => [...prev, { type: "error", message: ev.message ?? "" }])
      } else if (ev.type === "done") {
        setResult(ev)
        setVerifying(null)
        setPct(100)
      } else if (ev.type === "start") {
        setLogs((prev) => [...prev, { type: "start", message: `${ev.display} 검증 시작` }])
      }
      // 자동 스크롤
      setTimeout(() => {
        const container = logEndRef.current?.parentElement
        if (container) container.scrollTop = container.scrollHeight
      }, 50)
    })
    ctrlRef.current = ctrl
  }, [])

  if (isPending) return <LoadingSpinner label="수집 현황 로딩 중" />
  if (isError) return <p className="text-sm text-destructive">수집 현황 조회 실패</p>
  if (!items || items.length === 0) return <p className="text-sm text-muted-foreground">수집 현황 데이터가 없습니다</p>

  return (
    <div className="space-y-4">
      {/* 카드 그리드 */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {items.map((item) => {
          const source = TABLE_TO_SOURCE[item.table_name]
          return (
            <Card key={item.table_name} className={cn("border-l-4", getBorderColor(item))}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">{item.display_name}</CardTitle>
                  {source && (
                    <Button
                      variant="ghost" size="sm"
                      className="h-6 px-2 text-[10px]"
                      disabled={verifying === source}
                      onClick={() => handleVerify(source)}
                    >
                      {verifying === source ? "검증 중..." : "검증"}
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-1">
                <p className="text-2xl font-bold">
                  {formatNumber(item.total_rows)}
                  <span className="ml-1 text-xs font-normal text-muted-foreground">건</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDateRange(item.earliest_date, item.latest_date)}
                </p>
                <p className="text-sm font-medium">
                  최신 데이터: {formatDate(item.latest_date, item.table_name === "stock_candles_1m")}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  수집 시도: {formatCollectedAt(item.last_collected_at)}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* 검증 로그 패널 */}
      {(logs.length > 0 || verifying) && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">
                데이터 검증 로그
                {result && (
                  <span className={cn(
                    "ml-2 text-xs font-normal",
                    (result.total_gaps ?? 0) > 0 ? "text-red-600" : "text-green-600",
                  )}>
                    {(result.total_gaps ?? 0) > 0
                      ? `${result.total_gaps}건 갭 발견`
                      : "검증 통과"}
                  </span>
                )}
              </CardTitle>
              {verifying && (
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-24 overflow-hidden rounded-full bg-gray-200">
                    <div className="h-full bg-[#4056F4] transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs text-muted-foreground">{pct}%</span>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="max-h-64 overflow-y-auto rounded bg-gray-50 p-2 font-mono text-xs">
              {logs.map((log, i) => (
                <div key={i} className={cn(
                  "py-0.5",
                  log.type === "gap" && "text-red-600 font-medium",
                  log.type === "error" && "text-red-700 font-bold",
                  log.type === "progress" && "text-gray-600",
                  log.type === "start" && "text-blue-600",
                )}>
                  {log.type === "gap" && "! "}
                  {log.type === "error" && "ERROR: "}
                  {log.message}
                </div>
              ))}
              <div ref={logEndRef} />
            </div>
            {/* 갭 재수집 안내 */}
            {result && (result.total_gaps ?? 0) > 0 && (
              <p className="mt-2 text-xs text-muted-foreground">
                갭 날짜: {result.gaps?.slice(0, 5).map((g) => g.date).join(", ")}
                {(result.gaps?.length ?? 0) > 5 && ` 외 ${(result.gaps?.length ?? 0) - 5}건`}
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default CollectionOverview
