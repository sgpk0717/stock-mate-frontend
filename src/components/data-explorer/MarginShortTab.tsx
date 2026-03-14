import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import { useMarginShort } from "@/hooks/queries"
import LoadingSpinner from "./LoadingSpinner"
import Pagination from "./Pagination"
import { formatNumber, formatPercent } from "@/lib/format"

interface Props {
  symbol: string | null; start?: string; end?: string
  page: number; pageSize: number; onPageChange: (p: number) => void; onPageSizeChange: (s: number) => void
}

function fmtAt(c: string | null) { if (!c) return "-"; return new Date(c).toLocaleString("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }) }

function MarginShortTab({ symbol, start, end, page, pageSize, onPageChange, onPageSizeChange }: Props) {
  const { data, isPending, isError } = useMarginShort(symbol, start, end, page, pageSize)
  const rows = data?.items ?? []
  const total = data?.total ?? 0
  const totalPages = Math.ceil(total / pageSize)

  if (isPending) return <LoadingSpinner label="공매도/신용 데이터 로딩 중" />
  if (isError) return <p className="py-8 text-center text-sm text-destructive">데이터 조회 실패</p>
  if (rows.length === 0) return <p className="py-8 text-center text-sm text-muted-foreground">데이터가 없습니다</p>

  return (
    <Card>
      <CardContent className="pt-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>종목</TableHead><TableHead>날짜</TableHead>
              <TableHead className="text-right">신용잔고</TableHead><TableHead className="text-right">신용비율(%)</TableHead>
              <TableHead className="text-right">공매도량</TableHead><TableHead className="text-right">공매도잔고</TableHead>
              <TableHead className="text-right">공매도비율(%)</TableHead><TableHead>수집시각</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="text-xs"><span className="font-medium">{r.name ?? r.symbol}</span>{r.name && <span className="ml-1 text-muted-foreground">{r.symbol}</span>}</TableCell>
                <TableCell className="font-mono text-xs">{r.dt.slice(0, 10)}</TableCell>
                <TableCell className="text-right font-mono text-xs">{formatNumber(r.margin_balance)}</TableCell>
                <TableCell className="text-right font-mono text-xs">{formatPercent(r.margin_rate)}</TableCell>
                <TableCell className="text-right font-mono text-xs">{formatNumber(r.short_volume)}</TableCell>
                <TableCell className="text-right font-mono text-xs">{formatNumber(r.short_balance)}</TableCell>
                <TableCell className="text-right font-mono text-xs">{formatPercent(r.short_balance_rate)}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{fmtAt(r.collected_at)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <Pagination page={page} totalPages={totalPages} pageSize={pageSize} total={total} onPageChange={onPageChange} onPageSizeChange={onPageSizeChange} />
      </CardContent>
    </Card>
  )
}

export default MarginShortTab
