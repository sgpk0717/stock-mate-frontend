import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useQuery } from "@tanstack/react-query"
import { apiFetch } from "@/api/client"
import LoadingSpinner from "./LoadingSpinner"
import Pagination from "./Pagination"
import { cn } from "@/lib/utils"
import { ThumbsUp, ThumbsDown, MessageSquare } from "lucide-react"

interface DiscussionRow {
  id: string
  symbol: string
  name: string | null
  title: string
  content: string | null
  author: string | null
  published_at: string
  likes: number
  dislikes: number
  comment_count: number
  sentiment_score: number | null
}

interface PagedResponse {
  items: DiscussionRow[]
  total: number
  page: number
  limit: number
}

function useDiscussionExplorer(
  symbol: string | null, start?: string, end?: string,
  page = 0, limit = 50,
) {
  const params = new URLSearchParams()
  if (symbol) params.set("symbol", symbol)
  if (start) params.set("start", start)
  if (end) params.set("end", end)
  params.set("page", String(page))
  params.set("limit", String(limit))
  return useQuery({
    queryKey: ["data-discussion", symbol, start, end, page, limit],
    queryFn: () => apiFetch<PagedResponse>(`/data/discussion?${params}`),
  })
}

function sentimentColor(s: number | null) {
  if (s == null) return "text-muted-foreground"
  return s > 0.2 ? "text-red-500" : s < -0.2 ? "text-blue-500" : "text-muted-foreground"
}
function sentimentLabel(s: number | null) {
  if (s == null) return "-"
  if (s > 0.5) return "매우 긍정"
  if (s > 0.2) return "긍정"
  if (s > -0.2) return "중립"
  if (s > -0.5) return "부정"
  return "매우 부정"
}

interface Props {
  symbol: string | null; start?: string; end?: string
  page: number; pageSize: number; onPageChange: (p: number) => void; onPageSizeChange: (s: number) => void
  startDate?: string; endDate?: string; onStartDateChange?: (v: string) => void; onEndDateChange?: (v: string) => void
}

function DiscussionTab({ symbol, start, end, page, pageSize, onPageChange, onPageSizeChange, startDate, endDate, onStartDateChange, onEndDateChange }: Props) {
  const { data, isPending, isError } = useDiscussionExplorer(symbol, start, end, page, pageSize)
  const rows = data?.items ?? []
  const total = data?.total ?? 0
  const totalPages = Math.ceil(total / pageSize)

  if (isPending) return <LoadingSpinner label="종토방 데이터 로딩 중" />
  if (isError) return <p className="py-8 text-center text-sm text-destructive">데이터 조회 실패</p>

  return (
    <Card>
      <CardContent className="pt-2">
        <Pagination page={page} totalPages={totalPages} pageSize={pageSize} total={total}
          onPageChange={onPageChange} onPageSizeChange={onPageSizeChange}
          startDate={startDate} endDate={endDate} onStartDateChange={onStartDateChange} onEndDateChange={onEndDateChange} />
        {rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">데이터가 없습니다</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">종목</TableHead>
                <TableHead className="w-[140px]">시간</TableHead>
                <TableHead>제목</TableHead>
                <TableHead className="w-[80px]">작성자</TableHead>
                <TableHead className="w-[60px] text-center">반응</TableHead>
                <TableHead className="w-[90px] text-right">감성점수</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="text-xs">
                    {r.name
                      ? <><span className="font-medium">{r.name}</span><br /><span className="text-muted-foreground">{r.symbol}</span></>
                      : <span className="font-mono">{r.symbol}</span>}
                  </TableCell>
                  <TableCell className="font-mono text-xs whitespace-nowrap">
                    {new Date(r.published_at).toLocaleString("ko-KR", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })}
                  </TableCell>
                  <TableCell className="max-w-[300px] text-xs">
                    <div className="truncate font-medium">{r.title}</div>
                    {r.content && (
                      <div className="mt-0.5 truncate text-muted-foreground text-[11px]">
                        {r.content}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground truncate max-w-[80px]">
                    {r.author || "-"}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1.5 text-[11px]">
                      {r.likes > 0 && (
                        <span className="flex items-center gap-0.5 text-red-500">
                          <ThumbsUp className="h-3 w-3" />{r.likes}
                        </span>
                      )}
                      {r.dislikes > 0 && (
                        <span className="flex items-center gap-0.5 text-blue-500">
                          <ThumbsDown className="h-3 w-3" />{r.dislikes}
                        </span>
                      )}
                      {r.comment_count > 0 && (
                        <span className="flex items-center gap-0.5 text-muted-foreground">
                          <MessageSquare className="h-3 w-3" />{r.comment_count}
                        </span>
                      )}
                      {r.likes === 0 && r.dislikes === 0 && r.comment_count === 0 && (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className={cn("text-right font-mono text-xs", sentimentColor(r.sentiment_score))}>
                    {r.sentiment_score != null
                      ? `${r.sentiment_score.toFixed(2)} ${sentimentLabel(r.sentiment_score)}`
                      : <Badge variant="outline" className="text-[9px]">미분석</Badge>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}

export default DiscussionTab
