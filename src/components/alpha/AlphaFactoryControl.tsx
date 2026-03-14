import { useState, useCallback, useEffect, useRef } from "react"
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
import { useWorkflowStatus, useTriggerWorkflow } from "@/hooks/queries/use-workflow"
import { useAlphaFactoryStream } from "@/hooks/use-websocket"
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
              {config.enable_crossover ? "교차" : "—"}
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

function DiscoveredInCycle({ iterations }: { iterations: IterationLog[] }) {
  const discovered = iterations
    .filter((it) => it.discovered_factor_name !== null)
    .map((it) => {
      const successAttempt = it.attempts.find((a) => a.outcome === "discovered")
      return {
        name: it.discovered_factor_name!,
        hypothesis: it.hypothesis,
        expression: successAttempt?.expression_str ?? "",
        ic: successAttempt?.ic_mean ?? null,
      }
    })

  return (
    <div className="rounded-lg border p-3 space-y-2">
      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        이번 사이클 발견 팩터
      </h4>
      {discovered.length === 0 ? (
        <p className="text-xs text-muted-foreground py-2 text-center">
          아직 발견된 팩터가 없습니다
        </p>
      ) : (
        <div className="space-y-1.5">
          {discovered.map((d, i) => (
            <div
              key={i}
              className="flex items-start gap-2 rounded-md bg-green-50 border border-green-200 p-2"
            >
              <span className="shrink-0 text-green-600 text-xs font-bold mt-0.5">
                #{i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium truncate">{d.name}</p>
                <p className="text-[10px] text-muted-foreground font-mono truncate">
                  {d.expression}
                </p>
                <div className="flex gap-3 mt-0.5">
                  {d.ic !== null && (
                    <span className="text-[10px] text-green-700">
                      IC {d.ic.toFixed(4)}
                    </span>
                  )}
                  <span className="text-[10px] text-muted-foreground truncate">
                    {d.hypothesis}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

interface ActivityEntry {
  id: number
  time: string
  type: "progress" | "eval" | "discovered" | "generation" | "info"
  message: string
  detail?: string
}

let _activityId = 0

function ActivityFeed({ entries }: { entries: ActivityEntry[] }) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [entries.length])

  if (entries.length === 0) {
    return (
      <div className="rounded-lg border p-3">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
          실시간 탐색 현황
        </h4>
        <p className="text-xs text-muted-foreground text-center py-4">
          데이터 로드 중... 잠시 후 탐색 현황이 표시됩니다
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border p-3">
      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
        실시간 탐색 현황 ({entries.length})
      </h4>
      <div
        ref={scrollRef}
        className="max-h-80 overflow-y-auto space-y-1"
      >
        {entries.map((e) => (
          <div key={e.id} className="flex gap-2 text-[11px] leading-relaxed">
            <span className="shrink-0 text-muted-foreground w-12">{e.time}</span>
            <span className={
              e.type === "discovered" ? "text-green-600 font-semibold" :
              e.type === "eval" ? "text-blue-600" :
              e.type === "generation" ? "font-medium" :
              "text-muted-foreground"
            }>
              {e.type === "discovered" && "\u2705 "}
              {e.type === "eval" && "\U0001f52c "}
              {e.message}
            </span>
            {e.detail && (
              <span className="text-muted-foreground font-mono truncate">
                {e.detail}
              </span>
            )}
          </div>
        ))}
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
  const { data: wfStatus } = useWorkflowStatus()
  const triggerWorkflow = useTriggerWorkflow()

  // 사이클 로그 (WS 스트리밍)
  const [cycleIterations, setCycleIterations] = useState<IterationLog[]>([])
  const [cycleSummary, setCycleSummary] = useState<MiningLogSummary | null>(null)

  // 활동 로그 (실시간 피드)
  const [activityLog, setActivityLog] = useState<ActivityEntry[]>([])

  const [context, setContext] = useState("")
  const [universe, setUniverse] = useState("KOSPI200")
  const [startDate, setStartDate] = useState("2024-01-01")
  const [endDate, setEndDate] = useState("2025-12-31")
  const [dataInterval, setDataInterval] = useState("1d")
  const [intervalMin, setIntervalMin] = useState(0)
  const [icThreshold, setIcThreshold] = useState(0.03)
  const [orthogonalityThreshold, setOrthogonalityThreshold] = useState(0.7)
  const [crossover, setCrossover] = useState(true)
  const [maxCycles, setMaxCycles] = useState<string>("")

  const isRunning = status?.running ?? false

  const addActivity = useCallback((type: ActivityEntry["type"], message: string, detail?: string) => {
    const now = new Date()
    const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`
    setActivityLog((prev) => [
      ...prev.slice(-200),  // 최대 200개 유지
      { id: ++_activityId, time, type, message, detail },
    ])
  }, [])

  // WS 스트리밍: 이벤트 수신
  const handleFactoryEvent = useCallback(
    (event: Record<string, unknown>) => {
      const type = event.type as string

      if (type === "cycle_start") {
        setCycleIterations([])
        setCycleSummary(null)
        setActivityLog([])
        addActivity("info", `사이클 ${event.cycle ?? ""} 시작`)
      }

      if (type === "progress") {
        const msg = event.message as string
        if (msg) addActivity("progress", msg)
      }

      if (type === "candidates_ready") {
        const total = event.total as number
        const samples = event.samples as { expression: string; operator: string }[]
        const opBreakdown = event.operator_breakdown as Record<string, number>

        // 연산자별 분포 요약
        const opSummary = Object.entries(opBreakdown ?? {})
          .sort(([, a], [, b]) => b - a)
          .slice(0, 4)
          .map(([op, cnt]) => `${op.replace(/_/g, " ")} ${cnt}`)
          .join(", ")
        if (opSummary) {
          addActivity("info", `연산자 분포: ${opSummary}`)
        }

        // 실제 수식 샘플 표시
        addActivity("eval", `${total}개 후보 수식 생성 완료, 평가 시작:`)
        for (const s of samples) {
          addActivity("eval", `  [${s.operator}]`, s.expression)
        }
      }

      if (type === "eval_complete") {
        const total = event.total_evaluated as number
        const icPass = event.ic_pass_count as number
        const cpcv = event.cpcv_candidates as number
        const disc = event.discovered_count as number
        const thr = event.ic_threshold as number

        addActivity("eval",
          `${total}개 수식 평가 → IC(>${thr}) 통과 ${icPass}개 → CPCV 후보 ${cpcv}개`,
        )

        // IC 통과 상위 샘플 표시
        const topSamples = event.top_samples as { expression: string; ic: number; sharpe: number }[]
        if (topSamples?.length) {
          for (const s of topSamples.slice(0, 3)) {
            addActivity("eval",
              `  IC ${s.ic.toFixed(4)} / Sharpe ${s.sharpe.toFixed(1)}`,
              s.expression,
            )
          }
        }

        // 발견 팩터 표시
        const discovered = event.discovered as { name: string; expression: string; ic: number; sharpe: number }[]
        if (discovered?.length) {
          for (const d of discovered) {
            addActivity("discovered",
              `팩터 발견: ${d.name} (IC ${d.ic.toFixed(4)}, Sharpe ${d.sharpe.toFixed(1)})`,
              d.expression,
            )
          }
        }

        // IC 미달 샘플
        const failSamples = event.fail_samples as { expression: string; ic: number }[]
        if (failSamples?.length) {
          addActivity("progress",
            `IC 미달 예시: ${failSamples.map(f => `${f.ic.toFixed(4)}`).join(", ")}`,
          )
        }
      }

      if (type === "generation_start") {
        const gen = event.generation as number
        const pop = event.population_size as number
        addActivity("generation", `세대 ${gen} 시작 (모집단 ${pop}개)`)
      }

      if (type === "generation_complete") {
        const gen = event.generation as number
        const disc = event.new_discovered as number
        addActivity("generation",
          `세대 ${gen} 완료: ${disc}개 팩터 발견`,
        )
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

      if (type === "generation_start" || type === "cycle_complete" || type === "generation_complete") {
        queryClient.invalidateQueries({ queryKey: ["alpha-factory-status"] })
        if (type === "cycle_complete") {
          queryClient.invalidateQueries({ queryKey: ["alpha-factors"] })
          addActivity("info", `사이클 완료: ${event.factors_found ?? 0}개 팩터 발견`)
        }
      }

      if (type === "factory_stopped") {
        queryClient.invalidateQueries({ queryKey: ["alpha-factory-status"] })
        queryClient.invalidateQueries({ queryKey: ["alpha-factors"] })
        addActivity("info", "팩토리 중지")
      }
    },
    [queryClient, addActivity],
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
      max_cycles: parsedMaxCycles && parsedMaxCycles > 0 ? parsedMaxCycles : undefined,
      data_interval: dataInterval,
    })
  }

  const wfPhase = wfStatus?.phase ?? ""
  const isEmergencyStopped = wfPhase === "EMERGENCY_STOP"
  const wfActive = !!wfStatus && !isEmergencyStopped

  const handleWorkflowToggle = (checked: boolean) => {
    if (checked) {
      triggerWorkflow.mutate("resume")
    } else {
      triggerWorkflow.mutate("emergency_stop")
    }
  }

  return (
    <div className="space-y-4">
      {/* 워크플로우 자동화 토글 */}
      <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium">자동 워크플로우</span>
          <Badge
            variant={isEmergencyStopped ? "destructive" : "outline"}
            className="text-[10px]"
          >
            {wfPhase || "OFF"}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground">
            {wfActive ? "watchdog 활성" : "watchdog 비활성"}
          </span>
          <Switch
            checked={wfActive}
            onCheckedChange={handleWorkflowToggle}
            disabled={triggerWorkflow.isPending}
          />
        </div>
      </div>

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

      {/* 가동 중: 이번 사이클 발견 팩터 */}
      {isRunning && (
        <DiscoveredInCycle iterations={cycleIterations} />
      )}

      {/* 가동 중: 실시간 활동 피드 */}
      {isRunning && (
        <ActivityFeed entries={activityLog} />
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
          </div>
        </div>
      )}
    </div>
  )
}

export default AlphaFactoryControl
