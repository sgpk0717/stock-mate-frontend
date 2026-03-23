import { useCallback, useEffect, useRef, useState } from "react"
import {
  AlertTriangle, Check, Clock, DollarSign, Play, RefreshCw,
  Send, SkipForward, Square, TrendingUp, X, XCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip"
import Markdown from "react-markdown"
import remarkGfm from "remark-gfm"
import CandleChart from "@/components/chart/CandleChart"
import StockSearch from "@/components/stock/StockSearch"
import UniverseReplayPanel from "@/components/simulation/UniverseReplay"
import type { CandleData } from "@/types"
import type { SeriesMarker, Time } from "lightweight-charts"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8007"

const EVENT_CONFIG: Record<string, { color: string; icon: typeof TrendingUp; label: string }> = {
  SIGNAL: { color: "bg-blue-500/20 text-blue-400", icon: TrendingUp, label: "시그널" },
  SUBMIT: { color: "bg-yellow-500/20 text-yellow-400", icon: Send, label: "주문" },
  FILL: { color: "bg-green-500/20 text-green-400", icon: Check, label: "체결" },
  PARTIAL: { color: "bg-orange-500/20 text-orange-400", icon: Clock, label: "부분" },
  EXPIRE: { color: "bg-red-500/20 text-red-400", icon: XCircle, label: "만료" },
  CANCEL: { color: "bg-gray-500/20 text-gray-400", icon: X, label: "취소" },
  REORDER: { color: "bg-purple-500/20 text-purple-400", icon: RefreshCw, label: "재주문" },
  RISK: { color: "bg-red-500/20 text-red-400", icon: AlertTriangle, label: "리스크" },
  SKIP: { color: "bg-gray-500/20 text-gray-400", icon: SkipForward, label: "스킵" },
  SETTLED: { color: "bg-green-500/20 text-green-400", icon: DollarSign, label: "청산" },
}

interface DecisionEvent { bar: number; type: string; symbol: string; detail: string }
interface SimState {
  cash: number
  positions: Record<string, { qty: number; avg_price: number }>
  pending_orders: number; total_eval: number; pnl: number; pnl_pct: number
}
interface StrategyOption { id: string; name: string; description: string }
interface AlphaFactorOption { id: string; name: string; ic_mean: number; sharpe: number; interval: string }

interface HistoryItem {
  id: string; symbol: string; interval: string; strategy_preset: string
  data_source: string; total_bars: number; total_events: number
  pnl: number | null; pnl_pct: number | null; has_analysis: boolean
  created_at: string
}

type StrategyType = "preset" | "alpha" | "custom"

function dateToUTC(s: string): number { return Math.floor(new Date(s).getTime() / 1000) }
function formatKRW(n: number): string {
  if (Math.abs(n) >= 1e8) return `${(n / 1e8).toFixed(1)}억`
  if (Math.abs(n) >= 1e4) return `${(n / 1e4).toFixed(0)}만`
  return n.toLocaleString()
}
function todayStr(): string { return new Date().toISOString().slice(0, 10) }

function Tip({ children, text }: { children: React.ReactNode; text: string }) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent side="top" className="max-w-[200px] text-xs">{text}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export default function SimReplayPage() {
  // 모드 전환 (단일종목 vs 유니버스)
  const [replayMode, setReplayMode] = useState<"single" | "universe">("single")

  // 공통
  const [symbol, setSymbol] = useState("005930")
  const [speed, setSpeed] = useState(0.3)
  const [stopLoss, setStopLoss] = useState(5.0)
  const [trailingStop, setTrailingStop] = useState(3.0)
  const [dataSource, setDataSource] = useState<"synthetic" | "real">("synthetic")

  // 전략
  const [strategyType, setStrategyType] = useState<StrategyType>("preset")
  const [strategyPreset, setStrategyPreset] = useState("rsi_oversold")
  const [buyRsi, setBuyRsi] = useState(40)
  const [sellRsi, setSellRsi] = useState(60)
  const [factorId, setFactorId] = useState("")

  // 합성 모드
  const [basePrice, setBasePrice] = useState(50000)
  const [nBars, setNBars] = useState(78)
  const [scenario, setScenario] = useState("normal")
  const [seed, setSeed] = useState(42)

  // 실제 모드
  const [startDate, setStartDate] = useState(todayStr())
  const [endDate, setEndDate] = useState(todayStr())
  const [interval, setInterval] = useState("5m")

  // 목록
  const [strategies, setStrategies] = useState<StrategyOption[]>([])
  const [alphaFactors, setAlphaFactors] = useState<AlphaFactorOption[]>([])

  // 상태
  const [running, setRunning] = useState(false)
  const [candles, setCandles] = useState<CandleData[]>([])
  const [markers, setMarkers] = useState<SeriesMarker<Time>[]>([])
  const [logs, setLogs] = useState<DecisionEvent[]>([])
  const [simState, setSimState] = useState<SimState | null>(null)
  const [progress, setProgress] = useState({ current: 0, total: 0 })
  const [error, setError] = useState("")
  const [lastAlpha, setLastAlpha] = useState<number | null>(null)
  const [analysis, setAnalysis] = useState("")
  const [analyzing, setAnalyzing] = useState(false)
  const [done, setDone] = useState(false)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [savedRunId, setSavedRunId] = useState("")

  const esRef = useRef<EventSource | null>(null)
  const logEndRef = useRef<HTMLDivElement>(null)
  const candlesRef = useRef<CandleData[]>([])

  const loadHistory = useCallback(() => {
    fetch(`${API_URL}/sim-replay/runs?limit=20&mode=single`)
      .then(r => r.json())
      .then(d => setHistory(d.items || []))
      .catch(() => {})
  }, [])

  // 전략 목록 + 히스토리 로드 (1회)
  useEffect(() => {
    fetch(`${API_URL}/sim-replay/strategies`).then(r => r.json()).then(setStrategies).catch(() => {})
    loadHistory()
  }, [loadHistory])

  // 알파 팩터 목록 — 인터벌에 맞게 필터링
  useEffect(() => {
    fetch(`${API_URL}/alpha/factors?min_ic=0.03&causal_robust=true&sort_by=ic_mean&limit=30&interval=${interval}`)
      .then(r => r.json())
      .then(data => {
        const items = (data.items || []).map((f: any) => ({
          id: f.id, name: f.name || f.expression_str?.slice(0, 30),
          ic_mean: f.ic_mean || 0, sharpe: f.sharpe || 0, interval: f.interval || "5m",
        }))
        setAlphaFactors(items)
        // 인터벌 변경으로 선택한 팩터가 목록에 없으면 초기화
        if (factorId && !items.some((f: AlphaFactorOption) => f.id === factorId)) {
          setFactorId("")
        }
      })
      .catch(() => {})
  }, [interval]) // eslint-disable-line react-hooks/exhaustive-deps

  // 알파 팩터 → 실제 데이터 강제
  useEffect(() => {
    if (strategyType === "alpha") setDataSource("real")
  }, [strategyType])

  // 시뮬 완료 시 자동 저장
  useEffect(() => {
    if (!done || logs.length === 0 || savedRunId) return
    const save = async () => {
      try {
        const res = await fetch(`${API_URL}/sim-replay/runs`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            symbol, interval, strategy_preset: strategyType === "alpha" ? `alpha:${factorId.slice(0, 8)}` : strategyPreset,
            factor_id: strategyType === "alpha" ? factorId : null,
            data_source: strategyType === "alpha" ? "real" : dataSource,
            config: { speed, stopLoss, trailingStop, scenario, seed, basePrice, nBars, startDate, endDate, buyRsi, sellRsi },
            total_bars: progress.total, total_events: logs.length,
            pnl: simState?.pnl, pnl_pct: simState?.pnl_pct,
            events: logs, final_state: simState, analysis,
          }),
        })
        const data = await res.json()
        if (data.id) {
          setSavedRunId(data.id)
          loadHistory()
        }
      } catch { /* 저장 실패해도 시뮬 결과는 유지 */ }
    }
    save()
  }, [done]) // eslint-disable-line react-hooks/exhaustive-deps

  // candlesRef는 candle 이벤트 핸들러에서 직접 동기 push (아래 참조)
  // useEffect로 하면 React 렌더 사이클 지연으로 decision 핸들러에서 참조 못함
  useEffect(() => { logEndRef.current?.scrollIntoView({ behavior: "smooth" }) }, [logs])

  const startReplay = useCallback(() => {
    setCandles([]); setMarkers([]); setLogs([]); setSimState(null)
    setProgress({ current: 0, total: 0 }); setError(""); setLastAlpha(null)
    setAnalysis(""); setDone(false)
    candlesRef.current = []

    const p: Record<string, string> = {
      symbol, speed: String(speed),
      stop_loss_pct: String(stopLoss), trailing_stop_pct: String(trailingStop),
      data_source: strategyType === "alpha" ? "real" : dataSource,
    }

    // 전략별 파라미터
    if (strategyType === "alpha" && factorId) {
      p.factor_id = factorId
    } else if (strategyType === "custom") {
      p.strategy_preset = "custom"
      p.buy_rsi = String(buyRsi); p.sell_rsi = String(sellRsi)
    } else {
      p.strategy_preset = strategyPreset
    }

    // 데이터 소스별
    if (p.data_source === "synthetic") {
      p.base_price = String(basePrice); p.n_bars = String(nBars)
      p.scenario = scenario; p.seed = String(seed)
    } else {
      p.start_date = startDate; p.end_date = endDate; p.interval = interval
    }

    const es = new EventSource(`${API_URL}/sim-replay/stream?${new URLSearchParams(p)}`)

    es.addEventListener("candle", (e) => {
      const d = JSON.parse(e.data)
      const candle: CandleData = {
        time: dateToUTC(d.dt), open: d.open, high: d.high,
        low: d.low, close: d.close, volume: d.volume,
      }
      // candlesRef를 동기적으로 즉시 업데이트 (decision 핸들러에서 참조 가능하도록)
      candlesRef.current = [...candlesRef.current, candle]
      setCandles(candlesRef.current)
      setProgress({ current: d.bar + 1, total: d.total })
      if (d.alpha_value !== undefined) setLastAlpha(d.alpha_value)
    })

    es.addEventListener("decision", (e) => {
      const d: DecisionEvent = JSON.parse(e.data)
      setLogs(prev => [...prev, d])
      if (d.type === "SUBMIT" || d.type === "FILL") {
        const isBuy = d.detail.includes("BUY")
        const barTime = candlesRef.current[d.bar]?.time
        if (barTime) {
          setMarkers(prev => [...prev, {
            time: barTime as unknown as Time,
            position: (isBuy ? "belowBar" : "aboveBar") as "belowBar" | "aboveBar",
            color: isBuy ? "#ef4444" : "#3b82f6",
            shape: (isBuy ? "arrowUp" : "arrowDown") as "arrowUp" | "arrowDown",
            text: d.type === "FILL" ? "체결" : isBuy ? "매수" : "매도",
          }])
        }
      }
    })

    es.addEventListener("state", (e) => setSimState(JSON.parse(e.data)))
    es.addEventListener("done", () => { es.close(); setRunning(false); setDone(true) })
    es.onerror = () => { es.close(); setRunning(false) }

    esRef.current = es; setRunning(true)
  }, [
    symbol, speed, strategyType, strategyPreset, stopLoss, trailingStop,
    dataSource, basePrice, nBars, scenario, seed, startDate, endDate,
    interval, buyRsi, sellRsi, factorId,
  ])

  const stopReplay = useCallback(() => {
    esRef.current?.close(); esRef.current = null; setRunning(false)
  }, [])

  const requestAnalysis = useCallback(async () => {
    if (logs.length === 0) return
    setAnalyzing(true)
    try {
      const res = await fetch(`${API_URL}/sim-replay/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ events: logs, final_state: simState }),
      })
      const data = await res.json()
      const text = data.analysis || "분석 결과 없음"
      setAnalysis(text)
      // 저장된 run이 있으면 analysis 업데이트
      if (savedRunId) {
        fetch(`${API_URL}/sim-replay/runs`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            symbol, interval, strategy_preset: strategyPreset,
            factor_id: strategyType === "alpha" ? factorId : null,
            data_source: dataSource, config: {},
            total_bars: progress.total, total_events: logs.length,
            pnl: simState?.pnl, pnl_pct: simState?.pnl_pct,
            events: logs, final_state: simState, analysis: text,
          }),
        }).then(() => loadHistory()).catch(() => {})
      }
    } catch {
      setAnalysis("분석 요청 실패")
    } finally {
      setAnalyzing(false)
    }
  }, [logs, simState, savedRunId, symbol, interval, strategyPreset, strategyType, factorId, dataSource, progress.total, loadHistory])

  useEffect(() => () => { esRef.current?.close() }, [])

  const pct = progress.total > 0 ? (progress.current / progress.total) * 100 : 0
  const isSynthetic = dataSource === "synthetic" && strategyType !== "alpha"

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold">시뮬레이션 리플레이</h1>
        <div className="flex gap-1 rounded-lg border bg-muted p-0.5">
          <button
            onClick={() => setReplayMode("single")}
            className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
              replayMode === "single"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            단일 종목
          </button>
          <button
            onClick={() => setReplayMode("universe")}
            className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
              replayMode === "universe"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            유니버스
          </button>
        </div>
      </div>

      {replayMode === "universe" ? (
        <UniverseReplayPanel />
      ) : (
      <>

      <Card>
        <CardContent className="pt-4 space-y-3">
          {/* 1행: 종목 + 인터벌 + 전략유형 + 데이터 + 속도 */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">종목</Label>
              <StockSearch value={symbol} onSelect={setSymbol} className="w-full" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">인터벌</Label>
              <Select value={interval} onValueChange={setInterval} disabled={running}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1m">1분</SelectItem>
                  <SelectItem value="3m">3분</SelectItem>
                  <SelectItem value="5m">5분</SelectItem>
                  <SelectItem value="1d">일봉</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">전략 유형</Label>
              <Select value={strategyType} onValueChange={(v) => setStrategyType(v as StrategyType)} disabled={running}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="preset">프리셋</SelectItem>
                  <SelectItem value="alpha">알파 팩터</SelectItem>
                  <SelectItem value="custom">커스텀 (RSI)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">데이터</Label>
              <Select
                value={strategyType === "alpha" ? "real" : dataSource}
                onValueChange={(v) => setDataSource(v as "synthetic" | "real")}
                disabled={running || strategyType === "alpha"}
              >
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="synthetic">합성 (랜덤)</SelectItem>
                  <SelectItem value="real">실제 DB 캔들</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">재생 속도</Label>
              <Select value={String(speed)} onValueChange={(v) => setSpeed(Number(v))} disabled={running}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="0.1">0.1s (빠름)</SelectItem>
                  <SelectItem value="0.3">0.3s</SelectItem>
                  <SelectItem value="0.5">0.5s</SelectItem>
                  <SelectItem value="1">1s (느림)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 2행: 전략 상세 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {strategyType === "preset" && (
              <div className="col-span-2">
                <Label className="text-xs text-muted-foreground">프리셋 전략</Label>
                <Select value={strategyPreset} onValueChange={setStrategyPreset} disabled={running}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {strategies.filter(s => s.id !== "custom").map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {strategyType === "alpha" && (
              <div className="col-span-2">
                <Label className="text-xs text-muted-foreground">
                  알파 팩터
                  {alphaFactors.length === 0 && <span className="ml-1 text-red-400">(마이닝 팩터 없음)</span>}
                </Label>
                <Select value={factorId} onValueChange={setFactorId} disabled={running || alphaFactors.length === 0}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="팩터 선택..." /></SelectTrigger>
                  <SelectContent>
                    {alphaFactors.map(f => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.name} (IC={f.ic_mean.toFixed(3)}, Sharpe={f.sharpe.toFixed(1)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {strategyType === "custom" && (
              <>
                <div>
                  <Label className="text-xs text-muted-foreground">매수 RSI 임계</Label>
                  <Input type="number" value={buyRsi} onChange={e => setBuyRsi(Number(e.target.value))} disabled={running} className="h-8 text-sm" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">매도 RSI 임계</Label>
                  <Input type="number" value={sellRsi} onChange={e => setSellRsi(Number(e.target.value))} disabled={running} className="h-8 text-sm" />
                </div>
              </>
            )}
            <div>
              <Label className="text-xs text-muted-foreground">손절 %</Label>
              <Input type="number" step={0.5} value={stopLoss} onChange={e => setStopLoss(Number(e.target.value))} disabled={running} className="h-8 text-sm" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">트레일링 %</Label>
              <Input type="number" step={0.5} value={trailingStop} onChange={e => setTrailingStop(Number(e.target.value))} disabled={running} className="h-8 text-sm" />
            </div>
          </div>

          {/* 3행: 데이터소스 상세 */}
          {isSynthetic ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Tip text="합성 데이터의 초기 가격"><div>
                <Label className="text-xs text-muted-foreground">시작 가격</Label>
                <Input type="number" value={basePrice} onChange={e => setBasePrice(Number(e.target.value))} disabled={running} className="h-8 text-sm" />
              </div></Tip>
              <div>
                <Label className="text-xs text-muted-foreground">시나리오</Label>
                <Select value={scenario} onValueChange={setScenario} disabled={running}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">정상 시장</SelectItem>
                    <SelectItem value="flash_crash">급락</SelectItem>
                    <SelectItem value="gap_up">갭 상승</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Tip text="생성할 캔들 개수. 5분봉 1일 = 78개"><div>
                <Label className="text-xs text-muted-foreground">캔들 수</Label>
                <Input type="number" value={nBars} onChange={e => setNBars(Number(e.target.value))} disabled={running} className="h-8 text-sm" />
              </div></Tip>
              <Tip text="같은 값 = 같은 패턴. 재현성 보장"><div>
                <Label className="text-xs text-muted-foreground">랜덤 시드</Label>
                <Input type="number" value={seed} onChange={e => setSeed(Number(e.target.value))} disabled={running} className="h-8 text-sm" />
              </div></Tip>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">시작일</Label>
                <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} disabled={running} className="h-8 text-sm" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">종료일</Label>
                <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} disabled={running} className="h-8 text-sm" />
              </div>
            </div>
          )}

          {/* 버튼 + 프로그레스 */}
          <div className="flex items-center gap-3">
            {!running ? (
              <Button onClick={startReplay} size="sm" disabled={strategyType === "alpha" && !factorId}>
                <Play className="mr-1.5 h-4 w-4" />시작
              </Button>
            ) : (
              <Button onClick={stopReplay} variant="destructive" size="sm">
                <Square className="mr-1.5 h-4 w-4" />중지
              </Button>
            )}
            {progress.total > 0 && (
              <div className="flex items-center gap-2 flex-1">
                <div className="h-2 flex-1 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">{progress.current}/{progress.total}</span>
              </div>
            )}
            {lastAlpha !== null && (
              <Badge variant="outline" className="text-xs">alpha {lastAlpha.toFixed(3)}</Badge>
            )}
            {error && <Badge variant="destructive" className="text-xs">{error}</Badge>}
          </div>
        </CardContent>
      </Card>

      {/* 차트 */}
      {candles.length > 0 && (
        <Card>
          <CardContent className="pt-4">
            <CandleChart data={candles} height={350} interval={isSynthetic ? "5m" : interval} markers={markers} />
          </CardContent>
        </Card>
      )}

      {/* 상태 + 로그 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="py-3 px-4"><CardTitle className="text-sm">상태</CardTitle></CardHeader>
          <CardContent className="px-4 pb-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">현금</span>
              <span>{simState ? formatKRW(simState.cash) : "-"}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">포지션</span>
              <span>{simState ? Object.keys(simState.positions).length + "종목" : "-"}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">미체결</span>
              <span>{simState?.pending_orders ?? "-"}</span>
            </div>
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between text-sm font-medium">
                <span className="text-muted-foreground">PnL</span>
                <span className={(simState?.pnl ?? 0) >= 0 ? "text-green-500" : "text-red-500"}>
                  {simState ? `${simState.pnl >= 0 ? "+" : ""}${formatKRW(simState.pnl)} (${simState.pnl_pct >= 0 ? "+" : ""}${simState.pnl_pct.toFixed(2)}%)` : "-"}
                </span>
              </div>
            </div>
            {simState && Object.entries(simState.positions).map(([sym, pos]) => (
              <div key={sym} className="flex justify-between text-xs text-muted-foreground border-t pt-1">
                <span>{sym}</span>
                <span>{pos.qty}주 @ {pos.avg_price.toLocaleString()}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm">판단 로그 <span className="text-muted-foreground font-normal">({logs.length})</span></CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <ScrollArea className="h-[300px]">
              <div className="space-y-1">
                {logs.map((log, i) => {
                  const cfg = EVENT_CONFIG[log.type] || EVENT_CONFIG.SKIP
                  const Icon = cfg.icon
                  return (
                    <div key={i} className="flex items-start gap-2 text-xs py-1">
                      <Badge variant="secondary" className={`${cfg.color} text-[10px] px-1.5 py-0 shrink-0`}>
                        <Icon className="h-3 w-3 mr-0.5" />{cfg.label}
                      </Badge>
                      <span className="text-muted-foreground shrink-0">[{log.bar}]</span>
                      <span className="text-foreground break-all">{log.detail}</span>
                    </div>
                  )
                })}
                <div ref={logEndRef} />
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* AI 분석 */}
      {done && logs.length > 0 && (
        <Card>
          <CardHeader className="py-3 px-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">AI 분석</CardTitle>
              {!analysis && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={requestAnalysis}
                  disabled={analyzing}
                >
                  {analyzing ? "분석 중..." : "분석 요청"}
                </Button>
              )}
            </div>
          </CardHeader>
          {analysis && (
            <CardContent className="px-4 pb-4">
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <Markdown remarkPlugins={[remarkGfm]}>{analysis}</Markdown>
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* 히스토리 */}
      {history.length > 0 && (
        <Card>
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm">
              히스토리 <span className="text-muted-foreground font-normal">({history.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="space-y-1">
              {history.map((h) => (
                <div
                  key={h.id}
                  className="flex items-center justify-between text-xs py-1.5 px-2 rounded hover:bg-muted/50 cursor-pointer group"
                  onClick={async () => {
                    try {
                      const res = await fetch(`${API_URL}/sim-replay/runs/${h.id}`)
                      const data = await res.json()
                      // 상태 복원
                      setLogs(data.events || [])
                      setSimState(data.final_state || null)
                      setAnalysis(data.analysis || "")
                      setProgress({ current: data.total_bars, total: data.total_bars })
                      setDone(true)
                      setSavedRunId(data.id)
                      // 캔들은 events에서 복원 불가 — 상태만 복원
                      setCandles([])
                      setMarkers([])
                    } catch { /* ignore */ }
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono">{h.symbol}</span>
                    <Badge variant="outline" className="text-[10px] px-1">{h.interval}</Badge>
                    <span className="text-muted-foreground">{h.strategy_preset}</span>
                    <Badge variant="outline" className="text-[10px] px-1">{h.data_source}</Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={h.pnl != null && h.pnl >= 0 ? "text-green-500" : "text-red-500"}>
                      {h.pnl_pct != null ? `${h.pnl_pct >= 0 ? "+" : ""}${h.pnl_pct.toFixed(2)}%` : "-"}
                    </span>
                    <span className="text-muted-foreground">{h.total_events}건</span>
                    {h.has_analysis && <Badge variant="secondary" className="text-[10px] px-1">AI</Badge>}
                    <span className="text-muted-foreground">
                      {new Date(h.created_at).toLocaleString("ko-KR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <button
                      className="text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={async (e) => {
                        e.stopPropagation()
                        await fetch(`${API_URL}/sim-replay/runs/${h.id}`, { method: "DELETE" })
                        loadHistory()
                      }}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      </>
      )}
    </div>
  )
}
