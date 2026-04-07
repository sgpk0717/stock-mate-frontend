import { useState, useMemo, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useLLMUsageSummary, useLLMUsageRecent } from "@/hooks/queries"
import { formatNumber } from "@/lib/format"
import { cn } from "@/lib/utils"
import CollectorDateSelector, { useCollectorDate, type CollectorDateValue } from "@/components/ui/collector-date-selector"
import type { LLMUsageSummary, LLMUsageLog } from "@/api/system"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area,
} from "recharts"
import { Zap, DollarSign, Clock, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react"

// ─── 상수 ────────────────────────────────────────────────────

const USD_TO_KRW = 1450

const CHART_COLORS = ["#4056F4", "#E3B23C", "#10B981", "#F97316", "#8B5CF6", "#EC4899", "#06B6D4", "#84CC16"]

const PROVIDER_COLORS: Record<string, string> = {
  gemini: "bg-emerald-100 text-emerald-700",
  anthropic: "bg-orange-100 text-orange-700",
}

const CALLER_LABELS: Record<string, string> = {
  "news.analyzer": "뉴스 감성",
  news_analyzer: "뉴스 감성",
  alpha_miner: "알파 마이너",
  alpha_factory: "알파 팩토리",
  "alpha.evolution": "알파 진화",
  trade_reviewer: "매매 리뷰",
  param_adjuster: "파라미터 조정",
  factor_chat: "팩터 대화",
  agent_manager: "AI 에이전트",
  simulation: "시뮬레이션",
}

// ─── 유틸 ────────────────────────────────────────────────────

function fmtTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

function fmtCost(usd: number): string {
  if (usd >= 1) return `$${usd.toFixed(2)}`
  if (usd >= 0.01) return `$${usd.toFixed(3)}`
  return `$${usd.toFixed(4)}`
}

function fmtKRW(usd: number): string {
  const krw = usd * USD_TO_KRW
  if (krw >= 1000) return `${formatNumber(Math.round(krw))}원`
  if (krw >= 1) return `${Math.round(krw)}원`
  return `${krw.toFixed(1)}원`
}

function fmtDuration(ms: number): string {
  if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`
  return `${Math.round(ms)}ms`
}

function fmtTime(iso: string | null): string {
  if (!iso) return "-"
  const d = new Date(iso)
  return d.toLocaleString("ko-KR", {
    month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit",
  })
}

// ─── Summary Cards ───────────────────────────────────────────

function SummaryCards({ t }: { t: LLMUsageSummary["totals"] }) {
  const cards = [
    {
      label: "총 호출",
      value: formatNumber(t.calls),
      sub: `${t.error_count > 0 ? `실패 ${t.error_count}건` : "에러 없음"}`,
      icon: Zap,
      color: "text-[#4056F4]",
    },
    {
      label: "총 토큰",
      value: fmtTokens(t.total_tokens),
      sub: `입력 ${fmtTokens(t.input_tokens)} / 출력 ${fmtTokens(t.output_tokens)}`,
      icon: Zap,
      color: "text-gray-700",
    },
    {
      label: "비용",
      value: fmtCost(t.cost_usd),
      sub: fmtKRW(t.cost_usd),
      icon: DollarSign,
      color: "text-[#E3B23C]",
    },
    {
      label: "평균 응답",
      value: fmtDuration(t.avg_duration_ms),
      sub: t.avg_duration_ms > 5000 ? "느림" : "정상",
      icon: Clock,
      color: t.avg_duration_ms > 5000 ? "text-red-600" : "text-emerald-600",
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {cards.map((c) => (
        <Card key={c.label}>
          <CardContent className="flex items-center gap-3 py-4">
            <div className={cn("rounded-lg bg-gray-100 p-2.5", c.color)}>
              <c.icon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-muted-foreground">{c.label}</p>
              <p className="text-xl font-bold tracking-tight">{c.value}</p>
              <p className="text-[10px] text-muted-foreground">{c.sub}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// ─── Daily Cost Chart (recharts) ─────────────────────────────

function DailyCostChart({ data }: { data: LLMUsageSummary["daily"] }) {
  const chartData = useMemo(() =>
    data.map((d) => ({
      date: d.date.slice(5),
      비용: +(d.cost_usd * USD_TO_KRW).toFixed(1),
      호출: d.calls,
      토큰: d.tokens,
      cost_usd: d.cost_usd,
    })),
  [data])

  if (data.length === 0) return null

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">일별 비용 추이</CardTitle>
          <span className="text-[10px] text-muted-foreground">단위: 원 (KRW)</span>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}원`} width={60} />
            <Tooltip
              formatter={(value: number, name: string) => {
                if (name === "비용") return [`${value.toLocaleString()}원`, "비용 (KRW)"]
                return [value, name]
              }}
              contentStyle={{ fontSize: 12, borderRadius: 8 }}
              labelStyle={{ fontWeight: 600 }}
            />
            <Bar dataKey="비용" fill="#4056F4" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

// ─── Daily Token Area Chart ──────────────────────────────────

function DailyTokenChart({ data }: { data: LLMUsageSummary["daily"] }) {
  const chartData = useMemo(() =>
    data.map((d) => ({
      date: d.date.slice(5),
      입력: d.input_tokens,
      출력: d.output_tokens,
    })),
  [data])

  if (data.length === 0) return null

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">일별 토큰 사용량</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={fmtTokens} width={50} />
            <Tooltip
              formatter={(value: number, name: string) => [fmtTokens(value), name]}
              contentStyle={{ fontSize: 12, borderRadius: 8 }}
            />
            <Area type="monotone" dataKey="입력" stackId="1" fill="#4056F4" fillOpacity={0.3} stroke="#4056F4" />
            <Area type="monotone" dataKey="출력" stackId="1" fill="#E3B23C" fillOpacity={0.3} stroke="#E3B23C" />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

// ─── Provider Pie ────────────────────────────────────────────

function ProviderPie({ data }: { data: LLMUsageSummary["by_provider"] }) {
  if (data.length === 0) return null

  const pieData = data.map((d) => ({
    name: d.provider,
    value: +(d.cost_usd * USD_TO_KRW).toFixed(1),
    calls: d.calls,
    tokens: d.tokens,
    cost_usd: d.cost_usd,
  }))

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">프로바이더별 비용</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center gap-4">
        <ResponsiveContainer width={140} height={140}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%" cy="50%"
              innerRadius={35} outerRadius={60}
              dataKey="value"
              stroke="none"
            >
              {pieData.map((_, i) => (
                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => [`${value.toLocaleString()}원`, "비용"]}
              contentStyle={{ fontSize: 11, borderRadius: 8 }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex-1 space-y-2">
          {data.map((d, i) => (
            <div key={d.provider} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[i] }} />
                <Badge className={cn("text-[9px]", PROVIDER_COLORS[d.provider] ?? "bg-gray-100")}>
                  {d.provider}
                </Badge>
                <span className="text-muted-foreground">{formatNumber(d.calls)}회</span>
              </div>
              <div className="text-right">
                <span className="font-medium">{fmtCost(d.cost_usd)}</span>
                <span className="ml-1 text-muted-foreground">({fmtKRW(d.cost_usd)})</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Caller Breakdown ────────────────────────────────────────

function CallerBreakdown({ data }: { data: LLMUsageSummary["by_caller"] }) {
  const totalCost = data.reduce((s, d) => s + d.cost_usd, 0)

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">호출자별 사용량</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2.5">
        {data.length === 0 && (
          <p className="py-4 text-center text-sm text-muted-foreground">
            선택한 기간에 LLM 호출 기록이 없습니다.
          </p>
        )}
        {data.map((d) => {
          const pct = totalCost > 0 ? (d.cost_usd / totalCost) * 100 : 0
          const label = CALLER_LABELS[d.caller] ?? d.caller
          return (
            <div key={d.caller} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{label}</span>
                  <span className="text-muted-foreground">{formatNumber(d.calls)}회</span>
                  <span className="text-muted-foreground">{fmtDuration(d.avg_ms)} avg</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">{fmtTokens(d.tokens)}</span>
                  <span className="font-medium">{fmtCost(d.cost_usd)}</span>
                  <span className="text-[10px] text-muted-foreground">({fmtKRW(d.cost_usd)})</span>
                </div>
              </div>
              <div className="h-1.5 w-full rounded-full bg-gray-100">
                <div
                  className="h-1.5 rounded-full bg-[#4056F4] transition-all"
                  style={{ width: `${Math.max(pct, 1)}%` }}
                />
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

// ─── Model Table ─────────────────────────────────────────────

function ModelTable({ data }: { data: LLMUsageSummary["by_model"] }) {
  if (data.length === 0) return null

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">모델별 상세</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1.5">
          {data.map((d) => (
            <div key={d.model} className="flex items-center justify-between rounded-lg border px-3 py-2 text-xs">
              <div className="flex items-center gap-2">
                <Badge className={cn("text-[9px]", PROVIDER_COLORS[d.provider] ?? "bg-gray-100")}>
                  {d.provider}
                </Badge>
                <span className="font-mono text-[11px]">{d.model}</span>
              </div>
              <div className="flex items-center gap-4 text-muted-foreground">
                <span>{formatNumber(d.calls)}회</span>
                <span>{fmtTokens(d.tokens)}</span>
                <span className="font-medium text-foreground">{fmtCost(d.cost_usd)}</span>
                <span className="text-[10px]">({fmtKRW(d.cost_usd)})</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Recent Logs ─────────────────────────────────────────────

function RecentLogs({ logs }: { logs: LLMUsageLog[] }) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const [showCount, setShowCount] = useState(20)

  const visible = logs.slice(0, showCount)

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">최근 호출 로그</CardTitle>
          <span className="text-[10px] text-muted-foreground">{logs.length}건</span>
        </div>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            아직 LLM 호출 기록이 없습니다. 뉴스 수집이나 알파 마이닝을 실행하면 자동으로 기록됩니다.
          </p>
        ) : (
          <div className="space-y-1">
            {visible.map((log) => {
              const isErr = log.status !== "success"
              const isOpen = expanded === log.id
              const label = CALLER_LABELS[log.caller] ?? log.caller
              return (
                <div key={log.id} className={cn("rounded-lg border transition-colors", isErr ? "border-red-200 bg-red-50/30" : "hover:bg-muted/30")}>
                  <button
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs"
                    onClick={() => setExpanded(isOpen ? null : log.id)}
                  >
                    <span className="w-28 shrink-0 text-muted-foreground">{fmtTime(log.created_at)}</span>
                    <Badge className={cn("text-[9px]", PROVIDER_COLORS[log.provider] ?? "bg-gray-100 text-gray-700")}>
                      {log.provider}
                    </Badge>
                    <span className="font-medium">{label}</span>
                    <span className="text-muted-foreground">{fmtTokens(log.total_tokens)}</span>
                    {log.cost_usd != null && (
                      <span className="text-muted-foreground">{fmtCost(log.cost_usd)} ({fmtKRW(log.cost_usd)})</span>
                    )}
                    {log.duration_ms != null && (
                      <span className="text-muted-foreground">{fmtDuration(log.duration_ms)}</span>
                    )}
                    {isErr && <AlertTriangle className="h-3 w-3 text-red-500" />}
                    <span className="ml-auto">
                      {isOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="border-t bg-gray-50 px-3 py-2 text-[11px]">
                      <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-muted-foreground sm:grid-cols-4">
                        <div>모델: <span className="font-mono font-medium text-foreground">{log.model}</span></div>
                        <div>입력: <span className="font-medium text-foreground">{formatNumber(log.input_tokens)} tok</span></div>
                        <div>출력: <span className="font-medium text-foreground">{formatNumber(log.output_tokens)} tok</span></div>
                        <div>비용: <span className="font-medium text-foreground">{log.cost_usd != null ? `${fmtCost(log.cost_usd)} (${fmtKRW(log.cost_usd)})` : "-"}</span></div>
                      </div>
                      {log.error && (
                        <p className="mt-2 rounded bg-red-100 p-2 text-red-700">{log.error}</p>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
            {logs.length > showCount && (
              <button
                onClick={() => setShowCount((c) => c + 30)}
                className="w-full rounded-lg border border-dashed py-2 text-xs text-muted-foreground hover:border-input hover:text-foreground"
              >
                더 보기 ({logs.length - showCount}건 남음)
              </button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Main Page ───────────────────────────────────────────────

function LLMUsagePage() {
  const [dateVal, setDateVal] = useCollectorDate({ mode: "recent", recentDays: 7 })

  // 날짜 값 → API 파라미터 변환
  const apiParams = useMemo(() => {
    if (dateVal.mode === "single" && dateVal.date) {
      return { start: dateVal.date, end: dateVal.date }
    }
    if (dateVal.mode === "range" && dateVal.dateFrom && dateVal.dateTo) {
      return { start: dateVal.dateFrom, end: dateVal.dateTo }
    }
    if (dateVal.mode === "recent") {
      return { days: dateVal.recentDays ?? 7 }
    }
    return { days: 7 }
  }, [dateVal])

  const { data: summary, isPending } = useLLMUsageSummary(apiParams)
  const { data: recentLogs } = useLLMUsageRecent(100)

  return (
    <div className="flex flex-col gap-5 p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">LLM 사용량</h1>
          <p className="text-sm text-muted-foreground">
            Anthropic + Gemini API 호출 현황 · 비용 추적
            <span className="ml-2 text-[10px]">(환율: $1 = {USD_TO_KRW.toLocaleString()}원)</span>
          </p>
        </div>
      </div>

      {/* Date Selector */}
      <CollectorDateSelector value={dateVal} onChange={setDateVal} />

      {isPending ? (
        <p className="text-sm text-muted-foreground">사용량 데이터 로딩 중...</p>
      ) : summary ? (
        <>
          {/* Period info */}
          <p className="text-xs text-muted-foreground">
            조회 기간: {summary.period.start} ~ {summary.period.end}
          </p>

          {/* Summary Cards */}
          <SummaryCards t={summary.totals} />

          {/* Charts Row */}
          <div className="grid gap-5 lg:grid-cols-2">
            <DailyCostChart data={summary.daily} />
            <DailyTokenChart data={summary.daily} />
          </div>

          {/* Breakdowns Row */}
          <div className="grid gap-5 lg:grid-cols-2">
            <CallerBreakdown data={summary.by_caller} />
            <ProviderPie data={summary.by_provider} />
          </div>

          {/* Model Table */}
          <ModelTable data={summary.by_model} />
        </>
      ) : (
        <p className="text-sm text-muted-foreground">데이터를 불러올 수 없습니다.</p>
      )}

      {/* Recent Logs */}
      <RecentLogs logs={recentLogs ?? []} />
    </div>
  )
}

export default LLMUsagePage
