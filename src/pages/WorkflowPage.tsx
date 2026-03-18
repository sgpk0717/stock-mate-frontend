import { useState, useEffect } from "react"
import {
  useWorkflowStatus,
  useWorkflowHistory,
  useWorkflowEvents,
  useBestFactors,
  useTriggerWorkflow,
  useMcpAudit,
  useTradingStatus,
} from "@/hooks/queries"
import { useTelegramLogs } from "@/hooks/queries/use-telegram"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { formatPercent } from "@/lib/format"
import {
  CheckCircle2,
  Circle,
  Clock,
  MessageSquare,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Activity,
  Zap,
  XCircle,
  Terminal,
  Moon,
  Sun,
  Search,
  Eye,
  BarChart2,
  Cpu,
  Wrench,
  TrendingUp,
} from "lucide-react"

// ─── 상수 ────────────────────────────────────────────────────────────────────

const PHASES = ["IDLE", "PRE_MARKET", "TRADING", "MARKET_CLOSE", "REVIEW", "MINING"] as const
type Phase = (typeof PHASES)[number] | "EMERGENCY_STOP"

const PHASE_LABELS: Record<string, string> = {
  IDLE: "대기",
  PRE_MARKET: "장 전",
  TRADING: "매매",
  MARKET_CLOSE: "장 마감",
  REVIEW: "리뷰",
  MINING: "마이닝",
  EMERGENCY_STOP: "긴급정지",
}

const TRIGGER_LABELS: Record<string, string> = {
  pre_market: "사전 점검",
  market_open: "장 개장",
  market_close: "장 마감",
  review: "일일 리뷰",
  mining: "야간 마이닝",
}

// 다음 스케줄 (KST 시:분)
const NEXT_SCHEDULE: { phase: string; hour: number; minute: number }[] = [
  { phase: "PRE_MARKET", hour: 8, minute: 30 },
  { phase: "TRADING", hour: 9, minute: 0 },
  { phase: "MARKET_CLOSE", hour: 15, minute: 30 },
  { phase: "REVIEW", hour: 16, minute: 0 },
  { phase: "MINING", hour: 18, minute: 0 },
]

const PHASE_COLORS: Record<string, string> = {
  IDLE: "bg-gray-100 text-gray-700",
  PRE_MARKET: "bg-blue-100 text-blue-700",
  TRADING: "bg-green-100 text-green-700",
  MARKET_CLOSE: "bg-yellow-100 text-yellow-700",
  REVIEW: "bg-purple-100 text-purple-700",
  MINING: "bg-indigo-100 text-indigo-700",
  EMERGENCY_STOP: "bg-red-100 text-red-700",
}

const STATUS_COLORS: Record<string, string> = {
  RUNNING: "bg-green-100 text-green-700",
  COMPLETED: "bg-gray-100 text-gray-700",
  FAILED: "bg-red-100 text-red-700",
  STOPPED: "bg-red-100 text-red-700",
  SKIPPED: "bg-yellow-100 text-yellow-700",
  NO_RUN: "bg-gray-100 text-gray-500",
}

// 백엔드 step_status 키는 소문자 step_name, 프론트 PHASES는 대문자
const PHASE_TO_STEP: Record<string, string> = {
  PRE_MARKET: "pre_market",
  TRADING: "market_open",
  MARKET_CLOSE: "market_close",
  REVIEW: "review",
  MINING: "mining",
}

// step_status 값은 문자열 또는 { status, at, detail } 객체
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function resolveStepStatus(raw: any): string | undefined {
  if (!raw) return undefined
  if (typeof raw === "string") return raw.toLowerCase()
  if (typeof raw === "object" && raw.status) return String(raw.status).toLowerCase()
  return undefined
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function resolveStepTimestamp(raw: any): string | undefined {
  if (!raw) return undefined
  if (typeof raw === "object" && raw.at) {
    // 백엔드 at 필드는 KST ISO (2026-03-18T10:15:21+09:00)
    // offset 포함이면 그대로, naive이면 KST로 간주 (+09:00 추가)
    const ts: string = raw.at
    if (ts.includes("+") || ts.endsWith("Z")) return ts
    return ts + "+09:00"
  }
  return undefined
}

// ─── 유틸 ────────────────────────────────────────────────────────────────────

function toKSTDateString(iso: string): string {
  return new Date(iso).toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" })
}

function toKSTTimeString(iso: string): string {
  return new Date(iso).toLocaleTimeString("ko-KR", {
    timeZone: "Asia/Seoul",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function todayKST(): string {
  return new Date().toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" })
}

function getNextScheduleETA(): { phase: string; eta: string } | null {
  const now = new Date()
  // KST offset: UTC+9
  const kstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000)
  const kstHour = kstNow.getUTCHours()
  const kstMinute = kstNow.getUTCMinutes()
  const nowMinutes = kstHour * 60 + kstMinute

  for (const s of NEXT_SCHEDULE) {
    const scheduleMinutes = s.hour * 60 + s.minute
    if (scheduleMinutes > nowMinutes) {
      const diff = scheduleMinutes - nowMinutes
      const h = Math.floor(diff / 60)
      const m = diff % 60
      const eta = h > 0 ? `${h}시간 ${m}분 후` : `${m}분 후`
      return { phase: s.phase, eta }
    }
  }
  // 내일 첫 스케줄
  const first = NEXT_SCHEDULE[0]
  const diff = 24 * 60 - nowMinutes + first.hour * 60 + first.minute
  const h = Math.floor(diff / 60)
  const m = diff % 60
  return { phase: first.phase, eta: `${h}시간 ${m}분 후` }
}

function stripHtml(text: string): string {
  return text.replace(/<[^>]*>/g, "")
}

function elapsedString(isoStart: string): string {
  const diff = Math.floor((Date.now() - new Date(isoStart).getTime()) / 1000)
  if (diff < 60) return `${diff}초`
  if (diff < 3600) return `${Math.floor(diff / 60)}분`
  return `${Math.floor(diff / 3600)}시간 ${Math.floor((diff % 3600) / 60)}분`
}

// ─── PhaseStepper ────────────────────────────────────────────────────────────

function PhaseStepper({
  currentPhase,
  stepStatus,
  phaseTimestamps,
}: {
  currentPhase: Phase
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  stepStatus: Record<string, any> | null | undefined
  phaseTimestamps: Record<string, string>
}) {
  const isEmergency = currentPhase === "EMERGENCY_STOP"

  function getNodeState(phase: string): "current" | "done" | "failed" | "future" {
    if (phase === currentPhase && !isEmergency) return "current"
    const stepKey = PHASE_TO_STEP[phase] ?? phase
    const s = resolveStepStatus(stepStatus?.[stepKey])
    if (s === "completed") return "done"
    if (s === "failed" || s === "stopped" || s === "error") return "failed"
    if (s === "running") return "current"
    return "future"
  }

  function isLineCompleted(phase: string): boolean {
    return getNodeState(phase) === "done"
  }

  return (
    <Card>
      <CardContent className="pt-6">
        {isEmergency && (
          <div className="mb-4 flex items-center gap-2 rounded-md bg-red-50 px-4 py-2 text-sm font-semibold text-red-700">
            <XCircle className="h-4 w-4" />
            긴급 정지 상태
          </div>
        )}
        <div className="flex items-start justify-between">
          {PHASES.map((phase, idx) => {
            const state = getNodeState(phase)
            const ts = phaseTimestamps[phase]
            const isLast = idx === PHASES.length - 1
            return (
              <div key={phase} className="flex flex-1 flex-col items-center">
                {/* 노드 + 연결선 */}
                <div className="flex w-full items-center">
                  {/* 왼쪽 연결선 */}
                  {idx > 0 && (
                    <div
                      className={`h-0.5 flex-1 ${
                        isLineCompleted(PHASES[idx - 1]) ? "bg-gray-400" : "border-t border-dashed border-gray-300"
                      }`}
                    />
                  )}
                  {/* 노드 */}
                  <div className="relative flex shrink-0 flex-col items-center">
                    {state === "current" && (
                      <span className="absolute inset-0 animate-ping rounded-full bg-[#4056F4] opacity-30" />
                    )}
                    <div
                      className={`relative z-10 flex h-9 w-9 items-center justify-center rounded-full border-2 ${
                        state === "current"
                          ? "border-[#4056F4] bg-[#4056F4] text-white"
                          : state === "done"
                          ? "border-gray-400 bg-gray-100 text-gray-600"
                          : state === "failed"
                          ? "border-red-500 bg-red-50 text-red-600"
                          : "border-gray-200 bg-white text-gray-300"
                      }`}
                    >
                      {state === "done" ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : state === "failed" ? (
                        <XCircle className="h-4 w-4" />
                      ) : state === "current" ? (
                        <Activity className="h-4 w-4" />
                      ) : (
                        <Circle className="h-4 w-4" />
                      )}
                    </div>
                  </div>
                  {/* 오른쪽 연결선 */}
                  {!isLast && (
                    <div
                      className={`h-0.5 flex-1 ${
                        isLineCompleted(phase) ? "bg-gray-400" : "border-t border-dashed border-gray-300"
                      }`}
                    />
                  )}
                </div>
                {/* 레이블 + 타임스탬프 */}
                <div className="mt-2 flex flex-col items-center gap-0.5">
                  <span
                    className={`text-[11px] font-semibold ${
                      state === "current"
                        ? "text-[#4056F4]"
                        : state === "done"
                        ? "text-gray-500"
                        : state === "failed"
                        ? "text-red-500"
                        : "text-gray-300"
                    }`}
                  >
                    {PHASE_LABELS[phase] ?? phase}
                  </span>
                  {ts && (
                    <span className="text-[10px] text-muted-foreground">{toKSTTimeString(ts)}</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

// ─── CurrentPhasePanel ───────────────────────────────────────────────────────

function CurrentPhasePanel({
  status,
  recentEvents,
  liveTradeSummary,
}: {
  status: {
    phase?: string
    status?: string
    mining_running?: boolean
    mining_cycles?: number | null
    mining_factors?: number | null
    message?: string
  } | null | undefined
  recentEvents: { id: string; event_type?: string | null; message?: string | null; created_at?: string }[]
  liveTradeSummary: { sessions: number; trades: number; positions: number } | null
}) {
  const [, tick] = useState(0)
  useEffect(() => {
    const t = setInterval(() => tick((v) => v + 1), 30_000)
    return () => clearInterval(t)
  }, [])

  const nextETA = getNextScheduleETA()
  const phase = status?.phase ?? "IDLE"
  const phaseLabel = PHASE_LABELS[phase] ?? phase

  // 첫 번째 이벤트에서 시작 시각 추정 (events 배열의 첫 항목)
  const firstEvent = recentEvents[0]
  const startISO = firstEvent?.created_at

  return (
    <Card className="flex-1">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Activity className="h-4 w-4 text-[#4056F4]" />
          현재 상태
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 페이즈 + 상태 */}
        <div className="flex items-center gap-3">
          <Badge className={`${PHASE_COLORS[phase] ?? ""} text-sm px-3 py-1`}>
            {phaseLabel}
          </Badge>
          {status?.status && (
            <Badge variant="outline" className={STATUS_COLORS[status.status] ?? ""}>
              {status.status}
            </Badge>
          )}
        </div>

        {/* 시작 시각 + 경과 */}
        {startISO && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>시작: {toKSTTimeString(startISO)}</span>
            <span className="text-gray-300">|</span>
            <span>경과: {elapsedString(startISO)}</span>
          </div>
        )}

        {/* 마이닝 진행 */}
        {status?.mining_running && (
          <div className="flex items-center gap-4 rounded-md bg-indigo-50 px-3 py-2 text-xs">
            <span className="flex items-center gap-1 font-medium text-indigo-700">
              <Zap className="h-3 w-3" /> 마이닝 진행 중
            </span>
            <span className="text-indigo-600">사이클 {status.mining_cycles ?? 0}회</span>
            <span className="text-indigo-600">발견 {status.mining_factors ?? 0}개</span>
          </div>
        )}

        {/* 실시간 매매 */}
        {liveTradeSummary && liveTradeSummary.sessions > 0 && phase === "TRADING" && (
          <div className="flex items-center gap-4 rounded-md bg-green-50 px-3 py-2 text-xs">
            <span className="flex items-center gap-1 font-medium text-green-700">
              <Activity className="h-3 w-3" /> 장중 매매 진행 중
            </span>
            <span className="text-green-600">{liveTradeSummary.sessions}세션</span>
            <span className="text-green-600">{liveTradeSummary.trades}건 체결</span>
            <span className="text-green-600">{liveTradeSummary.positions}포지션</span>
          </div>
        )}

        {/* 최근 이벤트 */}
        {recentEvents.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">최근 활동</p>
            {recentEvents.slice(-3).reverse().map((evt) => (
              <div key={evt.id} className="flex items-start gap-2 rounded px-2 py-1 text-xs bg-muted/30">
                <span className="shrink-0 font-mono text-muted-foreground mt-0.5">
                  {evt.created_at ? toKSTTimeString(evt.created_at) : ""}
                </span>
                {evt.event_type && (
                  <Badge variant="outline" className="shrink-0 text-[9px] py-0">
                    {evt.event_type}
                  </Badge>
                )}
                <span className="text-muted-foreground leading-tight">{evt.message}</span>
              </div>
            ))}
          </div>
        )}

        {/* 다음 스케줄 ETA */}
        {nextETA && (
          <div className="flex items-center gap-2 rounded-md border border-dashed px-3 py-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3 shrink-0" />
            <span>
              다음: <span className="font-medium text-foreground">{PHASE_LABELS[nextETA.phase] ?? nextETA.phase}</span>
              {" "}<span className="text-[#4056F4]">{nextETA.eta}</span>
            </span>
          </div>
        )}

        {/* 상태 메시지 */}
        {status?.message && (
          <p className="text-xs text-muted-foreground border-t pt-2">{status.message}</p>
        )}
      </CardContent>
    </Card>
  )
}

// ─── PhaseResultSidebar ──────────────────────────────────────────────────────

function PhaseResultSidebar({
  status,
  todayRun,
  liveTradeSummary,
}: {
  status: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    step_status?: Record<string, any> | null
    selected_factor_name?: string | null
    selected_factor_ic?: number | null
    trade_count?: number
    pnl_pct?: number | null
    mining_cycles?: number | null
    mining_factors?: number | null
    phase?: string
  } | null | undefined
  todayRun: {
    review_summary?: Record<string, unknown> | null
    completed_at?: string | null
  } | null | undefined
  liveTradeSummary: { sessions: number; trades: number; positions: number } | null
}) {
  const stepStatus = status?.step_status ?? {}

  const phases: {
    key: string
    label: string
    content: () => React.ReactNode
  }[] = [
    {
      key: "PRE_MARKET",
      label: "장 전",
      content: () =>
        status?.selected_factor_name ? (
          <div className="text-xs">
            <span className="font-medium">{status.selected_factor_name}</span>
            {status.selected_factor_ic != null && (
              <span className="ml-1 text-muted-foreground">IC {status.selected_factor_ic.toFixed(4)}</span>
            )}
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">팩터 없음</span>
        ),
    },
    {
      key: "TRADING",
      label: "매매",
      content: () => {
        // TRADING 중이고 workflow trade_count가 0이면 실시간 데이터 사용
        const tradeCount = (status?.trade_count ?? 0) > 0
          ? status!.trade_count!
          : liveTradeSummary?.trades ?? 0
        return (
          <div className="text-xs flex gap-2">
            <span>{tradeCount}건</span>
            {liveTradeSummary && status?.phase === "TRADING" && (
              <span className="text-muted-foreground">
                ({liveTradeSummary.sessions}세션, {liveTradeSummary.positions}포지션)
              </span>
            )}
            {status?.pnl_pct != null && (
              <span className={status.pnl_pct >= 0 ? "text-green-600" : "text-red-600"}>
                {formatPercent(status.pnl_pct)}
              </span>
            )}
          </div>
        )
      },
    },
    {
      key: "MARKET_CLOSE",
      label: "장 마감",
      content: () =>
        todayRun?.completed_at ? (
          <span className="text-xs text-muted-foreground">{toKSTTimeString(todayRun.completed_at)}</span>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
    },
    {
      key: "REVIEW",
      label: "리뷰",
      content: () => {
        const summary = todayRun?.review_summary
        if (!summary) return <span className="text-xs text-muted-foreground">—</span>
        const text =
          typeof summary === "string"
            ? summary
            : (summary as Record<string, unknown>).summary ?? JSON.stringify(summary)
        return (
          <p className="text-xs text-muted-foreground line-clamp-2">{String(text)}</p>
        )
      },
    },
    {
      key: "MINING",
      label: "마이닝",
      content: () => (
        <div className="text-xs flex gap-2">
          <span>{status?.mining_cycles ?? 0}사이클</span>
          <span>{status?.mining_factors ?? 0}개 발견</span>
        </div>
      ),
    },
  ]

  // step_status 키 매핑 + 객체 값 파싱으로 완료 여부 확인
  const completedPhases = phases.filter((p) => {
    const stepKey = PHASE_TO_STEP[p.key] ?? p.key
    return resolveStepStatus(stepStatus[stepKey]) === "completed"
  })
  // TRADING은 세션이 running이면 "진행 중"으로도 표시
  const activePhases = phases.filter((p) => {
    if (p.key === "TRADING" && liveTradeSummary && liveTradeSummary.sessions > 0) return true
    const stepKey = PHASE_TO_STEP[p.key] ?? p.key
    return resolveStepStatus(stepStatus[stepKey]) === "running"
  })
  const visiblePhases = [...completedPhases, ...activePhases.filter(
    (a) => !completedPhases.some((c) => c.key === a.key)
  )]

  return (
    <Card className="w-72 shrink-0">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">단계별 결과</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {visiblePhases.length === 0 ? (
          <p className="text-xs text-muted-foreground">완료된 단계 없음</p>
        ) : (
          visiblePhases.map((p) => {
            const stepKey = PHASE_TO_STEP[p.key] ?? p.key
            const isDone = resolveStepStatus(stepStatus[stepKey]) === "completed"
            return (
              <div key={p.key} className="space-y-1">
                <div className="flex items-center gap-1.5">
                  {isDone ? (
                    <CheckCircle2 className="h-3 w-3 text-gray-400" />
                  ) : (
                    <Activity className="h-3 w-3 text-[#4056F4]" />
                  )}
                  <span className="text-xs font-medium">{p.label}</span>
                  {!isDone && (
                    <Badge className="text-[9px] py-0 bg-green-100 text-green-700">진행 중</Badge>
                  )}
                </div>
                <div className="pl-4">{p.content()}</div>
              </div>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}

// ─── OpenClawSchedulePanel ───────────────────────────────────────────────────

const OPENCLAW_CRONS = [
  { name: "overnight_check",      hour: 2,  label: "야간 점검",   tool: "get_system_health",       Icon: Moon      },
  { name: "morning_brief",        hour: 7,  label: "모닝 브리프", tool: "get_trading_review",      Icon: Sun       },
  { name: "pre_market_check",     hour: 8,  label: "장 전 점검",  tool: "get_workflow_status",     Icon: Search    },
  { name: "midday_check",         hour: 12, label: "장중 감시",   tool: "get_workflow_status",     Icon: Eye       },
  { name: "post_market_analysis", hour: 16, label: "장후 분석",   tool: "submit_trading_feedback", Icon: BarChart2 },
  { name: "mining_review",        hour: 20, label: "마이닝 리뷰", tool: "get_factor_performance",  Icon: Cpu       },
  { name: "project_improvement",  hour: 22, label: "개선 검토",   tool: "get_error_logs",          Icon: Wrench    },
] as const

function OpenClawSchedulePanel({
  auditLogs,
}: {
  auditLogs: {
    id: string
    tool_name: string
    status: "success" | "blocked" | "error"
    execution_ms: number | null
    created_at: string
  }[]
}) {
  const today = todayKST()

  // 오늘 날짜 audit 로그만 필터
  const todayLogs = auditLogs.filter((log) => toKSTDateString(log.created_at) === today)

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Terminal className="h-4 w-4 text-[#4056F4]" />
          OpenClaw 크론잡
          <span className="ml-auto text-xs font-normal text-muted-foreground">
            실제 실행 기록 기반
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {OPENCLAW_CRONS.map((cron) => {
            // 오늘 해당 tool_name으로 실행된 기록 중 가장 최근
            const executed = todayLogs
              .filter((l) => l.tool_name === cron.tool)
              .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]

            return (
              <div
                key={cron.name}
                className="flex items-center gap-3 rounded-md border px-3 py-2"
              >
                {/* 예정 시각 */}
                <span className="w-10 shrink-0 text-center font-mono text-[11px] text-muted-foreground">
                  {String(cron.hour).padStart(2, "0")}:00
                </span>

                {/* 아이콘 + 레이블 */}
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  <cron.Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="text-xs font-medium truncate">{cron.label}</span>
                  <span className="text-[10px] text-muted-foreground truncate hidden sm:block">
                    ({cron.tool})
                  </span>
                </div>

                {/* 실행 결과 */}
                {executed ? (
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] text-muted-foreground font-mono">
                      {toKSTTimeString(executed.created_at)} 실행됨
                    </span>
                    <Badge
                      variant="outline"
                      className={`text-[9px] py-0 ${
                        executed.status === "success"
                          ? "text-green-600 border-green-300"
                          : executed.status === "blocked"
                          ? "text-yellow-600 border-yellow-300"
                          : "text-red-600 border-red-300"
                      }`}
                    >
                      {executed.status}
                    </Badge>
                    {executed.execution_ms != null && (
                      <span className="text-[10px] text-muted-foreground">
                        {executed.execution_ms}ms
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-[11px] text-muted-foreground shrink-0">대기 중</span>
                )}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

// ─── TodayTimeline ───────────────────────────────────────────────────────────

type TimelineItem =
  | {
      kind: "event"
      id: string
      ts: string
      eventType: string | null | undefined
      message: string | null | undefined
      phase: string | null | undefined
    }
  | {
      kind: "telegram"
      id: string
      ts: string
      category: string
      text: string
      status: string
    }
  | {
      kind: "mcp"
      id: string
      ts: string
      toolName: string
      status: "success" | "blocked" | "error"
      executionMs: number | null
    }

function TodayTimeline({
  events,
  telegramLogs,
  mcpLogs,
}: {
  events: {
    id: string
    event_type?: string | null
    message?: string | null
    phase?: string | null
    created_at?: string
  }[]
  telegramLogs: {
    id: string
    category: string
    text: string
    status: string
    created_at: string
  }[]
  mcpLogs: {
    id: string
    tool_name: string
    status: "success" | "blocked" | "error"
    execution_ms: number | null
    created_at: string
  }[]
}) {
  const today = todayKST()

  const items: TimelineItem[] = [
    ...events
      .filter((e) => e.created_at && toKSTDateString(e.created_at) === today)
      .map<TimelineItem>((e) => ({
        kind: "event",
        id: e.id,
        ts: e.created_at!,
        eventType: e.event_type,
        message: e.message,
        phase: e.phase,
      })),
    ...telegramLogs
      .filter((t) => toKSTDateString(t.created_at) === today)
      .map<TimelineItem>((t) => ({
        kind: "telegram",
        id: t.id,
        ts: t.created_at,
        category: t.category,
        text: t.text,
        status: t.status,
      })),
    ...mcpLogs
      .filter((m) => toKSTDateString(m.created_at) === today)
      .map<TimelineItem>((m) => ({
        kind: "mcp",
        id: m.id,
        ts: m.created_at,
        toolName: m.tool_name,
        status: m.status,
        executionMs: m.execution_ms,
      })),
  ].sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime())

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4 text-[#4056F4]" />
          오늘 타임라인
          <span className="ml-auto text-xs font-normal text-muted-foreground">
            {items.length}건
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-80">
          {items.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">오늘 활동 없음</p>
          ) : (
            <div className="relative pl-6">
              {/* 세로선 */}
              <div className="absolute left-2 top-0 h-full w-px bg-border" />
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="relative">
                    {/* 도트 */}
                    <div
                      className={`absolute -left-4 top-1 h-2.5 w-2.5 rounded-full border-2 border-white ${
                        item.kind === "telegram"
                          ? item.status === "failed"
                            ? "bg-red-400"
                            : "bg-[#E3B23C]"
                          : item.kind === "mcp"
                          ? item.status === "error" || item.status === "blocked"
                            ? "bg-red-400"
                            : "bg-gray-400"
                          : "bg-[#4056F4]"
                      }`}
                    />
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-muted-foreground shrink-0">
                          {toKSTTimeString(item.ts)}
                        </span>
                        {item.kind === "telegram" ? (
                          <>
                            {item.status === "failed" ? (
                              <AlertTriangle className="h-3 w-3 text-red-500 shrink-0" />
                            ) : (
                              <MessageSquare className="h-3 w-3 text-[#E3B23C] shrink-0" />
                            )}
                            <Badge variant="outline" className="text-[9px] py-0 shrink-0">
                              {item.category}
                            </Badge>
                          </>
                        ) : item.kind === "mcp" ? (
                          <>
                            <Terminal className={`h-3 w-3 shrink-0 ${
                              item.status === "error" || item.status === "blocked"
                                ? "text-red-500"
                                : "text-gray-500"
                            }`} />
                            <Badge variant="outline" className="text-[9px] py-0 shrink-0">
                              {item.toolName}
                            </Badge>
                            <Badge
                              variant="outline"
                              className={`text-[9px] py-0 shrink-0 ${
                                item.status === "success"
                                  ? "text-green-600 border-green-300"
                                  : item.status === "blocked"
                                  ? "text-yellow-600 border-yellow-300"
                                  : "text-red-600 border-red-300"
                              }`}
                            >
                              {item.status}
                            </Badge>
                          </>
                        ) : (
                          <>
                            {item.eventType === "mining_cycle" ? (
                              <Cpu className="h-3 w-3 text-indigo-500 shrink-0" />
                            ) : item.eventType === "trade_tick" ? (
                              <TrendingUp className="h-3 w-3 text-green-500 shrink-0" />
                            ) : item.message?.includes("[ERROR]") ? (
                              <AlertTriangle className="h-3 w-3 text-red-500 shrink-0" />
                            ) : (
                              <Activity className="h-3 w-3 text-[#4056F4] shrink-0" />
                            )}
                            {item.eventType && (
                              <Badge variant="outline" className={`text-[9px] py-0 shrink-0 ${
                                item.eventType === "mining_cycle" ? "text-indigo-600 border-indigo-300" :
                                item.eventType === "trade_tick" ? "text-green-600 border-green-300" :
                                ""
                              }`}>
                                {item.eventType === "mining_cycle" ? "마이닝" :
                                 item.eventType === "trade_tick" ? "매매" :
                                 item.eventType}
                              </Badge>
                            )}
                          </>
                        )}
                      </div>
                      <p
                        className={`text-xs leading-snug ${
                          (item.kind === "telegram" && item.status === "failed") ||
                          (item.kind === "mcp" && (item.status === "error" || item.status === "blocked"))
                            ? "text-red-600"
                            : "text-muted-foreground"
                        }`}
                      >
                        {item.kind === "telegram"
                          ? (() => { const t = stripHtml(item.text); return t.slice(0, 100) + (t.length > 100 ? "…" : "") })()
                          : item.kind === "mcp"
                          ? `${item.toolName}${item.executionMs != null ? ` (${item.executionMs}ms)` : ""}`
                          : item.message}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────

function WorkflowPage() {
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null)
  const [historyOpen, setHistoryOpen] = useState(false)

  const { data: status } = useWorkflowStatus()
  const { data: history } = useWorkflowHistory()
  const { data: bestFactors } = useBestFactors()
  const { data: telegramLogs } = useTelegramLogs({ limit: 100 })
  const { data: mcpAuditLogs } = useMcpAudit({ limit: 100 })
  const { data: tradingSessions } = useTradingStatus()
  const trigger = useTriggerWorkflow()

  // 오늘 워크플로우 run
  const todayStr = new Date().toISOString().slice(0, 10)
  const todayRun = history?.find((r) => String(r.date) === todayStr) ?? null
  const todayRunId = todayRun?.id ?? null

  // 오늘 run의 이벤트 자동 조회
  const { data: todayEvents } = useWorkflowEvents(todayRunId)

  // 선택된 run 이벤트 (히스토리 아코디언용)
  const { data: selectedEvents } = useWorkflowEvents(
    selectedRunId && selectedRunId !== todayRunId ? selectedRunId : null
  )
  const displayEvents = selectedRunId === todayRunId ? todayEvents : selectedEvents

  // 실시간 매매 요약 (TRADING 중일 때 /trading/status에서)
  const liveTradeSummary = (() => {
    if (!Array.isArray(tradingSessions) || tradingSessions.length === 0) return null
    const running = tradingSessions.filter(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (s: any) => s.status === "running"
    )
    if (running.length === 0) return null
    return {
      sessions: running.length,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      trades: running.reduce((sum: number, s: any) => sum + (s.trade_count ?? 0), 0),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      positions: running.reduce((sum: number, s: any) => sum + Object.keys(s.positions ?? {}).length, 0),
    }
  })()

  // step_status에서 타임스탬프 추출 (phase_transition 이벤트보다 확실)
  const stepStatus = status?.step_status as Record<string, unknown> | null | undefined
  const phaseTimestamps: Record<string, string> = {}
  for (const [phase, stepKey] of Object.entries(PHASE_TO_STEP)) {
    const raw = stepStatus?.[stepKey]
    const ts = resolveStepTimestamp(raw)
    if (ts) phaseTimestamps[phase] = ts
  }
  // phase_transition 이벤트도 보조로 사용 (step_status에 없는 경우)
  if (todayEvents) {
    for (const evt of todayEvents) {
      if (evt.event_type === "phase_transition" && evt.phase && evt.created_at) {
        if (!phaseTimestamps[evt.phase]) {
          phaseTimestamps[evt.phase] = evt.created_at
        }
      }
    }
  }

  const handleTrigger = (phase: string) => {
    if (phase === "emergency_stop") {
      if (!window.confirm("긴급 정지를 실행하시겠습니까? 모든 포지션이 청산됩니다.")) return
    }
    trigger.mutate(phase)
  }

  return (
    <div className="flex flex-col gap-5 p-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">워크플로우 모니터</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {status?.date ? String(status.date) : todayStr} · 10초마다 갱신
          </p>
        </div>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => handleTrigger("emergency_stop")}
          disabled={trigger.isPending}
        >
          긴급 정지
        </Button>
      </div>

      {/* 파이프라인 스테퍼 */}
      <PhaseStepper
        currentPhase={(status?.phase ?? "IDLE") as Phase}
        stepStatus={stepStatus}
        phaseTimestamps={phaseTimestamps}
      />

      {/* OpenClaw 크론잡 */}
      <OpenClawSchedulePanel
        auditLogs={(mcpAuditLogs ?? []) as {
          id: string
          tool_name: string
          status: "success" | "blocked" | "error"
          execution_ms: number | null
          created_at: string
        }[]}
      />

      {/* 현재 상태 + 단계별 결과 */}
      <div className="flex gap-4">
        <CurrentPhasePanel
          status={status}
          recentEvents={todayEvents ?? []}
          liveTradeSummary={liveTradeSummary}
        />
        <PhaseResultSidebar
          status={status}
          todayRun={todayRun}
          liveTradeSummary={liveTradeSummary}
        />
      </div>

      {/* 오늘 타임라인 */}
      <TodayTimeline
        events={todayEvents ?? []}
        telegramLogs={(telegramLogs ?? []) as {
          id: string
          category: string
          text: string
          status: string
          created_at: string
        }[]}
        mcpLogs={(mcpAuditLogs ?? []) as {
          id: string
          tool_name: string
          status: "success" | "blocked" | "error"
          execution_ms: number | null
          created_at: string
        }[]}
      />

      {/* 수동 트리거 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">수동 트리거</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {Object.entries(TRIGGER_LABELS).map(([phase, label]) => (
            <Button
              key={phase}
              variant="outline"
              size="sm"
              onClick={() => handleTrigger(phase)}
              disabled={trigger.isPending}
            >
              {label}
            </Button>
          ))}
        </CardContent>
      </Card>

      {/* 히스토리 아코디언 */}
      <Card>
        <button
          type="button"
          className="flex w-full items-center justify-between px-6 py-4 text-sm font-semibold hover:bg-muted/30 transition-colors"
          onClick={() => setHistoryOpen((v) => !v)}
        >
          <span>히스토리 (최근 30일)</span>
          {historyOpen ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
        {historyOpen && (
          <CardContent className="pt-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>날짜</TableHead>
                  <TableHead>Phase</TableHead>
                  <TableHead>PnL</TableHead>
                  <TableHead>거래수</TableHead>
                  <TableHead>상태</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history?.map((run) => (
                  <TableRow
                    key={run.id}
                    className={`cursor-pointer hover:bg-muted/50 ${
                      selectedRunId === run.id ? "bg-muted/50" : ""
                    }`}
                    onClick={() =>
                      setSelectedRunId((prev) => (prev === run.id ? null : run.id))
                    }
                  >
                    <TableCell className="font-mono text-xs">{String(run.date)}</TableCell>
                    <TableCell>
                      <Badge className={PHASE_COLORS[run.phase] ?? "bg-gray-100 text-gray-700"}>
                        {run.phase}
                      </Badge>
                    </TableCell>
                    <TableCell
                      className={
                        (run.pnl_pct ?? 0) >= 0 ? "text-green-600" : "text-red-600"
                      }
                    >
                      {run.pnl_pct != null ? formatPercent(run.pnl_pct) : "-"}
                    </TableCell>
                    <TableCell>{run.trade_count}건</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={STATUS_COLORS[run.status] ?? ""}
                      >
                        {run.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {(!history || history.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      워크플로우 기록 없음
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            {/* 선택된 run 이벤트 */}
            {selectedRunId && (
              <div className="mt-4 border-t pt-4">
                <p className="mb-2 text-xs font-medium text-muted-foreground">
                  이벤트 로그 — {selectedRunId.slice(0, 8)}…
                </p>
                <ScrollArea className="h-48">
                  <div className="space-y-1">
                    {displayEvents?.map((evt) => (
                      <div
                        key={evt.id}
                        className="flex gap-3 rounded px-2 py-1 text-xs hover:bg-muted/50"
                      >
                        <span className="shrink-0 font-mono text-muted-foreground">
                          {evt.created_at ? toKSTTimeString(evt.created_at) : ""}
                        </span>
                        <Badge variant="outline" className="shrink-0 text-[9px]">
                          {evt.event_type}
                        </Badge>
                        <span className="truncate text-muted-foreground">{evt.message}</span>
                      </div>
                    ))}
                    {(!displayEvents || displayEvents.length === 0) && (
                      <p className="py-4 text-center text-sm text-muted-foreground">이벤트 없음</p>
                    )}
                  </div>
                </ScrollArea>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* 최적 팩터 (접어둠) */}
      {bestFactors && bestFactors.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">매매 가능 팩터 Top {bestFactors.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {bestFactors.slice(0, 3).map((f) => (
                <div key={f.factor_id} className="rounded-md border p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{f.factor_name}</span>
                    <Badge variant="outline">{f.composite_score.toFixed(3)}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground truncate">{f.expression_str}</p>
                  <div className="mt-1 flex gap-3 text-xs text-muted-foreground">
                    <span>IC: {f.ic_mean?.toFixed(4) ?? "-"}</span>
                    <span>Sharpe: {f.sharpe?.toFixed(2) ?? "-"}</span>
                    {f.causal_robust != null && (
                      <span>{f.causal_robust ? "인과 ✓" : "인과 ✗"}</span>
                    )}
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

export default WorkflowPage
