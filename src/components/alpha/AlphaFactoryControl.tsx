import { useState, useCallback } from "react"
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
import type { IterationLog, MiningLogSummary } from "@/types/alpha"

function AlphaFactoryControl() {
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
  const [intervalMin, setIntervalMin] = useState(360)
  const [iterations, setIterations] = useState(5)
  const [icThreshold, setIcThreshold] = useState(0.03)
  const [orthogonalityThreshold, setOrthogonalityThreshold] = useState(0.7)
  const [crossover, setCrossover] = useState(true)
  const [causal, setCausal] = useState(false)

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
    },
    [],
  )

  useAlphaFactoryStream(isRunning, handleFactoryEvent)

  const canStart = startDate && endDate && startDate < endDate

  const handleStart = () => {
    if (!canStart) return
    startFactory.mutate({
      context,
      universe,
      start_date: startDate,
      end_date: endDate,
      interval_minutes: intervalMin,
      max_iterations_per_cycle: iterations,
      ic_threshold: icThreshold,
      orthogonality_threshold: orthogonalityThreshold,
      enable_crossover: crossover,
      enable_causal: causal,
    })
  }

  return (
    <div className="space-y-4">
      {/* 상태 표시 */}
      <div className="flex items-center justify-between rounded-lg border p-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold">알파 팩토리</h3>
            <Badge variant={isRunning ? "default" : "secondary"}>
              {isRunning ? "가동 중" : "중지"}
            </Badge>
          </div>
          {isRunning && status && (
            <div className="text-muted-foreground space-y-0.5 text-xs">
              <p><Term>사이클</Term>: {status.cycles_completed}회 완료</p>
              <p>발견 팩터: {status.factors_discovered_total}개</p>
              <p>현재 진행률: {status.current_cycle_progress}%</p>
              {status.last_cycle_at && (
                <p>
                  마지막 사이클:{" "}
                  {new Date(status.last_cycle_at).toLocaleString("ko-KR")}
                </p>
              )}
            </div>
          )}
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

      {/* 진행 바 */}
      {isRunning && status && status.current_cycle_progress > 0 && (
        <div className="h-1.5 w-full rounded-full bg-gray-200">
          <div
            className="h-full rounded-full bg-[oklch(0.540_0.235_270.1)] transition-all"
            style={{ width: `${status.current_cycle_progress}%` }}
          />
        </div>
      )}

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
                min={1}
                className="mt-1 h-8 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">반복/사이클</Label>
              <Input
                type="number"
                value={iterations}
                onChange={(e) => setIterations(Number(e.target.value))}
                min={1}
                max={50}
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
