import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { BacktestTrade } from "@/types"
import BacktestRankingBoard from "./BacktestRankingBoard"

interface BacktestAnalyticsProps {
  trades: BacktestTrade[] | null
  equityCurve: Array<{ date: string; equity: number }> | null
  interval?: string
}

// ── 종목별 수익률 랭킹 ──
function SymbolRanking({ trades }: { trades: BacktestTrade[] }) {
  const [showAll, setShowAll] = useState(false)

  const ranking = useMemo(() => {
    const map = new Map<string, { name: string; pnl: number; count: number; wins: number }>()
    for (const t of trades) {
      if (!t.exit_date) continue
      const key = t.symbol
      const prev = map.get(key) ?? { name: t.name || t.symbol, pnl: 0, count: 0, wins: 0 }
      prev.pnl += t.pnl
      prev.count += 1
      if (t.pnl >= 0) prev.wins += 1
      map.set(key, prev)
    }
    return [...map.entries()]
      .map(([symbol, d]) => ({ symbol, ...d, winRate: d.count > 0 ? (d.wins / d.count) * 100 : 0 }))
      .sort((a, b) => b.pnl - a.pnl)
  }, [trades])

  if (ranking.length === 0) return null
  const display = showAll ? ranking : ranking.slice(0, 10)
  const maxAbs = Math.max(...ranking.map((r) => Math.abs(r.pnl)), 1)

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">종목별 수익률 랭킹</CardTitle>
          {ranking.length > 10 && (
            <button
              className="text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setShowAll((v) => !v)}
            >
              {showAll ? "상위 10개만" : `전체 ${ranking.length}개`}
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-1">
        {display.map((r, i) => (
          <div key={r.symbol} className="flex items-center gap-2 text-xs">
            <span className="w-5 shrink-0 text-muted-foreground text-right">{i + 1}</span>
            <span className="w-20 shrink-0 truncate font-medium">{r.name}</span>
            <span className="w-12 shrink-0 text-muted-foreground text-right">{r.count}건</span>
            <div className="flex-1 h-4 relative">
              <div
                className={cn(
                  "absolute top-0 h-full rounded-sm",
                  r.pnl >= 0 ? "bg-red-500/20" : "bg-blue-500/20",
                )}
                style={{
                  width: `${Math.min(100, (Math.abs(r.pnl) / maxAbs) * 100)}%`,
                  left: r.pnl >= 0 ? "0" : undefined,
                  right: r.pnl < 0 ? "0" : undefined,
                }}
              />
            </div>
            <span
              className={cn(
                "w-24 shrink-0 text-right font-medium",
                r.pnl >= 0 ? "text-red-500" : "text-blue-500",
              )}
            >
              {r.pnl >= 0 ? "+" : ""}
              {Math.round(r.pnl).toLocaleString()}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

// ── 월별 수익률 테이블 ──
function MonthlyReturns({ equityCurve }: { equityCurve: Array<{ date: string; equity: number }> }) {
  const monthly = useMemo(() => {
    if (equityCurve.length < 2) return []
    const map = new Map<string, { start: number; end: number }>()
    for (const p of equityCurve) {
      const month = p.date.slice(0, 7) // "2024-01"
      const entry = map.get(month)
      if (!entry) {
        map.set(month, { start: p.equity, end: p.equity })
      } else {
        entry.end = p.equity
      }
    }
    return [...map.entries()].map(([month, { start, end }]) => ({
      month,
      returnPct: ((end - start) / start) * 100,
    }))
  }, [equityCurve])

  if (monthly.length === 0) return null

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">월별 수익률</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-6">
          {monthly.map((m) => (
            <div
              key={m.month}
              className={cn(
                "rounded px-2 py-1.5 text-center text-xs",
                m.returnPct > 0 && "bg-red-50 text-red-600",
                m.returnPct < 0 && "bg-blue-50 text-blue-600",
                m.returnPct === 0 && "bg-gray-50 text-gray-500",
              )}
            >
              <div className="text-[10px] text-muted-foreground">{m.month}</div>
              <div className="font-semibold">
                {m.returnPct > 0 ? "+" : ""}
                {m.returnPct.toFixed(1)}%
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// ── 손익 분포 히스토그램 (클릭 확장) ──
function PnlDistribution({ trades }: { trades: BacktestTrade[] }) {
  const [selectedBin, setSelectedBin] = useState<{ from: number; to: number } | null>(null)

  const closedTrades = useMemo(() => trades.filter((t) => t.exit_date), [trades])

  const bins = useMemo(() => {
    if (closedTrades.length === 0) return []

    const pcts = closedTrades.map((t) => t.pnl_pct)
    const min = Math.floor(Math.min(...pcts))
    const max = Math.ceil(Math.max(...pcts))

    const range = max - min
    const binSize = range <= 10 ? 1 : range <= 30 ? 2 : range <= 60 ? 5 : 10
    const bins: { label: string; from: number; to: number; count: number }[] = []

    for (let start = Math.floor(min / binSize) * binSize; start <= max; start += binSize) {
      bins.push({ label: `${start}~${start + binSize}%`, from: start, to: start + binSize, count: 0 })
    }

    for (const pct of pcts) {
      const idx = bins.findIndex((b) => pct >= b.from && pct < b.to)
      if (idx >= 0) bins[idx].count += 1
      else if (bins.length > 0) bins[bins.length - 1].count += 1
    }

    return bins.filter((b) => b.count > 0)
  }, [closedTrades])

  const selectedTrades = useMemo(() => {
    if (!selectedBin) return []
    return closedTrades
      .filter((t) => t.pnl_pct >= selectedBin.from && t.pnl_pct < selectedBin.to)
      .sort((a, b) => b.pnl_pct - a.pnl_pct)
  }, [closedTrades, selectedBin])

  if (bins.length === 0) return null
  const maxCount = Math.max(...bins.map((b) => b.count), 1)

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">손익 분포</CardTitle>
          {selectedBin && (
            <button
              className="text-[10px] text-muted-foreground hover:text-foreground"
              onClick={() => setSelectedBin(null)}
            >
              닫기
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="space-y-0.5">
          {bins.map((b) => {
            const isSelected = selectedBin?.from === b.from && selectedBin?.to === b.to
            return (
              <div
                key={b.label}
                className={cn(
                  "flex items-center gap-2 text-xs cursor-pointer rounded px-1 -mx-1 transition-colors",
                  isSelected ? "bg-muted" : "hover:bg-muted/50",
                )}
                onClick={() => setSelectedBin(isSelected ? null : { from: b.from, to: b.to })}
              >
                <span className="w-20 shrink-0 text-right text-muted-foreground">{b.label}</span>
                <div className="flex-1 h-5 relative">
                  <div
                    className={cn(
                      "absolute top-0 h-full rounded-sm",
                      b.from >= 0 ? "bg-red-400/40" : "bg-blue-400/40",
                    )}
                    style={{ width: `${(b.count / maxCount) * 100}%` }}
                  />
                  <span className="absolute left-1 top-0.5 text-[10px] text-foreground/70">
                    {b.count}
                  </span>
                </div>
            </div>
          )})}
        </div>

        {/* 선택된 구간의 매매 목록 */}
        {selectedBin && selectedTrades.length > 0 && (
          <div className="border-t pt-2 space-y-1">
            <div className="text-[10px] font-medium text-muted-foreground">
              {selectedBin.from}~{selectedBin.to}% 구간 ({selectedTrades.length}건)
            </div>
            <div className="max-h-64 overflow-y-auto space-y-0.5">
            {selectedTrades.map((t, i) => (
              <div key={i} className="flex items-center text-[11px] gap-2">
                <span className="font-medium truncate flex-1">{t.name || t.symbol}</span>
                <span className="text-muted-foreground">{t.entry_date?.slice(5, 10)}→{t.exit_date?.slice(5, 10)}</span>
                <span className={cn("font-medium w-14 text-right", t.pnl_pct >= 0 ? "text-red-500" : "text-blue-500")}>
                  {t.pnl_pct >= 0 ? "+" : ""}{t.pnl_pct.toFixed(1)}%
                </span>
                <span className={cn("w-20 text-right", t.pnl >= 0 ? "text-red-500" : "text-blue-500")}>
                  {t.pnl >= 0 ? "+" : ""}{Math.round(t.pnl).toLocaleString()}
                </span>
              </div>
            ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ── Drawdown 차트 (텍스트 기반) ──
function DrawdownSummary({ equityCurve }: { equityCurve: Array<{ date: string; equity: number }> }) {
  const drawdowns = useMemo(() => {
    if (equityCurve.length < 2) return []
    let peak = equityCurve[0].equity
    const dd: { date: string; pct: number }[] = []
    for (const p of equityCurve) {
      if (p.equity > peak) peak = p.equity
      const pct = ((p.equity - peak) / peak) * 100
      dd.push({ date: p.date, pct })
    }

    // 상위 5개 drawdown 구간 찾기
    const periods: { start: string; end: string; depth: number; days: number }[] = []
    let inDd = false
    let start = ""
    let minPct = 0

    for (let i = 0; i < dd.length; i++) {
      if (dd[i].pct < -0.1 && !inDd) {
        inDd = true
        start = dd[i].date
        minPct = dd[i].pct
      } else if (inDd) {
        if (dd[i].pct < minPct) minPct = dd[i].pct
        if (dd[i].pct >= -0.1 || i === dd.length - 1) {
          inDd = false
          const startDate = new Date(start)
          const endDate = new Date(dd[i].date)
          const days = Math.round((endDate.getTime() - startDate.getTime()) / 86400000)
          periods.push({ start, end: dd[i].date, depth: minPct, days })
          minPct = 0
        }
      }
    }

    return periods.sort((a, b) => a.depth - b.depth).slice(0, 5)
  }, [equityCurve])

  if (drawdowns.length === 0) return null

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">주요 Drawdown 구간</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1.5">
          {drawdowns.map((d, i) => (
            <div key={i} className="flex items-center gap-3 text-xs">
              <span className="w-4 text-muted-foreground">{i + 1}</span>
              <span className="font-medium text-blue-500 w-16">{d.depth.toFixed(1)}%</span>
              <span className="text-muted-foreground">
                {d.start.slice(0, 10)} ~ {d.end.slice(0, 10)}
              </span>
              <span className="text-muted-foreground">({d.days}일)</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function BacktestAnalytics({ trades, equityCurve, interval }: BacktestAnalyticsProps) {
  if (!trades?.length && !equityCurve?.length) return null

  return (
    <div className="space-y-4">
      {/* 상단 2열: 랭킹보드 + 손익 분포 */}
      <div className="grid gap-4 lg:grid-cols-2">
        {trades && trades.length > 0 && (
          <BacktestRankingBoard trades={trades} interval={interval} />
        )}
        {trades && trades.length > 0 && <PnlDistribution trades={trades} />}
      </div>
      {/* 하단 2열: 월별 수익률 + Drawdown */}
      <div className="grid gap-4 lg:grid-cols-2">
        {equityCurve && equityCurve.length > 0 && <MonthlyReturns equityCurve={equityCurve} />}
        {equityCurve && equityCurve.length > 0 && <DrawdownSummary equityCurve={equityCurve} />}
      </div>
    </div>
  )
}

export default BacktestAnalytics
