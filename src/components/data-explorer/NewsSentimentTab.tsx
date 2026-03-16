import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useNewsExplorer } from "@/hooks/queries"
import LoadingSpinner from "./LoadingSpinner"
import Pagination from "./Pagination"
import { cn } from "@/lib/utils"

interface Props {
  symbol: string | null; start?: string; end?: string
  page: number; pageSize: number; onPageChange: (p: number) => void; onPageSizeChange: (s: number) => void
  startDate?: string; endDate?: string; onStartDateChange?: (v: string) => void; onEndDateChange?: (v: string) => void
}

function sentimentColor(s: number | null) { if (s == null) return "text-muted-foreground"; return s > 0.2 ? "text-red-500" : s < -0.2 ? "text-blue-500" : "text-muted-foreground" }
function sentimentLabel(s: number | null) { if (s == null) return "-"; if (s > 0.5) return "매우 긍정"; if (s > 0.2) return "긍정"; if (s > -0.2) return "중립"; if (s > -0.5) return "부정"; return "매우 부정" }
function impactBadge(i: number | null) { if (i == null) return { l: "-", c: "" }; if (i >= 0.7) return { l: "높음", c: "bg-red-100 text-red-700" }; if (i >= 0.4) return { l: "중간", c: "bg-yellow-100 text-yellow-700" }; return { l: "낮음", c: "bg-gray-100 text-gray-700" } }
const SRC: Record<string, string> = { naver: "네이버", dart: "DART", bigkinds: "BigKinds" }

function NewsSentimentTab({ symbol, start, end, page, pageSize, onPageChange, onPageSizeChange, startDate, endDate, onStartDateChange, onEndDateChange }: Props) {
  const { data, isPending, isError } = useNewsExplorer(symbol, start, end, page, pageSize)
  const rows = data?.items ?? []
  const total = data?.total ?? 0
  const totalPages = Math.ceil(total / pageSize)

  if (isPending) return <LoadingSpinner label="뉴스 감성 데이터 로딩 중" />
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
                <TableHead>종목</TableHead><TableHead>날짜</TableHead><TableHead>제목</TableHead>
                <TableHead>소스</TableHead><TableHead className="text-right">감성점수</TableHead>
                <TableHead>시장영향도</TableHead><TableHead>링크</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((a) => {
                const imp = impactBadge(a.market_impact)
                return (
                  <TableRow key={a.id}>
                    <TableCell className="text-xs">{a.name ? <><span className="font-medium">{a.name}</span><span className="ml-1 text-muted-foreground">{a.symbol}</span></> : a.symbol ? <span className="font-mono">{a.symbol}</span> : <span className="text-muted-foreground">-</span>}</TableCell>
                    <TableCell className="font-mono text-xs">{a.published_at.slice(0, 10)}</TableCell>
                    <TableCell className="max-w-[300px] truncate text-xs">{a.title}</TableCell>
                    <TableCell className="text-xs">{SRC[a.source] ?? a.source}</TableCell>
                    <TableCell className={cn("text-right font-mono text-xs", sentimentColor(a.sentiment_score))}>{a.sentiment_score != null ? `${a.sentiment_score.toFixed(3)} (${sentimentLabel(a.sentiment_score)})` : "-"}</TableCell>
                    <TableCell>{a.market_impact != null ? <Badge className={imp.c}>{imp.l}</Badge> : <span className="text-xs text-muted-foreground">-</span>}</TableCell>
                    <TableCell>{a.url ? <a href={a.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline">열기</a> : <span className="text-xs text-muted-foreground">-</span>}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}

export default NewsSentimentTab
