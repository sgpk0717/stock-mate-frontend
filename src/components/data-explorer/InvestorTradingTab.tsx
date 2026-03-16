import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import { useInvestorTrading } from "@/hooks/queries"
import LoadingSpinner from "./LoadingSpinner"
import Pagination from "./Pagination"
import { formatNumber } from "@/lib/format"
import { cn } from "@/lib/utils"

interface Props {
  symbol: string | null; start?: string; end?: string
  page: number; pageSize: number; onPageChange: (p: number) => void; onPageSizeChange: (s: number) => void
  startDate?: string; endDate?: string; onStartDateChange?: (v: string) => void; onEndDateChange?: (v: string) => void
}

function netColor(v: number) { return v > 0 ? "text-red-500" : v < 0 ? "text-blue-500" : "" }
function fmtAt(c: string | null) { if (!c) return "-"; return new Date(c).toLocaleString("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }) }

function InvestorTradingTab({ symbol, start, end, page, pageSize, onPageChange, onPageSizeChange, startDate, endDate, onStartDateChange, onEndDateChange }: Props) {
  const { data, isPending, isError } = useInvestorTrading(symbol, start, end, page, pageSize)
  const rows = data?.items ?? []
  const total = data?.total ?? 0
  const totalPages = Math.ceil(total / pageSize)

  if (isPending) return <LoadingSpinner label="투자자 매매동향 로딩 중" />
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
                <TableHead>종목</TableHead><TableHead>날짜</TableHead>
                <TableHead className="text-right">외국인 순매수</TableHead><TableHead className="text-right">기관 순매수</TableHead><TableHead className="text-right">개인 순매수</TableHead>
                <TableHead className="text-right">외국인 매수</TableHead><TableHead className="text-right">외국인 매도</TableHead>
                <TableHead className="text-right">기관 매수</TableHead><TableHead className="text-right">기관 매도</TableHead>
                <TableHead>수집시각</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="text-xs"><span className="font-medium">{r.name ?? r.symbol}</span>{r.name && <span className="ml-1 text-muted-foreground">{r.symbol}</span>}</TableCell>
                  <TableCell className="font-mono text-xs">{r.dt.slice(0, 10)}</TableCell>
                  <TableCell className={cn("text-right font-mono text-xs", netColor(r.foreign_net))}>{formatNumber(r.foreign_net)}</TableCell>
                  <TableCell className={cn("text-right font-mono text-xs", netColor(r.inst_net))}>{formatNumber(r.inst_net)}</TableCell>
                  <TableCell className={cn("text-right font-mono text-xs", netColor(r.retail_net))}>{formatNumber(r.retail_net)}</TableCell>
                  <TableCell className="text-right font-mono text-xs">{formatNumber(r.foreign_buy_vol)}</TableCell>
                  <TableCell className="text-right font-mono text-xs">{formatNumber(r.foreign_sell_vol)}</TableCell>
                  <TableCell className="text-right font-mono text-xs">{formatNumber(r.inst_buy_vol)}</TableCell>
                  <TableCell className="text-right font-mono text-xs">{formatNumber(r.inst_sell_vol)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{fmtAt(r.collected_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}

export default InvestorTradingTab
