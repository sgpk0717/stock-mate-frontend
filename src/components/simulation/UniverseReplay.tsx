import { useCallback, useEffect, useRef, useState } from "react"
import { Check, ChevronsUpDown, Play, Square, TrendingDown, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8007"

interface TickSummary {
  bar: number
  total_bars: number
  dt: string
  scored_count: number
  buy_signals: number
  sell_signals: number
  top_buy: { symbol: string; name: string; score: number }[]
  top_sell: { symbol: string; name: string; score: number }[]
  positions_count: number
  positions_symbols: { symbol: string; name: string; qty: number; pnl_pct: number }[]
  cash: number
  total_eval: number
  pnl_pct: number
  drawdown_pct: number
  trades_this_bar: { symbol: string; name: string; side: string; price: number; pnl_pct?: number }[]
}

interface DoneData {
  total_bars: number
  total_trades: number
  total_decisions: number
  final_equity: number
  pnl_pct: number
  positions_remaining: number
  equity_curve: { dt: string; equity: number }[]
  trade_log: { dt: string; symbol: string; name: string; side: string; qty: number; price: number; pnl_pct?: number; reason: string }[]
  decisions: Record<string, unknown>[]
  factor_id: string
  factor_name: string
  universe: string
  interval: string
}

interface HistoryItem {
  id: string
  mode: string
  universe: string | null
  strategy_preset: string
  factor_id: string | null
  interval: string
  total_bars: number
  total_trades: number | null
  pnl_pct: number | null
  final_equity: number | null
  created_at: string
}

interface AlphaFactorOption {
  id: string
  name: string
  expression_str: string
  hypothesis: string
  ic_mean: number
  icir: number
  sharpe: number
  max_drawdown: number
  turnover: number
  interval: string
  causal_robust: boolean | null
  birth_generation: number
  created_at: string
}

export default function UniverseReplay() {
  const [factorId, setFactorId] = useState("")
  const [factors, setFactors] = useState<AlphaFactorOption[]>([])
  const [interval, setInterval] = useState("5m")
  const [speed, setSpeed] = useState(0.05)
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10))
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10))
  const [factorOpen, setFactorOpen] = useState(false)
  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState("")
  const [progressPct, setProgressPct] = useState(0)

  const [latestTick, setLatestTick] = useState<TickSummary | null>(null)
  const [tradeHistory, setTradeHistory] = useState<TickSummary["trades_this_bar"]>([])
  const [equityCurve, setEquityCurve] = useState<{ dt: string; pnl_pct: number }[]>([])
  const [tickSummaries, setTickSummaries] = useState<TickSummary[]>([])
  const [doneData, setDoneData] = useState<DoneData | null>(null)
  const [savedRunId, setSavedRunId] = useState<string | null>(null)
  const [history, setHistory] = useState<HistoryItem[]>([])

  const esRef = useRef<EventSource | null>(null)
  const tickSummariesRef = useRef<TickSummary[]>([])

  // 히스토리 로드
  const loadHistory = useCallback(() => {
    fetch(`${API_URL}/sim-replay/runs?mode=universe&limit=20`)
      .then((r) => r.json())
      .then((d) => setHistory(d?.items ?? []))
      .catch(() => {})
  }, [])

  useEffect(() => { loadHistory() }, [loadHistory])

  // 팩터 목록 로드: IC 상위 + validated + 활성 세션 팩터
  useEffect(() => {
    const mapFactor = (f: Record<string, unknown>) => ({
      id: f.id as string,
      name: (f.name as string) || "?",
      expression_str: (f.expression_str as string) || "",
      hypothesis: (f.hypothesis as string) || "",
      ic_mean: (f.ic_mean as number) || 0,
      icir: (f.icir as number) || 0,
      sharpe: (f.sharpe as number) || 0,
      max_drawdown: (f.max_drawdown as number) || 0,
      turnover: (f.turnover as number) || 0,
      interval: (f.interval as string) || "5m",
      causal_robust: (f.causal_robust as boolean | null) ?? null,
      birth_generation: (f.birth_generation as number) || 0,
      created_at: (f.created_at as string) || "",
    })

    Promise.all([
      fetch(`${API_URL}/alpha/factors?limit=200&sort_by=ic_mean&interval=${interval}`).then((r) => r.json()),
      // 활성 세션에서 사용 중인 팩터 ID 조회
      fetch(`${API_URL}/trading/status`).then((r) => r.json()).catch(() => []),
    ]).then(async ([factorData, sessions]) => {
      const items = Array.isArray(factorData) ? factorData : factorData?.items ?? []
      const seen = new Set<string>()
      const merged: AlphaFactorOption[] = []

      for (const f of items) {
        const id = f.id as string
        if (!seen.has(id)) {
          seen.add(id)
          merged.push(mapFactor(f))
        }
      }

      // 활성 세션 팩터 ID 추출 → 개별 조회해서 추가
      const sessionFactorIds: string[] = []
      if (Array.isArray(sessions)) {
        for (const s of sessions) {
          const fid = (s as Record<string, unknown>)?.strategy_name
          if (typeof fid === "string" && fid.startsWith("auto:")) {
            // strategy에서 factor_id 추출 (context에서)
          }
        }
      }
      // 활성 컨텍스트에서 factor_id 직접 조회
      try {
        const ctxRes = await fetch(`${API_URL}/trading/contexts`)
        const ctxData = await ctxRes.json()
        const ctxList = Array.isArray(ctxData) ? ctxData : ctxData?.items ?? []
        for (const ctx of ctxList) {
          const fid = (ctx as Record<string, unknown>)?.source_factor_id ||
                      ((ctx as Record<string, unknown>)?.strategy as Record<string, unknown>)?.factor_id
          if (typeof fid === "string" && fid && !seen.has(fid)) {
            sessionFactorIds.push(fid)
          }
        }
      } catch { /* ignore */ }

      // 활성 세션 팩터 개별 조회
      for (const fid of sessionFactorIds) {
        try {
          const r = await fetch(`${API_URL}/alpha/factor/${fid}`)
          if (r.ok) {
            const f = await r.json()
            if (!seen.has(f.id)) {
              seen.add(f.id)
              merged.unshift(mapFactor(f)) // 맨 앞에 추가
            }
          }
        } catch { /* ignore */ }
      }

      if (merged.length > 0) setFactors(merged)
    }).catch(() => {})
  }, [interval])

  // 인터벌별 팩터 필터링
  const filteredFactors = factors

  // 팩터 선택 시 유니버스 자동 세팅 (팩터 발굴 시 사용한 유니버스)
  const selectedFactor = factors.find((f) => f.id === factorId)

  const start = useCallback(() => {
    if (!factorId) return

    setRunning(true)
    setLatestTick(null)
    setTradeHistory([])
    setEquityCurve([])
    setTickSummaries([])
    tickSummariesRef.current = []
    setDoneData(null)
    setSavedRunId(null)
    setProgress("연결 중...")
    setProgressPct(0)

    const params = new URLSearchParams({
      factor_id: factorId,
      speed: String(speed),
      start_date: startDate,
      end_date: endDate,
      interval,
      universe: "KOSPI200",
    })

    const es = new EventSource(`${API_URL}/sim-replay/stream-universe?${params}`)
    esRef.current = es

    es.addEventListener("start", (e) => {
      const d = JSON.parse(e.data)
      setProgress(`${d.universe} ${d.symbols_count}종목 · ${d.factor_name}`)
    })

    es.addEventListener("progress", (e) => {
      const d = JSON.parse(e.data)
      setProgress(d.stage)
      setProgressPct(d.pct || 0)
    })

    es.addEventListener("tick_summary", (e) => {
      const d: TickSummary = JSON.parse(e.data)
      setLatestTick(d)
      setProgressPct(Math.round((d.bar / d.total_bars) * 100))
      setTickSummaries((prev) => [...prev, d])
      tickSummariesRef.current = [...tickSummariesRef.current, d]

      if (d.trades_this_bar.length > 0) {
        setTradeHistory((prev) => [...prev, ...d.trades_this_bar].slice(-50))
      }

      setEquityCurve((prev) => [
        ...prev,
        { dt: d.dt, pnl_pct: d.pnl_pct },
      ])
    })

    es.addEventListener("done", (e) => {
      const d: DoneData = JSON.parse(e.data)
      setDoneData(d)
      setRunning(false)
      setProgressPct(100)
      setProgress("완료")
      es.close()

      // 자동 저장
      fetch(`${API_URL}/sim-replay/runs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "universe",
          symbol: "",
          interval: d.interval || interval,
          strategy_preset: `alpha:${(d.factor_id || factorId).slice(0, 8)}`,
          factor_id: d.factor_id || factorId,
          data_source: "real",
          universe: d.universe || "KOSPI200",
          config: { speed, startDate, endDate, factorId, interval },
          total_bars: d.total_bars,
          total_events: d.total_decisions || 0,
          total_trades: d.total_trades,
          pnl: null,
          pnl_pct: d.pnl_pct,
          final_equity: d.final_equity,
          events: [],
          final_state: { equity: d.final_equity, positions_remaining: d.positions_remaining },
          tick_summaries: tickSummariesRef.current,
          trade_log: d.trade_log,
          decisions: d.decisions,
          equity_curve: d.equity_curve,
        }),
      })
        .then((r) => r.json())
        .then((res) => {
          if (res.id) {
            setSavedRunId(res.id)
            loadHistory()
          }
        })
        .catch(() => {})
    })

    es.addEventListener("error", (e) => {
      try {
        const d = JSON.parse((e as MessageEvent).data)
        setProgress(`오류: ${d.message}`)
      } catch {
        setProgress("연결 종료")
      }
      setRunning(false)
      es.close()
    })

    es.onerror = () => {
      setRunning(false)
      es.close()
    }
  }, [factorId, speed, startDate, endDate])

  const stop = useCallback(() => {
    esRef.current?.close()
    setRunning(false)
  }, [])

  const tick = latestTick

  return (
    <div className="space-y-4">
      {/* 설정 패널 */}
      <Card>
        <CardContent className="pt-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
            <div>
              <Label className="text-xs">인터벌</Label>
              <Select value={interval} onValueChange={(v) => { setInterval(v); setFactorId("") }}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1m">1분</SelectItem>
                  <SelectItem value="5m">5분</SelectItem>
                  <SelectItem value="15m">15분</SelectItem>
                  <SelectItem value="1h">1시간</SelectItem>
                  <SelectItem value="1d">일봉</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="lg:col-span-2">
              <Label className="text-xs">알파 팩터 ({filteredFactors.length}개)</Label>
              <Popover open={factorOpen} onOpenChange={setFactorOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={factorOpen}
                    className="h-8 w-full justify-between text-xs font-normal"
                  >
                    {selectedFactor
                      ? `${selectedFactor.name} (IC=${selectedFactor.ic_mean.toFixed(3)})`
                      : "팩터 검색..."}
                    <ChevronsUpDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0" align="start">
                  <Command filter={(value, search) => {
                    if (!search) return 1
                    const lower = search.toLowerCase()
                    return value.toLowerCase().includes(lower) ? 1 : 0
                  }}>
                    <CommandInput placeholder="이름/수식/IC 검색, 또는 UUID 직접 입력" className="text-xs" />
                    <CommandList>
                      <CommandEmpty>
                        <div className="p-2 text-center text-xs text-gray-400">
                          <p>검색 결과 없음</p>
                          <p className="mt-1">팩터 ID(UUID)를 직접 입력하세요:</p>
                          <input
                            className="mt-1 w-full rounded border px-2 py-1 text-xs"
                            placeholder="예: 9964c9c0-71d6-..."
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                const v = (e.target as HTMLInputElement).value.trim()
                                if (v.length >= 8) {
                                  setFactorId(v)
                                  setFactorOpen(false)
                                  // 개별 조회
                                  fetch(`${API_URL}/alpha/factor/${v}`)
                                    .then((r) => r.ok ? r.json() : null)
                                    .then((f) => {
                                      if (f && !factors.find((x) => x.id === f.id)) {
                                        setFactors((prev) => [{
                                          id: f.id, name: f.name || "?",
                                          expression_str: f.expression_str || "",
                                          hypothesis: f.hypothesis || "",
                                          ic_mean: f.ic_mean || 0, icir: f.icir || 0,
                                          sharpe: f.sharpe || 0, max_drawdown: f.max_drawdown || 0,
                                          turnover: f.turnover || 0, interval: f.interval || "5m",
                                          causal_robust: f.causal_robust ?? null,
                                          birth_generation: f.birth_generation || 0,
                                          created_at: f.created_at || "",
                                        }, ...prev])
                                      }
                                    })
                                    .catch(() => {})
                                }
                              }
                            }}
                          />
                        </div>
                      </CommandEmpty>
                      <CommandGroup>
                        {filteredFactors.map((f) => (
                          <CommandItem
                            key={f.id}
                            value={`${f.name} ${f.expression_str} ${f.ic_mean}`}
                            onSelect={() => {
                              setFactorId(f.id)
                              setFactorOpen(false)
                            }}
                            className="text-xs"
                          >
                            <Check className={cn("mr-1 h-3 w-3", factorId === f.id ? "opacity-100" : "opacity-0")} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1">
                                <span className="font-medium">{f.name}</span>
                                <span className="text-gray-400">gen {f.birth_generation}</span>
                                {f.causal_robust === true && (
                                  <Badge variant="outline" className="text-[9px] px-1 py-0 h-4">인과</Badge>
                                )}
                              </div>
                              <div className="flex gap-2 text-[10px] text-gray-400">
                                <span>IC={f.ic_mean.toFixed(3)}</span>
                                <span>Sh={f.sharpe.toFixed(1)}</span>
                                <span>MDD={(f.max_drawdown * 100).toFixed(0)}%</span>
                                <span className="truncate max-w-[180px]">{f.expression_str}</span>
                              </div>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label className="text-xs">시작일</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                className="h-8 text-xs" />
            </div>
            <div>
              <Label className="text-xs">속도 (초/봉)</Label>
              <Input type="number" value={speed} onChange={(e) => setSpeed(Number(e.target.value))}
                min={0.01} max={2} step={0.01} className="h-8 text-xs" />
            </div>
            <div className="flex items-end">
              {running ? (
                <Button size="sm" variant="destructive" onClick={stop} className="w-full">
                  <Square className="mr-1 h-3 w-3" /> 중지
                </Button>
              ) : (
                <Button size="sm" onClick={start} disabled={!factorId} className="w-full">
                  <Play className="mr-1 h-3 w-3" /> 시작
                </Button>
              )}
            </div>
          </div>

          {/* 선택된 팩터 상세 */}
          {selectedFactor && (
            <div className="mt-3 rounded-lg border bg-gray-50 p-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-900">
                    {selectedFactor.name}
                    <span className="ml-2 text-gray-400">gen {selectedFactor.birth_generation}</span>
                  </p>
                  <p className="mt-0.5 font-mono text-[10px] text-gray-500 leading-tight max-w-lg truncate">
                    {selectedFactor.expression_str}
                  </p>
                  {selectedFactor.hypothesis && (
                    <p className="mt-1 text-[10px] text-gray-400 max-w-lg truncate">
                      {selectedFactor.hypothesis.split("\n")[0]}
                    </p>
                  )}
                </div>
                <div className="flex gap-3 text-[10px] text-gray-500 shrink-0">
                  <div className="text-center">
                    <p className="font-semibold text-gray-900">{selectedFactor.ic_mean.toFixed(4)}</p>
                    <p>IC</p>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-gray-900">{selectedFactor.sharpe.toFixed(2)}</p>
                    <p>Sharpe</p>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-gray-900">{selectedFactor.icir.toFixed(2)}</p>
                    <p>ICIR</p>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-gray-900">{(selectedFactor.max_drawdown * 100).toFixed(1)}%</p>
                    <p>MDD</p>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-gray-900">
                      {selectedFactor.causal_robust === true ? "✓" : selectedFactor.causal_robust === false ? "✗" : "-"}
                    </p>
                    <p>인과</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* 프로그레스 */}
          {(running || progressPct > 0) && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{progress}</span>
                <span>{progressPct}%</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {tick && (
        <>
          {/* 요약 카드 */}
          <div className="grid gap-2 grid-cols-2 sm:grid-cols-4 lg:grid-cols-6">
            <StatCard label="봉" value={`${tick.bar + 1}/${tick.total_bars}`} />
            <StatCard label="시각" value={tick.dt.split(" ")[1] || tick.dt} />
            <StatCard label="보유" value={`${tick.positions_count}/10`} />
            <StatCard
              label="PnL"
              value={`${tick.pnl_pct >= 0 ? "+" : ""}${tick.pnl_pct.toFixed(2)}%`}
              color={tick.pnl_pct >= 0 ? "text-red-600" : "text-blue-600"}
            />
            <StatCard label="DD" value={`-${tick.drawdown_pct.toFixed(1)}%`} />
            <StatCard label="현금" value={`${(tick.cash / 1e6).toFixed(0)}M`} />
          </div>

          {/* 메인 2컬럼 */}
          <div className="grid gap-4 lg:grid-cols-2">
            {/* 랭킹 */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">매수 임박 TOP 5</CardTitle>
              </CardHeader>
              <CardContent>
                <RankingTable items={tick.top_buy} type="buy" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">매도 임박 TOP 5</CardTitle>
              </CardHeader>
              <CardContent>
                <RankingTable items={tick.top_sell} type="sell" />
              </CardContent>
            </Card>
          </div>

          {/* 보유 포지션 */}
          {tick.positions_symbols.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">보유 포지션 ({tick.positions_count})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {tick.positions_symbols.map((p) => (
                    <Badge
                      key={p.symbol}
                      variant={p.pnl_pct >= 0 ? "default" : "destructive"}
                      className="text-xs"
                    >
                      {p.name} {p.qty}주 {p.pnl_pct >= 0 ? "+" : ""}{p.pnl_pct.toFixed(1)}%
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 매매 타임라인 */}
          {tradeHistory.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">매매 기록 ({tradeHistory.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-40 overflow-auto">
                  <div className="space-y-1">
                    {tradeHistory.slice().reverse().map((t, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        {t.side === "BUY" ? (
                          <TrendingUp className="h-3 w-3 text-red-500" />
                        ) : (
                          <TrendingDown className="h-3 w-3 text-blue-500" />
                        )}
                        <span className={t.side === "BUY" ? "text-red-600" : "text-blue-600"}>
                          {t.side}
                        </span>
                        <span className="font-medium">{t.name}</span>
                        <span className="text-gray-400">{Number(t.price).toLocaleString()}원</span>
                        {t.pnl_pct !== undefined && t.pnl_pct !== null && (
                          <span className={t.pnl_pct >= 0 ? "text-red-500" : "text-blue-500"}>
                            {t.pnl_pct >= 0 ? "+" : ""}{t.pnl_pct.toFixed(1)}%
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* PnL 곡선 (간단 텍스트) */}
          {equityCurve.length > 5 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">PnL 추이</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex h-16 items-end gap-px">
                  {equityCurve.map((p, i) => {
                    const maxAbs = Math.max(...equityCurve.map((e) => Math.abs(e.pnl_pct)), 0.01)
                    const h = Math.abs(p.pnl_pct) / maxAbs * 100
                    return (
                      <div
                        key={i}
                        className={`flex-1 rounded-t ${p.pnl_pct >= 0 ? "bg-red-400" : "bg-blue-400"}`}
                        style={{ height: `${Math.max(h, 2)}%` }}
                        title={`${p.dt}: ${p.pnl_pct.toFixed(2)}%`}
                      />
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* 완료 결과 */}
      {doneData && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">
              시뮬레이션 완료
              {savedRunId && <span className="ml-2 text-xs text-gray-400">저장됨</span>}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>총 {doneData.total_bars}봉, {doneData.total_trades}건 매매</p>
            <p>
              최종 자산: {doneData.final_equity.toLocaleString()}원
              (<span className={doneData.pnl_pct >= 0 ? "text-red-600" : "text-blue-600"}>
                {doneData.pnl_pct >= 0 ? "+" : ""}{doneData.pnl_pct.toFixed(2)}%
              </span>)
            </p>
          </CardContent>
        </Card>
      )}

      {/* 히스토리 */}
      {history.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">유니버스 리플레이 히스토리 ({history.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {history.map((h) => (
                <div
                  key={h.id}
                  className="group flex cursor-pointer items-center justify-between rounded-lg border px-3 py-2 text-xs hover:bg-gray-50"
                  onClick={async () => {
                    try {
                      const res = await fetch(`${API_URL}/sim-replay/runs/${h.id}`)
                      const data = await res.json()
                      // 상태 복원
                      setTickSummaries(data.tick_summaries || [])
                      tickSummariesRef.current = data.tick_summaries || []
                      setTradeHistory(
                        (data.trade_log || []).map((t: Record<string, unknown>) => ({
                          symbol: t.symbol, name: t.name, side: t.side,
                          price: t.price, pnl_pct: t.pnl_pct,
                        }))
                      )
                      setEquityCurve(
                        (data.equity_curve || []).map((e: Record<string, unknown>) => ({
                          dt: e.dt as string, pnl_pct: ((e.equity as number) / 100_000_000 - 1) * 100,
                        }))
                      )
                      // 마지막 tick을 latestTick으로
                      const ticks = data.tick_summaries || []
                      if (ticks.length > 0) {
                        setLatestTick(ticks[ticks.length - 1])
                      }
                      setDoneData({
                        total_bars: data.total_bars,
                        total_trades: data.total_trades || 0,
                        total_decisions: data.total_events || 0,
                        final_equity: data.final_equity || 0,
                        pnl_pct: data.pnl_pct || 0,
                        positions_remaining: 0,
                        equity_curve: data.equity_curve || [],
                        trade_log: data.trade_log || [],
                        decisions: data.decisions || [],
                        factor_id: data.factor_id || "",
                        factor_name: data.strategy_preset || "",
                        universe: data.universe || "",
                        interval: data.interval || "5m",
                      })
                      setProgressPct(100)
                      setProgress("히스토리 로드")
                      setSavedRunId(data.id)
                    } catch { /* ignore */ }
                  }}
                >
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] px-1">{h.universe || "?"}</Badge>
                    <span className="font-medium">{h.strategy_preset}</span>
                    <Badge variant="outline" className="text-[10px] px-1">{h.interval}</Badge>
                    <span className="text-gray-400">{h.total_bars}봉</span>
                    {h.total_trades != null && (
                      <span className="text-gray-400">{h.total_trades}건</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={
                      h.pnl_pct != null && h.pnl_pct >= 0 ? "text-red-500" : "text-blue-500"
                    }>
                      {h.pnl_pct != null
                        ? `${h.pnl_pct >= 0 ? "+" : ""}${h.pnl_pct.toFixed(2)}%`
                        : "-"}
                    </span>
                    <span className="text-gray-400">
                      {new Date(h.created_at).toLocaleString("ko-KR", {
                        month: "short", day: "numeric",
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </span>
                    <button
                      className="text-gray-400 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-opacity"
                      onClick={async (e) => {
                        e.stopPropagation()
                        await fetch(`${API_URL}/sim-replay/runs/${h.id}`, { method: "DELETE" })
                        loadHistory()
                      }}
                    >
                      <Square className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="rounded-lg border bg-white p-2">
      <p className="text-[10px] text-gray-500">{label}</p>
      <p className={`text-sm font-semibold tabular-nums ${color || "text-gray-900"}`}>{value}</p>
    </div>
  )
}

function RankingTable({
  items,
  type,
}: {
  items: { symbol: string; name: string; score: number }[]
  type: "buy" | "sell"
}) {
  if (!items.length) return <p className="py-2 text-center text-xs text-gray-400">데이터 없음</p>

  return (
    <table className="w-full text-xs">
      <thead>
        <tr className="text-gray-500">
          <th className="w-6 py-1 text-center">#</th>
          <th className="py-1 text-left">종목</th>
          <th className="py-1 text-right">스코어</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item, i) => (
          <tr key={item.symbol} className="border-t">
            <td className="py-1 text-center text-gray-400">{i + 1}</td>
            <td className="py-1">
              <span className="font-medium">{item.name}</span>
              <span className="ml-1 text-gray-400">{item.symbol}</span>
            </td>
            <td className={`py-1 text-right tabular-nums font-medium ${
              type === "buy"
                ? item.score >= 0.7 ? "text-red-600" : "text-gray-600"
                : item.score <= 0.3 ? "text-blue-600" : "text-gray-600"
            }`}>
              {item.score.toFixed(3)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
