import { Fragment, useState } from "react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { useTelegramLogs } from "@/hooks/queries"

type CategoryFilter = "ALL" | "command_response" | "approval" | "mining_report" | "workflow_alert" | "system" | "error"
type StatusFilter = "ALL" | "success" | "failed" | "skipped"

const categoryConfig: Record<string, { label: string; className: string }> = {
  command_response: { label: "명령어", className: "border-blue-200 text-blue-600 bg-blue-50" },
  approval: { label: "승인", className: "border-purple-200 text-purple-600 bg-purple-50" },
  mining_report: { label: "마이닝", className: "border-amber-200 text-amber-600 bg-amber-50" },
  workflow_alert: { label: "워크플로우", className: "border-orange-200 text-orange-600 bg-orange-50" },
  system: { label: "시스템", className: "border-gray-200 text-gray-500 bg-gray-50" },
  error: { label: "에러", className: "border-red-200 text-red-500 bg-red-50" },
}

const statusConfig: Record<string, { label: string; className: string }> = {
  success: { label: "성공", className: "border-emerald-200 text-emerald-600 bg-emerald-50" },
  failed: { label: "실패", className: "border-red-200 text-red-500 bg-red-50" },
  skipped: { label: "스킵", className: "border-gray-200 text-gray-500 bg-gray-50" },
}

const CATEGORY_FILTERS: { value: CategoryFilter; label: string }[] = [
  { value: "ALL", label: "전체" },
  { value: "command_response", label: "명령어" },
  { value: "approval", label: "승인" },
  { value: "mining_report", label: "마이닝" },
  { value: "workflow_alert", label: "워크플로우" },
  { value: "system", label: "시스템" },
  { value: "error", label: "에러" },
]

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "ALL", label: "전체" },
  { value: "success", label: "성공" },
  { value: "failed", label: "실패" },
  { value: "skipped", label: "스킵" },
]

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "")
}

function TelegramLogPage() {
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("ALL")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL")
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [page, setPage] = useState(0)
  const PAGE_SIZE = 50

  const { data: logs, isLoading } = useTelegramLogs({
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
    category: categoryFilter !== "ALL" ? categoryFilter : undefined,
    status: statusFilter !== "ALL" ? statusFilter : undefined,
  })

  return (
    <div className="space-y-4">
      {/* 요약 */}
      <div className="flex items-center gap-4">
        <div className="text-sm text-muted-foreground">
          조회 <span className="font-medium text-foreground">{logs?.length ?? 0}</span>건
          {page > 0 && (
            <span className="ml-1">
              (페이지 {page + 1})
            </span>
          )}
        </div>
      </div>

      {/* 필터 */}
      <div className="flex flex-wrap gap-2">
        <div className="flex gap-1 rounded-lg border p-1">
          {CATEGORY_FILTERS.map((f) => (
            <Button
              key={f.value}
              size="sm"
              variant={categoryFilter === f.value ? "secondary" : "ghost"}
              className="h-7 text-xs"
              onClick={() => { setCategoryFilter(f.value); setPage(0) }}
            >
              {f.label}
            </Button>
          ))}
        </div>

        <div className="flex gap-1 rounded-lg border p-1">
          {STATUS_FILTERS.map((f) => (
            <Button
              key={f.value}
              size="sm"
              variant={statusFilter === f.value ? "secondary" : "ghost"}
              className="h-7 text-xs"
              onClick={() => { setStatusFilter(f.value); setPage(0) }}
            >
              {f.label}
            </Button>
          ))}
        </div>
      </div>

      {/* 테이블 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">텔레그램 발송 내역</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[140px]">발송일시</TableHead>
                  <TableHead className="w-[80px] text-center">카테고리</TableHead>
                  <TableHead className="w-[70px] text-center">상태</TableHead>
                  <TableHead>메시지</TableHead>
                  <TableHead className="w-[160px]">호출자</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs?.map((log) => {
                  const cat = categoryConfig[log.category]
                  const st = statusConfig[log.status]
                  const dateStr = new Date(log.created_at).toLocaleString("sv-SE", { timeZone: "Asia/Seoul" }).slice(0, 19)
                  const preview = stripHtml(log.text)
                  const isExpanded = expandedIds.has(log.id)

                  return (
                    <Fragment key={log.id}>
                      <TableRow
                        className={cn(
                          "cursor-pointer",
                          isExpanded ? "bg-muted/20" : "hover:bg-muted/30",
                        )}
                        onClick={() => setExpandedIds((prev) => {
                          const next = new Set(prev)
                          if (next.has(log.id)) next.delete(log.id)
                          else next.add(log.id)
                          return next
                        })}
                      >
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {dateStr}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className={cn("text-xs", cat?.className)}>
                            {cat?.label ?? log.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className={cn("text-xs", st?.className)}>
                            {st?.label ?? log.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <p className="max-w-lg truncate text-sm" title={preview}>
                            {preview}
                          </p>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground font-mono">
                          {log.caller || "-"}
                        </TableCell>
                      </TableRow>
                      {isExpanded && (
                        <tr key={`${log.id}-detail`}>
                          <td colSpan={5} className="border-b bg-muted/10 p-0">
                            <div className="px-4 py-3 space-y-2">
                              <pre className="whitespace-pre-wrap text-sm leading-relaxed">{preview}</pre>
                              {log.status === "failed" && log.error_message && (
                                <p className="text-xs text-red-500">에러: {log.error_message}</p>
                              )}
                              <div className="flex gap-4 text-xs text-muted-foreground pt-1 border-t">
                                <span>ID: {log.id.slice(0, 8)}</span>
                                <span>Chat: {log.chat_id}</span>
                                {log.telegram_message_id && (
                                  <span>Msg #{log.telegram_message_id}</span>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
                {logs?.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="py-8 text-center text-muted-foreground"
                    >
                      발송 내역이 없습니다
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}

          {/* 페이지네이션 */}
          <div className="mt-4 flex items-center justify-between">
            <Button
              size="sm"
              variant="outline"
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              이전
            </Button>
            <span className="text-xs text-muted-foreground">
              {page + 1} 페이지
            </span>
            <Button
              size="sm"
              variant="outline"
              disabled={!logs || logs.length < PAGE_SIZE}
              onClick={() => setPage((p) => p + 1)}
            >
              다음
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default TelegramLogPage
