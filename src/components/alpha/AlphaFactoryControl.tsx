import { useState, useCallback, useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Term } from "@/components/ui/term"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  useStartFactory,
  useStopFactory,
  useFactoryStatus,
  useUniverses,
} from "@/hooks/queries/use-alpha"
import { useAlphaFactoryStream } from "@/hooks/use-websocket"
import AlphaMiningLog from "@/components/alpha/AlphaMiningLog"
import type { AlphaFactoryStatus, IterationLog, MiningLogSummary } from "@/types/alpha"

function ElapsedTime({ startedAt }: { startedAt: string }) {
  const [, setTick] = useState(0)
  // 30초마다 리렌더
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30_000)
    return () => clearInterval(id)
  }, [startedAt])
  const start = new Date(startedAt + "Z").getTime()
  const elapsed = Math.floor((Date.now() - start) / 1000)
  if (elapsed < 60) return <>{elapsed}초</>
  if (elapsed < 3600) return <>{Math.floor(elapsed / 60)}분 {elapsed % 60}초</>
  const h = Math.floor(elapsed / 3600)
  const m = Math.floor((elapsed % 3600) / 60)
  return <>{h}시간 {m}분</>
}

function FactoryRunningDashboard({ status }: { status: AlphaFactoryStatus }) {
  const config = status.config ?? {}
  const funnel = status.last_funnel ?? {}

  return (
    <div className="space-y-3">
      {/* 설정 요약 */}
      <div className="rounded-lg border bg-muted/30 p-3">
        <h4 className="mb-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
          실행 설정
        </h4>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">유니버스</span>
            <span className="font-medium">{String(config.universe ?? "—")}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">인터벌</span>
            <span className="font-medium">{String(config.data_interval ?? "—")}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">기간</span>
            <span className="font-medium">
              {String(config.start_date ?? "").slice(5)} ~ {String(config.end_date ?? "").slice(5)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">IC 기준</span>
            <span className="font-medium">{String(config.ic_threshold ?? "0.03")}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">사이클 간격</span>
            <span className="font-medium">
              {Number(config.interval_minutes ?? 0) === 0 ? "연속" : `${config.interval_minutes}분`}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">옵션</span>
            <span className="font-medium">
              {config.enable_crossover ? "교차" : ""}
              {config.enable_crossover && config.enable_causal ? " + " : ""}
              {config.enable_causal ? "인과검증" : ""}
              {!config.enable_crossover && !config.enable_causal ? "—" : ""}
            </span>
          </div>
        </div>
        {config.context && (
          <p className="mt-2 text-[10px] text-muted-foreground line-clamp-2">
            {String(config.context)}
          </p>
        )}
      </div>

      {/* 핵심 지표 그리드 */}
      <div className="grid grid-cols-4 gap-2">
        <StatCard
          label="사이클"
          value={`${status.cycles_completed}${config.max_cycles ? `/${config.max_cycles}` : ""}`}
        />
        <StatCard label="발견 팩터" value={String(status.factors_discovered_total)} />
        <StatCard label="세대" value={String(status.generation ?? 0)} />
        <StatCard
          label="경과"
          value={status.started_at ? <ElapsedTime startedAt={status.started_at} /> : "—"}
        />
      </div>

      {/* 진화 엔진 상세 */}
      {(status.population_size ?? 0) > 0 && (
        <div className="rounded-lg border bg-muted/30 p-3">
          <h4 className="mb-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
            진화 엔진
          </h4>
          <div className="grid grid-cols-3 gap-x-4 gap-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">모집단</span>
              <span className="font-medium">{status.population_size}개</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">엘리트</span>
              <span className="font-medium">{status.elite_count}개</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">세대</span>
              <span className="font-medium">{status.generation}</span>
            </div>
          </div>

          {/* 퍼널 */}
          {Object.keys(funnel).length > 0 && (
            <div className="mt-2 pt-2 border-t">
              <p className="text-[10px] font-semibold text-muted-foreground mb-1">
                마지막 퍼널
              </p>
              <div className="flex items-center gap-1 text-[10px] flex-wrap">
                <FunnelStep label="후보" value={funnel.attempted} />
                <FunnelArrow />
                <FunnelStep label="평가성공" value={funnel.eval_ok} />
                <FunnelArrow />
                <FunnelStep label="IC통과" value={funnel.ic_pass} />
                {funnel.wf_overfit != null && funnel.wf_overfit > 0 && (
                  <>
                    <FunnelArrow />
                    <FunnelStep label="과적합제거" value={(funnel.ic_pass ?? 0) - funnel.wf_overfit} />
                  </>
                )}
                <FunnelArrow />
                <FunnelStep label="CPCV" value={funnel.cpcv_candidates} highlight />
              </div>
            </div>
          )}

          {/* 오퍼레이터 통계 */}
          {status.operator_stats && Object.keys(status.operator_stats).length > 0 && (
            <OperatorStats stats={status.operator_stats} />
          )}
        </div>
      )}

      {/* 현재 진행 상태 */}
      {status.current_cycle_progress > 0 && (
        <div>
          <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1">
            <span>
              사이클 {status.cycles_completed + 1} 진행 중
              {status.current_cycle_message ? ` — ${status.current_cycle_message}` : ""}
            </span>
            <span>{status.current_cycle_progress}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-[oklch(0.540_0.235_270.1)] transition-all"
              style={{ width: `${status.current_cycle_progress}%` }}
            />
          </div>
        </div>
      )}

      {status.last_cycle_at && (
        <p className="text-[10px] text-muted-foreground">
          마지막 사이클: {new Date(status.last_cycle_at + "Z").toLocaleString("ko-KR")}
        </p>
      )}
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg border p-2 text-center">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold">{value}</p>
    </div>
  )
}

function FunnelStep({ label, value, highlight }: { label: string; value?: number; highlight?: boolean }) {
  return (
    <span className={`rounded px-1.5 py-0.5 ${highlight ? "bg-green-100 text-green-700 font-semibold" : "bg-muted"}`}>
      {label} {value ?? 0}
    </span>
  )
}

function FunnelArrow() {
  return <span className="text-muted-foreground">→</span>
}

function OperatorStats({ stats }: { stats: Record<string, unknown> }) {
  // stats 구조: { operator_name: { attempted, discovered, ic_pass, ... }, ... }
  const entries = Object.entries(stats).filter(
    ([, v]) => typeof v === "object" && v !== null && "attempted" in (v as Record<string, unknown>),
  )
  if (entries.length === 0) return null

  return (
    <div className="mt-2 pt-2 border-t">
      <p className="text-[10px] font-semibold text-muted-foreground mb-1">오퍼레이터별 성과</p>
      <div className="space-y-0.5">
        {entries.map(([name, v]) => {
          const s = v as Record<string, number>
          const rate = s.attempted > 0 ? ((s.discovered ?? 0) / s.attempted * 100).toFixed(0) : "0"
          return (
            <div key={name} className="flex items-center gap-2 text-[10px]">
              <span className="w-20 truncate font-mono text-muted-foreground">{name}</span>
              <div className="flex-1 h-1 rounded-full bg-gray-200 overflow-hidden">
                <div
                  className="h-full rounded-full bg-[oklch(0.540_0.235_270.1)]"
                  style={{ width: `${Math.min(Number(rate), 100)}%` }}
                />
              </div>
              <span className="w-20 text-right text-muted-foreground">
                {s.discovered ?? 0}/{s.attempted} ({rate}%)
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function AlphaFactoryControl() {
  const queryClient = useQueryClient()
  const { data: status } = useFactoryStatus()
  const { data: universes } = useUniverses()
  const startFactory = useStartFactory()
  const stopFactory = useStopFactory()

  // 사이클 로그 (WS 스트리밍)
  const [cycleIterations, setCycleIterations] = useState<IterationLog[]>([])
  const [cycleSummary, setCycleSummary] = useState<MiningLogSummary | null>(null)
  const [showCycleLog, setShowCycleLog] = useState(false)

  const [context, setContext] = useState("")
  const [universe, setUniverse] = useState("KOSPI200")
  const [startDate, setStartDate] = useState("2024-01-01")
  const [endDate, setEndDate] = useState("2025-12-31")
  const [dataInterval, setDataInterval] = useState("1d")
  const [intervalMin, setIntervalMin] = useState(0)
  const [icThreshold, setIcThreshold] = useState(0.03)
  const [orthogonalityThreshold, setOrthogonalityThreshold] = useState(0.7)
  const [crossover, setCrossover] = useState(true)
  const [causal, setCausal] = useState(false)
  const [maxCycles, setMaxCycles] = useState<string>("")

  const isRunning = status?.running ?? false

  // WS 스트리밍: iteration 이벤트 수신
  const handleFactoryEvent = useCallback(
    (event: Record<string, unknown>) => {
      const type = event.type as string

      if (type === "cycle_start") {
        // 새 사이클 시작 → 이전 로그 초기화
        setCycleIterations([])
        setCycleSummary(null)
      }

      if (type === "iteration_complete") {
        const itLog: IterationLog = {
          iteration: event.iteration as number,
          hypothesis: event.hypothesis as string,
          attempts: (event.attempts ?? []) as IterationLog["attempts"],
          discovered_factor_name: (event.discovered_factor_name ?? null) as string | null,
        }
        setCycleIterations((prev) => [...prev, itLog])
      }

      if (type === "mining_summary") {
        setCycleSummary(event as unknown as MiningLogSummary)
      }

      if (type === "cycle_complete" || type === "generation_complete") {
        // 사이클/세대 완료 → 상태 + 팩터 목록 갱신
        queryClient.invalidateQueries({ queryKey: ["alpha-factory-status"] })
        if (type === "cycle_complete") {
          queryClient.invalidateQueries({ queryKey: ["alpha-factors"] })
        }
      }

      if (type === "factory_stopped") {
        // 팩토리 중지 → 즉시 상태 갱신 (가동 중 → 중지)
        queryClient.invalidateQueries({ queryKey: ["alpha-factory-status"] })
        queryClient.invalidateQueries({ queryKey: ["alpha-factors"] })
      }
    },
    [queryClient],
  )

  useAlphaFactoryStream(isRunning, handleFactoryEvent)

  const canStart = startDate && endDate && startDate < endDate

  const handleStart = () => {
    if (!canStart) return
    const parsedMaxCycles = maxCycles ? parseInt(maxCycles, 10) : undefined
    startFactory.mutate({
      context,
      universe,
      start_date: startDate,
      end_date: endDate,
      interval_minutes: intervalMin,
      max_iterations_per_cycle: 5,
      ic_threshold: icThreshold,
      orthogonality_threshold: orthogonalityThreshold,
      enable_crossover: crossover,
      enable_causal: causal,
      max_cycles: parsedMaxCycles && parsedMaxCycles > 0 ? parsedMaxCycles : undefined,
      data_interval: dataInterval,
    })
  }

  return (
    <div className="space-y-4">
      {/* 헤더 + 시작/중지 버튼 */}
      <div className="flex items-center justify-between rounded-lg border p-4">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold">알파 팩토리</h3>
          <Badge variant={isRunning ? "default" : "secondary"}>
            {isRunning ? "가동 중" : "중지"}
          </Badge>
        </div>
        <Button
          variant={isRunning ? "destructive" : "default"}
          size="sm"
          onClick={isRunning ? () => stopFactory.mutate() : handleStart}
          disabled={
            startFactory.isPending ||
            stopFactory.isPending ||
            (!isRunning && !canStart)
          }
        >
          {isRunning ? "중지" : "시작"}
        </Button>
      </div>

      {/* 에러 표시 */}
      {(startFactory.error || stopFactory.error) && (
        <p className="text-xs text-red-500">
          {(startFactory.error ?? stopFactory.error)?.message ??
            "팩토리 작업 실패"}
        </p>
      )}

      {/* 가동 중: 대시보드 */}
      {isRunning && status && <FactoryRunningDashboard status={status} />}

      {/* 사이클 로그 (가동 중) */}
      {isRunning && cycleIterations.length > 0 && (
        <div className="space-y-2">
          <button
            onClick={() => setShowCycleLog((v) => !v)}
            className="text-xs text-muted-foreground underline hover:text-foreground"
          >
            {showCycleLog
              ? "사이클 로그 닫기"
              : `사이클 로그 보기 (${cycleIterations.length}회 반복)`}
          </button>
          {showCycleLog && (
            <AlphaMiningLog
              iterations={cycleIterations}
              summary={cycleSummary}
              icThreshold={icThreshold}
            />
          )}
        </div>
      )}

      {/* 설정 폼 (중지 상태에서만 편집 가능) */}
      {!isRunning && (
        <div className="space-y-3 rounded-lg border p-4">
          <h4 className="text-xs font-semibold text-gray-500">팩토리 설정</h4>

          <div>
            <Label className="text-xs">시장 맥락</Label>
            <Input
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="한국 주식시장 알파 팩터 탐색"
              className="mt-1 h-8 text-sm"
            />
          </div>

          <div>
            <Label className="text-xs">유니버스</Label>
            <Select value={universe} onValueChange={setUniverse}>
              <SelectTrigger className="mt-1 h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {universes ? (
                  universes.map((u) => (
                    <SelectItem key={u.code} value={u.code}>
                      {u.label} ({u.count}종목)
                    </SelectItem>
                  ))
                ) : (
                  <>
                    <SelectItem value="KOSPI200">KOSPI 200</SelectItem>
                    <SelectItem value="KOSDAQ150">KOSDAQ 150</SelectItem>
                    <SelectItem value="KRX300">KRX 300</SelectItem>
                    <SelectItem value="ALL">전종목</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs">데이터 인터벌</Label>
            <Select value={dataInterval} onValueChange={setDataInterval}>
              <SelectTrigger className="mt-1 h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1d">일봉 (1d)</SelectItem>
                <SelectItem value="1h">1시간</SelectItem>
                <SelectItem value="30m">30분</SelectItem>
                <SelectItem value="15m">15분</SelectItem>
                <SelectItem value="5m">5분</SelectItem>
                <SelectItem value="3m">3분</SelectItem>
                <SelectItem value="1m">1분</SelectItem>
              </SelectContent>
            </Select>
            {dataInterval !== "1d" && (
              <p className="mt-0.5 text-[10px] text-muted-foreground">
                분봉 데이터가 DB에 존재하는 종목만 탐색됩니다
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">시작일</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1 h-8 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">종료일</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-1 h-8 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">사이클 간격 (분)</Label>
              <Input
                type="number"
                value={intervalMin}
                onChange={(e) => setIntervalMin(Number(e.target.value))}
                min={0}
                placeholder="0 = 연속"
                className="mt-1 h-8 text-sm"
              />
              {intervalMin === 0 && (
                <p className="mt-0.5 text-[10px] text-muted-foreground">연속 실행</p>
              )}
            </div>
            <div>
              <Label className="text-xs">최대 사이클</Label>
              <Input
                type="number"
                value={maxCycles}
                onChange={(e) => setMaxCycles(e.target.value)}
                min={1}
                max={1000}
                placeholder="무제한"
                className="mt-1 h-8 text-sm"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs"><Term k="IC">IC</Term> <Term>임계값</Term></Label>
            <Input
              type="number"
              value={icThreshold}
              onChange={(e) => setIcThreshold(Number(e.target.value))}
              step={0.01}
              min={0}
              className="mt-1 h-8 text-sm"
            />
          </div>

          <div>
            <Label className="text-xs">
              <Term>직교성</Term> 필터 (최대 <Term>상관계수</Term>: {orthogonalityThreshold.toFixed(2)})
            </Label>
            <Slider
              value={[orthogonalityThreshold]}
              onValueChange={([v]) => setOrthogonalityThreshold(v)}
              min={0}
              max={1}
              step={0.05}
              className="mt-2"
            />
            <p className="mt-0.5 text-[10px] text-muted-foreground">
              낮을수록 기존 팩터와 완전히 다른 팩터만 허용
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch checked={crossover} onCheckedChange={setCrossover} />
              <Label className="text-xs">유전 교차</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={causal} onCheckedChange={setCausal} />
              <Label className="text-xs"><Term>인과 검증</Term></Label>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AlphaFactoryControl
