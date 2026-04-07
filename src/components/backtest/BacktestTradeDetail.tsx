import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { getLabel } from "@/lib/indicator-labels"
import { Term } from "@/components/ui/term"
import FactorVariableComparison from "./FactorVariableComparison"
import { TradeJournalChart } from "./BacktestRankingBoard"
import type { BacktestTrade, TradeConditionResult } from "@/types"

interface BacktestTradeDetailProps {
  trade: BacktestTrade | null
  open: boolean
  onOpenChange: (open: boolean) => void
  interval?: string
}

function BacktestTradeDetail({
  trade,
  open,
  onOpenChange,
  interval = "1d",
}: BacktestTradeDetailProps) {
  if (!trade) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>{trade.name || trade.symbol}</span>
            {trade.name && (
              <span className="text-xs font-normal text-muted-foreground">
                {trade.symbol}
              </span>
            )}
            {trade.scale_step && (
              <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                {trade.scale_step}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 text-sm">
          {/* 매매일지 차트 */}
          <TradeJournalChart trade={trade} interval={interval} />

          {/* 매매 요약 */}
          <Section title="매매 요약">
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
              <Row label="매수일" value={trade.entry_date} />
              <Row label="매도일" value={trade.exit_date || "-"} />
              <Row
                label="매수가"
                value={trade.entry_price.toLocaleString() + "원"}
              />
              <Row
                label="매도가"
                value={
                  trade.exit_price
                    ? trade.exit_price.toLocaleString() + "원"
                    : "-"
                }
              />
              <Row label="수량" value={trade.qty.toLocaleString() + "주"} />
              <Row label="보유일" value={trade.holding_days + "일"} />
              <Row
                label="손익"
                value={
                  (trade.pnl >= 0 ? "+" : "") +
                  Math.round(trade.pnl).toLocaleString() +
                  "원"
                }
                className={trade.pnl >= 0 ? "text-red-500" : "text-blue-500"}
              />
              <Row
                label="수익률"
                value={
                  (trade.pnl_pct >= 0 ? "+" : "") +
                  trade.pnl_pct.toFixed(2) +
                  "%"
                }
                className={
                  trade.pnl_pct >= 0 ? "text-red-500" : "text-blue-500"
                }
              />
              {trade.conviction != null && trade.conviction > 0 && (
                <Row
                  label={<><Term>확신도</Term></>}
                  value={trade.conviction.toFixed(2)}
                />
              )}
            </div>
          </Section>

          {/* 매수 이유 */}
          {trade.entry_reason && trade.entry_reason.length > 0 && (
            <Section title="매수 이유">
              <div className="space-y-1">
                {trade.entry_reason.map((r, i) => (
                  <ConditionRow key={i} result={r} />
                ))}
              </div>
            </Section>
          )}

          {/* 매도 이유 */}
          {(trade.exit_reason || trade.exit_reason_detail) && (
            <Section title="매도 이유">
              {trade.exit_reason && (
                <p className="text-xs mb-1.5">{trade.exit_reason}</p>
              )}
              {trade.exit_reason_detail &&
                trade.exit_reason_detail.length > 0 && (
                  <div className="space-y-1">
                    {trade.exit_reason_detail.map((r, i) => (
                      <ConditionRow key={i} result={r} />
                    ))}
                  </div>
                )}
            </Section>
          )}

          {/* 팩터 변수 비교 */}
          {(() => {
            const entryVars = trade.entry_snapshot?.factor_variables
            const exitVars = trade.exit_snapshot?.factor_variables
            const hasVars = (entryVars && typeof entryVars === "object" && Object.keys(entryVars).length > 0)
              || (exitVars && typeof exitVars === "object" && Object.keys(exitVars).length > 0)
            return hasVars ? (
              <FactorVariableComparison
                entrySnapshot={trade.entry_snapshot}
                exitSnapshot={trade.exit_snapshot}
              />
            ) : null
          })()}

          {/* 매수 시점 지표 */}
          {trade.entry_snapshot &&
            Object.keys(trade.entry_snapshot).length > 0 && (
              <Section title="매수 시점 지표">
                <SnapshotGrid snapshot={trade.entry_snapshot} />
              </Section>
            )}

          {/* 매도 시점 지표 */}
          {trade.exit_snapshot &&
            Object.keys(trade.exit_snapshot).length > 0 && (
              <Section title="매도 시점 지표">
                <SnapshotGrid snapshot={trade.exit_snapshot} />
              </Section>
            )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section>
      <h4 className="text-xs font-medium text-muted-foreground mb-2">
        {title}
      </h4>
      {children}
    </section>
  )
}

function Row({
  label,
  value,
  className,
}: {
  label: React.ReactNode
  value: string
  className?: string
}) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("font-medium", className)}>{value}</span>
    </div>
  )
}

function ConditionRow({ result }: { result: TradeConditionResult }) {
  return (
    <div className="flex items-center justify-between rounded bg-muted/30 px-2.5 py-1.5 text-xs">
      <span className="font-mono text-[11px]">{result.condition}</span>
      <div className="flex items-center gap-2">
        {result.actual != null && (
          <span className="text-muted-foreground">
            {typeof result.actual === "number"
              ? result.actual.toLocaleString(undefined, {
                  maximumFractionDigits: 2,
                })
              : String(result.actual)}
          </span>
        )}
        <Badge
          variant={result.met ? "default" : "outline"}
          className="text-[9px] px-1 py-0"
        >
          {result.met ? "충족" : "미충족"}
        </Badge>
      </div>
    </div>
  )
}

function SnapshotGrid({ snapshot }: { snapshot: Record<string, number | Record<string, number>> }) {
  const entries = Object.entries(snapshot).filter(
    ([, v]) => v != null && typeof v === "number",
  ) as [string, number][]
  if (!entries.length) return null
  return (
    <div className="grid grid-cols-2 gap-1">
      {entries.map(([key, val]) => (
        <div
          key={key}
          className="flex justify-between rounded bg-muted/20 px-2.5 py-1 text-xs font-mono"
        >
          <span className="text-muted-foreground">{getLabel(key)}</span>
          <span>
            {typeof val === "number"
              ? val.toLocaleString(undefined, { maximumFractionDigits: 2 })
              : val}
          </span>
        </div>
      ))}
    </div>
  )
}

export default BacktestTradeDetail
