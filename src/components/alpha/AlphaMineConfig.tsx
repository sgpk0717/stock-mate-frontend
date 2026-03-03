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
import { useUniverses } from "@/hooks/queries/use-alpha"
import type { AlphaMineRequest } from "@/types/alpha"

interface AlphaMineConfigProps {
  onStart: (config: AlphaMineRequest) => void
  isLoading: boolean
}

function AlphaMineConfig({ onStart, isLoading }: AlphaMineConfigProps) {
  const { data: universes } = useUniverses()

  const [name, setName] = useState("Alpha Mining")
  const [context, setContext] = useState("")
  const [universe, setUniverse] = useState("KOSPI200")
  const [startDate, setStartDate] = useState("2024-01-01")
  const [endDate, setEndDate] = useState("2025-12-31")
  const [maxIterations, setMaxIterations] = useState(5)
  const [icThreshold, setIcThreshold] = useState(0.03)
  const [orthogonalityThreshold, setOrthogonalityThreshold] = useState(0.7)
  const [usePysr, setUsePysr] = useState(false)
  const [pysrMaxSize, setPysrMaxSize] = useState(15)
  const [pysrParsimony, setPysrParsimony] = useState(0.03)

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
    })
  }

  return (
    <div className="space-y-4 rounded-lg border p-4">
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

        <div className="flex items-center gap-2">
          <Switch checked={usePysr} onCheckedChange={setUsePysr} />
          <Label className="text-xs">
            PySR <Term>기호 회귀</Term> 사용 (Julia 필요)
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

      <Button
        onClick={handleSubmit}
        disabled={isLoading}
        className="w-full"
        size="sm"
      >
        {isLoading ? "마이닝 중..." : <><Term>알파</Term> 탐색 시작</>}
      </Button>
    </div>
  )
}

export default AlphaMineConfig
