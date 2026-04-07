import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Term } from "@/components/ui/term"
import { useUniverses, useAlphaFactors } from "@/hooks/queries/use-alpha"
import { cn } from "@/lib/utils"
import type { AlphaMineRequest } from "@/types/alpha"

const DATA_INTERVALS = [
  { value: "1m", label: "1분" },
  { value: "3m", label: "3분" },
  { value: "5m", label: "5분" },
  { value: "15m", label: "15분" },
  { value: "30m", label: "30분" },
  { value: "1h", label: "1시간" },
  { value: "1d", label: "일봉" },
] as const

const FEATURE_GROUPS = [
  { key: "ohlcv", label: "OHLCV", desc: "시가·고가·저가·종가·거래량", lag: () => null },
  { key: "technical", label: "기술적 지표", desc: "RSI, MACD, BB, ATR, SMA/EMA", lag: () => null },
  { key: "cross_section", label: "횡단면/시계열", desc: "Rank, ZScore (종목간·시점간)", lag: () => null },
  { key: "investor", label: "투자자 수급", desc: "외인·기관·개인 순매수·매수비율", lag: (iv: string) => iv !== "1d" ? "T-1" : null },
  { key: "sentiment", label: "뉴스 감성", desc: "감성 점수, 이벤트 스코어", lag: () => "T-1" },
  { key: "dart", label: "DART 재무", desc: "EPS, BPS, 부채비율, 영업이익률", lag: () => "최근 공시" },
  { key: "margin_short", label: "신용/공매도", desc: "융자잔고율, 대차잔고비율, 공매도비율", lag: (iv: string) => iv !== "1d" ? "T-1" : null },
  { key: "program", label: "프로그램 매매", desc: "프로그램 순매수, 매수비율", lag: (iv: string) => iv !== "1d" ? "T-1" : null },
  { key: "sector", label: "섹터 횡단면", desc: "섹터 수익률, 상대강도, 순위", lag: () => null },
] as const

interface AlphaMineConfigProps {
  onStart: (config: AlphaMineRequest) => void
  isLoading: boolean
}

function AlphaMineConfig({ onStart, isLoading }: AlphaMineConfigProps) {
  const { data: universes } = useUniverses()
  const { data: factorPage } = useAlphaFactors({ limit: 500 })

  const [name, setName] = useState("Alpha Mining")
  const [context, setContext] = useState("")
  const [universe, setUniverse] = useState("KOSPI200")
  const [interval, setInterval] = useState("1d")

  // 인터벌별 디폴트 날짜 (메모리 + 통계적 유의성 기반)
  const getDefaultDates = (iv: string) => {
    const today = new Date().toISOString().slice(0, 10)
    switch (iv) {
      case "1d": return { start: "2014-01-01", end: today }
      case "5m": return { start: "2025-02-18", end: today }
      case "1m": {
        const d = new Date()
        d.setMonth(d.getMonth() - 3)
        return { start: d.toISOString().slice(0, 10), end: today }
      }
      default: return { start: "2020-01-01", end: today }
    }
  }

  const defaults = getDefaultDates("1d")
  const [startDate, setStartDate] = useState(defaults.start)
  const [endDate, setEndDate] = useState(defaults.end)
  const [maxIterations, setMaxIterations] = useState(5)
  const [icThreshold, setIcThreshold] = useState(0.03)
  const [orthogonalityThreshold, setOrthogonalityThreshold] = useState(0.7)
  const [usePysr, setUsePysr] = useState(false)
  const [pysrMaxSize, setPysrMaxSize] = useState(15)
  const [pysrParsimony, setPysrParsimony] = useState(0.03)
  const [seedFactorIds, setSeedFactorIds] = useState<string[]>([])

  const availableFactors = factorPage?.items ?? []

  const handleSubmit = () => {
    onStart({
      name,
      context,
      universe,
      start_date: startDate,
      end_date: endDate,
      max_iterations: maxIterations,
      ic_threshold: icThreshold,
      orthogonality_threshold: orthogonalityThreshold,
      use_pysr: usePysr,
      pysr_max_size: pysrMaxSize,
      pysr_parsimony: pysrParsimony,
      interval,
      seed_factor_ids: seedFactorIds.length > 0 ? seedFactorIds : undefined,
    })
  }

  return (
    <div className="space-y-4 rounded-lg border p-4" data-tour="alpha-mine-config">
      <h3 className="text-sm font-semibold"><Term>마이닝</Term> 설정</h3>

      <div className="grid gap-3">
        <div>
          <Label className="text-xs">실행명</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 h-8 text-sm"
          />
        </div>

        <div>
          <Label className="text-xs">시장 맥락 (Claude에 전달)</Label>
          <Input
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="예: 한국 주식시장 과매도 반등 전략"
            className="mt-1 h-8 text-sm"
          />
        </div>

        <div>
          <Label className="text-xs"><Term>유니버스</Term></Label>
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
          <p className="mt-0.5 text-[10px] text-muted-foreground">
            KOSPI 200 권장 (<Term>횡단면</Term> <Term k="IC">IC</Term> 통계적 유의성)
          </p>
        </div>

        <div>
          <Label className="text-xs">데이터 인터벌</Label>
          <div className="mt-1.5 flex flex-wrap gap-1">
            {DATA_INTERVALS.map((iv) => (
              <button
                key={iv.value}
                type="button"
                onClick={() => {
                  setInterval(iv.value)
                  const d = getDefaultDates(iv.value)
                  setStartDate(d.start)
                  setEndDate(d.end)
                }}
                className={cn(
                  "h-7 rounded-md border px-2.5 text-xs font-medium transition-colors",
                  interval === iv.value
                    ? "border-primary bg-primary text-white"
                    : "border-border bg-background text-muted-foreground hover:bg-muted/50",
                )}
              >
                {iv.label}
              </button>
            ))}
          </div>
          {interval !== "1d" && (
            <p className="mt-1 text-[10px] text-muted-foreground">
              분봉 데이터가 DB에 존재하는 종목만 마이닝됩니다
            </p>
          )}

          {/* 피처 가용성 인디케이터 */}
          <div className="mt-2.5 rounded-md border border-dashed p-2.5">
            <p className="mb-1.5 text-[10px] font-medium text-muted-foreground">
              마이닝 데이터 요소
            </p>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1">
              {FEATURE_GROUPS.map((fg) => {
                const lag = fg.lag(interval)
                return (
                  <div key={fg.key} className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                    <span className="truncate text-[10px]">{fg.label}</span>
                    {lag && (
                      <span className="ml-auto shrink-0 rounded bg-muted px-1 text-[9px] text-muted-foreground">
                        {lag}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
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
            <Label className="text-xs">반복 횟수</Label>
            <Input
              type="number"
              value={maxIterations}
              onChange={(e) => setMaxIterations(Number(e.target.value))}
              min={1}
              max={50}
              className="mt-1 h-8 text-sm"
            />
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
        </div>

        <div>
          <Label className="text-xs">
            <Term>직교성</Term> 필터 (최대 상관계수: {orthogonalityThreshold.toFixed(2)})
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

        <div className="flex items-center gap-2 opacity-50">
          <Switch checked={false} disabled />
          <Label className="text-xs text-muted-foreground">
            PySR <Term>기호 회귀</Term> (미구현)
          </Label>
        </div>

        {usePysr && (
          <div className="space-y-2 rounded border border-dashed p-3">
            <p className="text-[10px] font-medium text-muted-foreground">
              PySR 고급 설정
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-[10px]">수식 최대 길이 (Max Size)</Label>
                <Input
                  type="number"
                  value={pysrMaxSize}
                  onChange={(e) => setPysrMaxSize(Number(e.target.value))}
                  min={5}
                  max={50}
                  className="mt-1 h-7 text-xs"
                />
              </div>
              <div>
                <Label className="text-[10px]">간결성 압박 (Parsimony)</Label>
                <Input
                  type="number"
                  value={pysrParsimony}
                  onChange={(e) => setPysrParsimony(Number(e.target.value))}
                  step={0.01}
                  min={0.001}
                  max={1}
                  className="mt-1 h-7 text-xs"
                />
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground">
              Max Size 작을수록, Parsimony 클수록 간결한 수식 선호
            </p>
          </div>
        )}
      </div>

      {/* 시드 팩터 선택 */}
      {availableFactors.length > 0 && (
        <div className="space-y-1.5">
          <Label className="text-xs">시드 <Term>팩터</Term> (선택)</Label>
          <div className="max-h-32 overflow-y-auto rounded border p-2">
            {availableFactors.map((f) => (
              <label
                key={f.id}
                className="flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 text-xs hover:bg-muted/50"
              >
                <input
                  type="checkbox"
                  checked={seedFactorIds.includes(f.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSeedFactorIds((prev) => [...prev, f.id])
                    } else {
                      setSeedFactorIds((prev) => prev.filter((id) => id !== f.id))
                    }
                  }}
                  className="h-3 w-3 rounded border-gray-300"
                />
                <span className="truncate font-mono">{f.name}</span>
                {f.ic_mean != null && (
                  <span className="ml-auto shrink-0 text-muted-foreground">
                    IC {f.ic_mean.toFixed(4)}
                  </span>
                )}
              </label>
            ))}
          </div>
          {seedFactorIds.length > 0 && (
            <p className="text-[10px] text-muted-foreground">
              {seedFactorIds.length}개 시드 선택 — 초기 모집단에 포함됩니다
            </p>
          )}
        </div>
      )}

      <Button
        onClick={handleSubmit}
        disabled={isLoading}
        className="w-full"
        size="sm"
        data-tour="alpha-mine-start"
      >
        {isLoading ? "마이닝 중..." : <><Term>알파</Term> 탐색 시작</>}
      </Button>
    </div>
  )
}

export default AlphaMineConfig
