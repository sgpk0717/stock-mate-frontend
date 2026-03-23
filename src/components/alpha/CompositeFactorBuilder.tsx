import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Term } from "@/components/ui/term"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  useAlphaFactors,
  useStartAutoOptimize,
  useAutoOptimizeStatus,
  useBuildComposite,
  useCompositeFactors,
  useCorrelation,
} from "@/hooks/queries/use-alpha"
import FactorCorrelationHeatmap from "./FactorCorrelationHeatmap"
import type { AutoOptimizeResponse, OptimizationResult, SelectionStep } from "@/types/alpha"
import { Sparkles, Search, ChevronDown, ChevronUp, FlaskConical, TrendingUp } from "lucide-react"
import { formatNumber, formatPercent } from "@/lib/format"

// ── 최적화 과정 로그 ──
function OptimizationLog({ steps }: { steps: SelectionStep[] }) {
  return (
    <div className="rounded-lg border bg-gray-50 p-3">
      <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-gray-600">
        <Search className="h-3.5 w-3.5" />
        팩터 선택 과정
      </h4>
      <div className="space-y-1.5">
        {steps.map((s) => (
          <div key={s.step} className="flex items-start gap-2 text-[11px]">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
              {s.step}
            </span>
            <div className="flex-1">
              <div className="flex items-center gap-1.5">
                <span className="font-medium">{s.selected_name}</span>
                <Badge variant="outline" className="text-[9px] px-1 py-0">
                  {s.niche}
                </Badge>
                <Badge variant="secondary" className="text-[9px] px-1 py-0">
                  IC {s.ic.toFixed(4)}
                </Badge>
              </div>
              <p className="mt-0.5 text-gray-500">{s.reason}</p>
              <div className="mt-0.5 flex gap-3 text-gray-400">
                <span>누적 IR² {s.cumulative_ir2.toFixed(4)}</span>
                <span>평균 상관 {s.avg_correlation.toFixed(3)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── K별 결과 카드 ──
function ResultCard({
  result,
  isBest,
  onSelect,
}: {
  result: OptimizationResult
  isBest: boolean
  onSelect: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div
      className={`rounded-lg border p-3 transition ${isBest ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "hover:border-gray-300"}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold">{result.k}개 팩터</span>
          {isBest && (
            <Badge className="bg-primary text-[10px] text-white">최적</Badge>
          )}
        </div>
        <button onClick={() => setExpanded(!expanded)} className="text-gray-400 hover:text-gray-600">
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      <div className="mt-2 grid grid-cols-4 gap-2 text-center">
        <div>
          <p className="text-[10px] text-gray-500">복합 IC</p>
          <p className="text-sm font-semibold">{result.composite_ic.toFixed(4)}</p>
        </div>
        <div>
          <p className="text-[10px] text-gray-500">ICIR</p>
          <p className="text-sm font-semibold">{result.composite_icir.toFixed(3)}</p>
        </div>
        <div>
          <p className="text-[10px] text-gray-500">Sharpe</p>
          <p className="text-sm font-semibold">{result.composite_sharpe.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-[10px] text-gray-500">평균 상관</p>
          <p className="text-sm font-semibold">{result.avg_correlation.toFixed(3)}</p>
        </div>
      </div>

      {expanded && (
        <div className="mt-3 space-y-2 border-t pt-2">
          <div>
            <p className="text-[10px] font-semibold text-gray-500">구성 팩터 + 가중치</p>
            <div className="mt-1 space-y-0.5">
              {result.factor_names.map((name, i) => {
                const fid = result.factor_ids[i]
                const w = result.weights[fid] ?? 0
                return (
                  <div key={fid} className="flex items-center justify-between text-[11px]">
                    <span className="truncate flex-1">{name}</span>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 rounded-full bg-gray-200">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${w * 100}%` }}
                        />
                      </div>
                      <span className="w-10 text-right font-mono text-gray-600">
                        {(w * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
          <Button size="sm" className="w-full" variant="outline" onClick={onSelect}>
            이 조합으로 복합 팩터 생성
          </Button>
        </div>
      )}
    </div>
  )
}

// ── 복합 팩터 히스토리 ──
function CompositeFactorHistory() {
  const { data: compositePage } = useCompositeFactors()
  const composites = compositePage?.items ?? []

  if (composites.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-6 text-center text-xs text-gray-400">
        아직 생성된 복합 팩터가 없습니다
      </div>
    )
  }

  return (
    <div className="rounded-lg border">
      <div className="border-b px-3 py-2">
        <h4 className="text-xs font-semibold">생성된 복합 팩터</h4>
      </div>
      <div className="divide-y">
        {composites.map((f) => (
          <CompositeRow key={f.id} factor={f} />
        ))}
      </div>
    </div>
  )
}

function CompositeRow({ factor }: { factor: import("@/types/alpha").AlphaFactor }) {
  const [expanded, setExpanded] = useState(false)
  const componentCount = factor.component_ids?.length ?? 0

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-gray-50"
      >
        <FlaskConical className="h-3.5 w-3.5 shrink-0 text-primary" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="truncate text-xs font-medium">{factor.name}</span>
            <Badge variant="outline" className="text-[9px] shrink-0">
              {componentCount}개 조합
            </Badge>
          </div>
          <p className="text-[10px] text-gray-400 mt-0.5">
            {new Date(factor.created_at).toLocaleString("ko-KR")}
          </p>
        </div>
        <div className="flex gap-3 text-[11px] shrink-0">
          <span>IC <strong>{factor.ic_mean?.toFixed(4) ?? "—"}</strong></span>
          <span>ICIR <strong>{factor.icir?.toFixed(3) ?? "—"}</strong></span>
          <span>Sharpe <strong>{factor.sharpe?.toFixed(2) ?? "—"}</strong></span>
        </div>
        {expanded ? <ChevronUp className="h-3.5 w-3.5 text-gray-400" /> : <ChevronDown className="h-3.5 w-3.5 text-gray-400" />}
      </button>

      {expanded && (
        <div className="border-t bg-gray-50 px-3 py-2 space-y-2">
          <div>
            <p className="text-[10px] font-semibold text-gray-500">수식</p>
            <code className="block mt-0.5 text-[10px] text-gray-600 break-all bg-white rounded p-1.5 border">
              {factor.expression_str}
            </code>
          </div>
          {factor.component_ids && factor.component_ids.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-gray-500">구성 팩터 ID</p>
              <div className="mt-0.5 flex flex-wrap gap-1">
                {factor.component_ids.map((id) => (
                  <Badge key={id} variant="secondary" className="text-[9px] font-mono">
                    {id.slice(0, 8)}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          {factor.hypothesis && (
            <div>
              <p className="text-[10px] font-semibold text-gray-500">설명</p>
              <p className="mt-0.5 text-[11px] text-gray-600">{factor.hypothesis}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── 자동 최적 조합 모드 ──
function AutoOptimizeMode() {
  const startOptimize = useStartAutoOptimize()
  const buildComposite = useBuildComposite()
  // sessionStorage로 jobId 영속화 (새로고침/탭전환에도 유지)
  const [jobId, _setJobId] = useState<string | null>(
    () => sessionStorage.getItem("autoOptimizeJobId"),
  )
  const setJobId = (id: string | null) => {
    _setJobId(id)
    if (id) sessionStorage.setItem("autoOptimizeJobId", id)
    else sessionStorage.removeItem("autoOptimizeJobId")
  }
  const [result, setResult] = useState<AutoOptimizeResponse | null>(null)
  const [minIc, setMinIc] = useState(0.03)
  const [causalOnly, setCausalOnly] = useState(false)
  const [showOptions, setShowOptions] = useState(false)
  const logsEndRef = useRef<HTMLDivElement>(null)

  // 폴링으로 상태 조회
  const { data: jobStatus, error: jobFetchError } = useAutoOptimizeStatus(jobId)

  // Redis 키 만료(404) 시 stale jobId 정리
  useEffect(() => {
    if (jobFetchError && jobId) {
      setJobId(null)
    }
  }, [jobFetchError]) // eslint-disable-line react-hooks/exhaustive-deps

  // 폴링 로그 (Redis에서 수신)
  const liveLogs = jobStatus?.logs ?? []
  const isRunning = jobStatus?.status === "pending" || jobStatus?.status === "running"
  const jobStatusStr = jobStatus?.status ?? null

  // 완료 시 result 세팅 + jobId 정리 (새로고침 시 깨끗한 상태)
  useEffect(() => {
    if (jobStatusStr === "completed" && jobStatus?.result) {
      setResult(jobStatus.result as AutoOptimizeResponse)
      setJobId(null) // sessionStorage 정리 → 새로고침 시 "생성된 복합 팩터"만 표시
    }
  }, [jobStatusStr]) // eslint-disable-line react-hooks/exhaustive-deps

  // 로그 자동 스크롤
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [liveLogs])

  const handleOptimize = () => {
    setResult(null)
    setJobId(null)
    startOptimize.mutate(
      { min_ic: minIc, causal_only: causalOnly, interval: "5m" },
      {
        onSuccess: (data) => {
          setJobId(data.job_id)
        },
      },
    )
  }

  const handleCreateFromResult = (opt: OptimizationResult) => {
    buildComposite.mutate(
      {
        factor_ids: opt.factor_ids,
        method: "ic_weighted",
        name: `Auto Composite K=${opt.k}`,
      },
      {
        onSuccess: () => {
          window.alert("복합 팩터 생성 완료!")
        },
      },
    )
  }

  const jobError = jobStatus?.status === "failed" ? jobStatus.error : null

  return (
    <div className="space-y-4">
      <div className="rounded-lg border p-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-semibold flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-secondary" />
              자동 최적 조합
            </h4>
            <p className="mt-0.5 text-[11px] text-gray-500">
              탐욕적 전진선택 + Two-tier Shrinkage로 최적의 비상관 팩터 조합을 자동 탐색합니다
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowOptions(!showOptions)}
              className="text-[11px] text-gray-500 hover:text-gray-700 underline"
            >
              {showOptions ? "옵션 닫기" : "필터 옵션"}
            </button>
            <Button
              onClick={handleOptimize}
              disabled={startOptimize.isPending || isRunning}
              size="sm"
            >
              {startOptimize.isPending ? "제출 중..." : isRunning ? "탐색 중..." : "최적 조합 찾기"}
            </Button>
          </div>
        </div>

        {/* 로딩 중 — 백엔드 실시간 로그 (폴링 기반) */}
        {isRunning && (
          <div className="mt-3 rounded-lg border overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border-b">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              <span className="text-xs font-medium">백엔드 실시간 로그</span>
              <span className="text-[10px] text-gray-400 ml-auto">{liveLogs.length}줄</span>
            </div>
            <div className="bg-gray-950 p-3 max-h-48 overflow-y-auto">
              {liveLogs.length === 0 ? (
                <p className="text-xs font-mono text-gray-500">백엔드 응답 대기 중...</p>
              ) : (
                liveLogs.map((log, i) => (
                  <p key={i} className="text-xs font-mono text-green-400 leading-relaxed">
                    {log}
                  </p>
                ))
              )}
              <div ref={logsEndRef} />
            </div>
          </div>
        )}

        {showOptions && (
          <div className="mt-3 flex flex-wrap gap-4 border-t pt-3">
            <div>
              <Label className="text-[10px]">최소 IC</Label>
              <Input
                type="number"
                step={0.01}
                min={0.01}
                max={0.5}
                value={minIc}
                onChange={(e) => setMinIc(Number(e.target.value))}
                className="mt-0.5 h-7 w-20 text-xs"
              />
            </div>
            <label className="flex items-center gap-1.5 text-xs">
              <input
                type="checkbox"
                checked={causalOnly}
                onChange={(e) => setCausalOnly(e.target.checked)}
                className="h-3.5 w-3.5 rounded"
              />
              인과 검증 통과만
            </label>
          </div>
        )}

        {startOptimize.error && (
          <p className="mt-2 text-xs text-red-500">
            {(startOptimize.error as Error).message ?? "요청 실패"}
          </p>
        )}

        {jobError && (
          <p className="mt-2 text-xs text-red-500">
            최적화 실패: {jobError}
          </p>
        )}
      </div>

      {result && (
        <>
          {/* 후보 팩터 요약 */}
          <div className="rounded-lg border bg-gray-50 p-3">
            <p className="text-[11px] text-gray-500">
              후보 팩터 <strong>{result.candidate_count}</strong>개에서 탐색 완료.
              최적 조합: <strong className="text-primary">{result.best_k}개 팩터</strong>
            </p>
          </div>

          {/* 실행 로그 (개발자 수준) */}
          {result.logs && result.logs.length > 0 && (
            <details className="rounded-lg border">
              <summary className="px-3 py-2 text-xs font-semibold cursor-pointer hover:bg-gray-50">
                실행 로그 ({result.logs.length}줄)
              </summary>
              <div className="border-t bg-gray-950 p-3 max-h-48 overflow-y-auto">
                {result.logs.map((log, i) => (
                  <p key={i} className="text-xs font-mono text-green-400 leading-relaxed">
                    {log}
                  </p>
                ))}
              </div>
            </details>
          )}

          {/* K별 결과 카드 */}
          <div className="space-y-2">
            {result.results.map((r) => (
              <ResultCard
                key={r.k}
                result={r}
                isBest={r.k === result.best_k}
                onSelect={() => handleCreateFromResult(r)}
              />
            ))}
          </div>

          {/* 선택 과정 로그 */}
          <OptimizationLog steps={result.selection_log} />
        </>
      )}
    </div>
  )
}

// ── 수동 선택 모드 (기존) ──
function ManualSelectMode() {
  const { data: factorPage } = useAlphaFactors()
  const factors = factorPage?.items ?? []
  const buildComposite = useBuildComposite()

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [method, setMethod] = useState<"ic_weighted" | "equal_weight">("ic_weighted")
  const [name, setName] = useState("Composite Alpha")

  const selectedArray = [...selectedIds]
  const { data: correlation } = useCorrelation(selectedArray)

  const singleFactors = factors.filter((f) => f.factor_type === "single")

  const toggleFactor = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleBuild = () => {
    if (selectedIds.size < 2) return
    buildComposite.mutate(
      { factor_ids: selectedArray, method, name },
      {
        onSuccess: (res) => {
          setSelectedIds(new Set())
          window.alert(`복합 팩터 생성 완료!\nIC: ${res.ic_mean?.toFixed(4) ?? "N/A"}`)
        },
      },
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border p-4">
        <h4 className="mb-3 text-sm font-semibold">
          팩터 선택 ({selectedIds.size}개 선택됨)
        </h4>
        <div className="max-h-48 space-y-1 overflow-y-auto">
          {singleFactors.length === 0 ? (
            <p className="text-xs text-gray-400">발견된 단일 팩터가 없습니다</p>
          ) : (
            singleFactors.map((f) => (
              <label
                key={f.id}
                className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  checked={selectedIds.has(f.id)}
                  onChange={() => toggleFactor(f.id)}
                  className="h-3.5 w-3.5 rounded"
                />
                <span className="flex-1 truncate text-xs">{f.name}</span>
                <Badge variant="secondary" className="text-[10px]">
                  IC {f.ic_mean?.toFixed(4) ?? "N/A"}
                </Badge>
              </label>
            ))
          )}
        </div>
      </div>

      {correlation && selectedIds.size >= 2 && (
        <FactorCorrelationHeatmap data={correlation} />
      )}

      <div className="rounded-lg border p-4">
        <div className="space-y-3">
          <div>
            <Label className="text-xs"><Term>복합 팩터</Term> 이름</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 h-8 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs">가중 방법</Label>
            <div className="mt-1 flex gap-3">
              <label className="flex items-center gap-1.5 text-xs">
                <input
                  type="radio"
                  name="method"
                  checked={method === "ic_weighted"}
                  onChange={() => setMethod("ic_weighted")}
                />
                <Term>IC 가중</Term>
              </label>
              <label className="flex items-center gap-1.5 text-xs">
                <input
                  type="radio"
                  name="method"
                  checked={method === "equal_weight"}
                  onChange={() => setMethod("equal_weight")}
                />
                <Term>동일 가중</Term>
              </label>
            </div>
          </div>

          {buildComposite.error && (
            <p className="text-xs text-red-500">
              {(buildComposite.error as Error).message ?? "복합 팩터 생성 실패"}
            </p>
          )}

          <Button
            onClick={handleBuild}
            disabled={selectedIds.size < 2 || buildComposite.isPending}
            className="w-full"
            size="sm"
          >
            {buildComposite.isPending
              ? "생성 중..."
              : `복합 팩터 생성 (${selectedIds.size}개)`}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── 메인 컴포넌트 ──
function CompositeFactorBuilder() {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="auto" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="auto" className="text-xs">
            <Sparkles className="mr-1.5 h-3 w-3" />
            자동 최적 조합
          </TabsTrigger>
          <TabsTrigger value="manual" className="text-xs">
            <TrendingUp className="mr-1.5 h-3 w-3" />
            수동 선택
          </TabsTrigger>
        </TabsList>

        <TabsContent value="auto" className="mt-4">
          <AutoOptimizeMode />
        </TabsContent>

        <TabsContent value="manual" className="mt-4">
          <ManualSelectMode />
        </TabsContent>
      </Tabs>

      {/* 복합 팩터 히스토리 */}
      <CompositeFactorHistory />
    </div>
  )
}

export default CompositeFactorBuilder
