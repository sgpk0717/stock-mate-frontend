import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Term } from "@/components/ui/term"
import { cn } from "@/lib/utils"
import type { BacktestTrade } from "@/types"
import BacktestTradeDetail from "./BacktestTradeDetail"

interface BacktestTradeTableProps {
  trades: BacktestTrade[] | null
}

const PAGE_SIZE = 20

const STEP_BADGE: Record<
  string,
  { label: string; variant: "default" | "secondary" | "outline" | "destructive" }
> = {
  B1: { label: "1차매수", variant: "outline" },
  B2: { label: "추가매수", variant: "secondary" },
  "S-HALF": { label: "부분익절", variant: "default" },
  "S-TRAIL": { label: "트레일링", variant: "default" },
  "S-STOP": { label: "손절", variant: "destructive" },
  "REBAL-SELL": { label: "리밸런싱", variant: "secondary" },
  "ORPHAN-SELL": { label: "데이터소실", variant: "destructive" },
  "STOP-LOSS": { label: "손절", variant: "destructive" },
  "CIRCUIT-BREAKER": { label: "서킷브레이커", variant: "destructive" },
  "S-EOD": { label: "장종료", variant: "secondary" },
  FINAL: { label: "종료청산", variant: "outline" },
}

function BacktestTradeTable({ trades }: BacktestTradeTableProps) {
  const [page, setPage] = useState(0)
  const [selectedTrade, setSelectedTrade] = useState<BacktestTrade | null>(null)

  if (!trades?.length) return null

  // exit_date가 있는 완결 거래만 테이블에 표시 (B1/B2 entry-only 제외)
  const closedTrades = trades.filter((t) => t.exit_date)
  if (!closedTrades.length) return null

  const hasScaleSteps = closedTrades.some((t) => t.scale_step)
  const hasExitReason = closedTrades.some((t) => t.exit_reason)

  const totalPages = Math.ceil(closedTrades.length / PAGE_SIZE)
  const paged = closedTrades.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">
            매매 로그 ({closedTrades.length}건)
          </CardTitle>
          {totalPages > 1 && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <button
                className="hover:text-foreground disabled:opacity-30"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                이전
              </button>
              <span>
                {page + 1} / {totalPages}
              </span>
              <button
                className="hover:text-foreground disabled:opacity-30"
                onClick={() =>
                  setPage((p) => Math.min(totalPages - 1, p + 1))
                }
                disabled={page >= totalPages - 1}
              >
                다음
              </button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">종목</TableHead>
                {hasScaleSteps && (
                  <TableHead className="text-xs">유형</TableHead>
                )}
                <TableHead className="text-xs"><Term>매수</Term>일</TableHead>
                <TableHead className="text-xs text-right"><Term>매수</Term>가</TableHead>
                <TableHead className="text-xs"><Term>매도</Term>일</TableHead>
                <TableHead className="text-xs text-right"><Term>매도</Term>가</TableHead>
                <TableHead className="text-xs text-right">수량</TableHead>
                <TableHead className="text-xs text-right"><Term>손익</Term></TableHead>
                <TableHead className="text-xs text-right"><Term>수익률</Term></TableHead>
                <TableHead className="text-xs text-right">보유일</TableHead>
                {hasExitReason && (
                  <TableHead className="text-xs">매도 사유</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.map((t, i) => {
                const step = t.scale_step ? STEP_BADGE[t.scale_step] : null
                return (
                  <TableRow
                    key={`${t.symbol}-${t.entry_date}-${i}`}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setSelectedTrade(t)}
                  >
                    <TableCell className="text-xs font-medium">
                      {t.name ? (
                        <div>
                          <span>{t.name}</span>
                          <span className="ml-1 text-[10px] text-muted-foreground">
                            {t.symbol}
                          </span>
                        </div>
                      ) : (
                        t.symbol
                      )}
                    </TableCell>
                    {hasScaleSteps && (
                      <TableCell className="text-xs">
                        {step ? (
                          <Badge
                            variant={step.variant}
                            className="text-[9px] px-1.5 py-0"
                          >
                            {step.label}
                          </Badge>
                        ) : null}
                      </TableCell>
                    )}
                    <TableCell className="text-xs">{t.entry_date}</TableCell>
                    <TableCell className="text-xs text-right">
                      {t.entry_price.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-xs">{t.exit_date}</TableCell>
                    <TableCell className="text-xs text-right">
                      {t.exit_price?.toLocaleString() ?? "-"}
                    </TableCell>
                    <TableCell className="text-xs text-right">
                      {t.qty.toLocaleString()}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-xs text-right font-medium",
                        t.pnl >= 0 ? "text-red-500" : "text-blue-500",
                      )}
                    >
                      {t.pnl >= 0 ? "+" : ""}
                      {Math.round(t.pnl).toLocaleString()}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-xs text-right font-medium",
                        t.pnl_pct >= 0 ? "text-red-500" : "text-blue-500",
                      )}
                    >
                      {t.pnl_pct >= 0 ? "+" : ""}
                      {t.pnl_pct.toFixed(2)}%
                    </TableCell>
                    <TableCell className="text-xs text-right">
                      {t.holding_days}일
                    </TableCell>
                    {hasExitReason && (
                      <TableCell className="text-xs max-w-[160px] truncate text-muted-foreground">
                        {t.exit_reason || "-"}
                      </TableCell>
                    )}
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <BacktestTradeDetail
        trade={selectedTrade}
        open={!!selectedTrade}
        onOpenChange={(open) => {
          if (!open) setSelectedTrade(null)
        }}
      />
    </Card>
  )
}

export default BacktestTradeTable
