import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import { useCandleCoverage } from "@/hooks/queries"
import LoadingSpinner from "./LoadingSpinner"
import { formatNumber } from "@/lib/format"

interface CandleCoverageTabProps {
  symbol?: string | null
}

const INTERVAL_LABELS: Record<string, string> = {
  "1m": "1분봉",
  "3m": "3분봉",
  "5m": "5분봉",
  "10m": "10분봉",
  "15m": "15분봉",
  "30m": "30분봉",
  "1h": "1시간봉",
  "1d": "일봉",
  "1w": "주봉",
  "1M": "월봉",
}

function CandleCoverageTab({ symbol }: CandleCoverageTabProps) {
  const { data: items, isPending, isError } = useCandleCoverage(
    symbol ?? undefined,
  )

  if (isPending) {
    return <LoadingSpinner label="캔들 커버리지 로딩 중" />
  }

  if (isError) {
    return <p className="py-8 text-center text-sm text-destructive">데이터 조회 실패</p>
  }

  if (!items || items.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        데이터가 없습니다
      </p>
    )
  }

  return (
    <Card>
      <CardContent className="pt-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>종목</TableHead>
              <TableHead>인터벌</TableHead>
              <TableHead className="text-right">캔들 수</TableHead>
              <TableHead>시작일</TableHead>
              <TableHead>종료일</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item, idx) => (
              <TableRow key={`${item.symbol}-${item.interval}-${idx}`}>
                <TableCell className="text-xs">
                  <span className="font-medium">{item.name ?? item.symbol}</span>
                  {item.name && (
                    <span className="ml-1 text-muted-foreground">{item.symbol}</span>
                  )}
                </TableCell>
                <TableCell className="text-xs">
                  {INTERVAL_LABELS[item.interval] ?? item.interval}
                </TableCell>
                <TableCell className="text-right font-mono text-xs">
                  {formatNumber(item.total_candles)}
                </TableCell>
                <TableCell className="font-mono text-xs">
                  {item.earliest_date.slice(0, 10)}
                </TableCell>
                <TableCell className="font-mono text-xs">
                  {item.latest_date.slice(0, 10)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

export default CandleCoverageTab
