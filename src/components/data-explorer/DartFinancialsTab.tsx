import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import { useDartFinancials } from "@/hooks/queries"
import LoadingSpinner from "./LoadingSpinner"
import Pagination from "./Pagination"
import { formatNumber, formatPercent } from "@/lib/format"

interface Props {
  symbol: string | null
  page: number; pageSize: number; onPageChange: (p: number) => void; onPageSizeChange: (s: number) => void
}

function fmtAt(c: string | null) { if (!c) return "-"; return new Date(c).toLocaleString("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }) }

function DartFinancialsTab({ symbol, page, pageSize, onPageChange, onPageSizeChange }: Props) {
  const [yearFilter, setYearFilter] = useState("")
  const { data, isPending, isError } = useDartFinancials(symbol, yearFilter || undefined, page, pageSize)
  const rows = data?.items ?? []
  const total = data?.total ?? 0
  const totalPages = Math.ceil(total / pageSize)

  if (isPending) return <LoadingSpinner label="DART 재무 데이터 로딩 중" />
  if (isError) return <p className="py-8 text-center text-sm text-destructive">데이터 조회 실패</p>

  const years = rows.length > 0 ? [...new Set(rows.map((r) => r.fiscal_year))].sort().reverse() : []

  return (
    <Card>
      <CardContent className="pt-2">
        <div className="flex items-center justify-between px-3 py-2">
          <Pagination page={page} totalPages={totalPages} pageSize={pageSize} total={total}
            onPageChange={onPageChange} onPageSizeChange={onPageSizeChange} />
        </div>
        {years.length > 0 && (
          <div className="flex justify-end px-3 pb-2">
            <select value={yearFilter} onChange={(e) => { setYearFilter(e.target.value); onPageChange(0) }}
              className="rounded-md border border-input bg-background px-2 py-1 text-xs">
              <option value="">전체 연도</option>
              {years.map((y) => <option key={y} value={y}>{y}년</option>)}
            </select>
          </div>
        )}
        {rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">데이터가 없습니다</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>종목</TableHead><TableHead>공시일</TableHead><TableHead>회계연도</TableHead><TableHead>분기</TableHead>
                <TableHead className="text-right">EPS</TableHead><TableHead className="text-right">BPS</TableHead>
                <TableHead className="text-right">영업이익률(%)</TableHead><TableHead className="text-right">부채비율(%)</TableHead>
                <TableHead>수집시각</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="text-xs"><span className="font-medium">{r.name ?? r.symbol}</span>{r.name && <span className="ml-1 text-muted-foreground">{r.symbol}</span>}</TableCell>
                  <TableCell className="font-mono text-xs">{r.disclosure_date.slice(0, 10)}</TableCell>
                  <TableCell className="text-xs">{r.fiscal_year}</TableCell>
                  <TableCell className="text-xs">{r.fiscal_quarter}</TableCell>
                  <TableCell className="text-right font-mono text-xs">{r.eps != null ? formatNumber(r.eps) : "-"}</TableCell>
                  <TableCell className="text-right font-mono text-xs">{r.bps != null ? formatNumber(r.bps) : "-"}</TableCell>
                  <TableCell className="text-right font-mono text-xs">{r.operating_margin != null ? formatPercent(r.operating_margin) : "-"}</TableCell>
                  <TableCell className="text-right font-mono text-xs">{r.debt_to_equity != null ? formatPercent(r.debt_to_equity) : "-"}</TableCell>
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

export default DartFinancialsTab
