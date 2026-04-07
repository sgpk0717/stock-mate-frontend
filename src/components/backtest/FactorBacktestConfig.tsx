import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Term } from "@/components/ui/term"
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible"
import { ChevronDown, ChevronUp, ChevronsUpDown, Check } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { cn } from "@/lib/utils"
import { useAlphaFactors } from "@/hooks/queries/use-alpha"
import type { AlphaFactor } from "@/types/alpha"

interface FactorBacktestConfigProps {
  onRun: (config: FactorBacktestFormData) => void
  isRunning: boolean
}

export interface FactorBacktestFormData {
  factorId: string
  startDate: string
  endDate: string
  initialCapital: number
  topPct: number
  maxPositions: number
  rebalanceFreq: "every_bar" | "hourly" | "daily" | "weekly" | "monthly"
  bandThreshold: number
  interval: string
  stopLossPct: number
  trailingStopPct: number
  maxDrawdownPct: number
  buyCommission: number | undefined
  sellCommission: number | undefined
  slippagePct: number | undefined
  // 듀얼 팩터
  intradayFactorId: string | null
  intradayInterval: string
  intradayEntryThreshold: number
  intradayExitThreshold: number
  // 지정가 매매
  useLimitOrders: boolean
  strictFill: boolean
  limitTtlBars: number
}

function FactorBacktestConfig({ onRun, isRunning }: FactorBacktestConfigProps) {
  const { data: factorPage } = useAlphaFactors({ limit: 500, sort_by: "created_at", order: "desc" })
  const { data: compositePage } = useAlphaFactors({ limit: 50, sort_by: "created_at", order: "desc", search: "MegaAlpha" })
  const { data: intradayPage } = useAlphaFactors({ limit: 200, sort_by: "icir", order: "desc", interval: "5m" })
  // 메가알파(composite) + 일반 팩터 병합, 중복 제거
  const factors = (() => {
    const composites = compositePage?.items ?? []
    const regulars = factorPage?.items ?? []
    const seen = new Set<string>()
    const merged: typeof regulars = []
    for (const f of [...composites, ...regulars]) {
      if (!seen.has(f.id)) { seen.add(f.id); merged.push(f) }
    }
    return merged
  })()

  const [selectedFactorId, setSelectedFactorId] = useState("")
  const [startDate, setStartDate] = useState("2014-01-01")
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [initialCapital, setInitialCapital] = useState("100000000")
  const [topPct, setTopPct] = useState("20")
  const [maxPositions, setMaxPositions] = useState("20")
  const [rebalanceFreq, setRebalanceFreq] = useState<FactorBacktestFormData["rebalanceFreq"]>("weekly")
  const [bandThreshold, setBandThreshold] = useState("5")

  // 리스크
  const [stopLossEnabled, setStopLossEnabled] = useState(false)
  const [stopLossPct, setStopLossPct] = useState("7")
  const [trailingStopEnabled, setTrailingStopEnabled] = useState(false)
  const [trailingStopPct, setTrailingStopPct] = useState("20")
  const [circuitBreakerEnabled, setCircuitBreakerEnabled] = useState(false)
  const [maxDrawdownPct, setMaxDrawdownPct] = useState("15")

  // 거래 비용
  const [costSettingsOpen, setCostSettingsOpen] = useState(false)
  const [buyCommission, setBuyCommission] = useState("0.015")
  const [sellCommission, setSellCommission] = useState("0.215")
  const [slippagePct, setSlippagePct] = useState("0.1")
  const [useCustomCost, setUseCustomCost] = useState(false)

  // 듀얼 팩터
  const [dualFactorEnabled, setDualFactorEnabled] = useState(false)
  const [intradayFactorId, setIntradayFactorId] = useState("")
  const [intradayEntryThreshold, setIntradayEntryThreshold] = useState("80")
  const [intradayExitThreshold, setIntradayExitThreshold] = useState("20")

  // 지정가 매매
  const [useLimitOrders, setUseLimitOrders] = useState(true)
  const [strictFill, setStrictFill] = useState(false)
  const [limitTtlBars, setLimitTtlBars] = useState("2")

  const selectedFactor = factors.find((f) => f.id === selectedFactorId)
  const factorInterval = selectedFactor?.interval ?? "1d"
  const isIntraday = factorInterval !== "1d"

  // 분봉 팩터 목록 (별도 쿼리로 로드 — 일봉 팩터가 대다수라 limit 500으로는 분봉이 누락됨)
  const intradayFactors = intradayPage?.items ?? []
  const selectedIntradayFactor = intradayFactors.find((f) => f.id === intradayFactorId)

  function handleRun() {
    if (!selectedFactorId) return
    if (dualFactorEnabled && !intradayFactorId) return
    onRun({
      factorId: selectedFactorId,
      startDate,
      endDate,
      initialCapital: Number(initialCapital),
      topPct: Number(topPct) / 100,
      maxPositions: Number(maxPositions),
      rebalanceFreq: isIntraday && rebalanceFreq === "weekly" ? "daily" : rebalanceFreq,
      bandThreshold: Number(bandThreshold) / 100,
      interval: factorInterval,
      stopLossPct: stopLossEnabled ? Number(stopLossPct) / 100 : 0,
      trailingStopPct: trailingStopEnabled ? Number(trailingStopPct) / 100 : 0,
      maxDrawdownPct: circuitBreakerEnabled ? Number(maxDrawdownPct) / 100 : 0,
      buyCommission: useCustomCost ? Number(buyCommission) / 100 : undefined,
      sellCommission: useCustomCost ? Number(sellCommission) / 100 : undefined,
      slippagePct: useCustomCost ? Number(slippagePct) / 100 : undefined,
      intradayFactorId: dualFactorEnabled ? intradayFactorId : null,
      intradayInterval: selectedIntradayFactor?.interval ?? "5m",
      intradayEntryThreshold: Number(intradayEntryThreshold) / 100,
      intradayExitThreshold: Number(intradayExitThreshold) / 100,
      useLimitOrders,
      strictFill,
      limitTtlBars: Number(limitTtlBars),
    })
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">팩터 백테스트 설정</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 팩터 선택 */}
        <div>
          <Label className="text-xs">알파 팩터</Label>
          <FactorCombobox
            factors={factors}
            value={selectedFactorId}
            onSelect={setSelectedFactorId}
          />
        </div>

        {/* 선택된 팩터 수식 */}
        {selectedFactor && (
          <div className="rounded bg-muted/50 p-2">
            <p className="text-[10px] text-muted-foreground mb-1">수식 ({factorInterval})</p>
            <code className="text-xs font-mono break-all">{selectedFactor.expression_str}</code>
          </div>
        )}

        {/* 듀얼 팩터 (분봉 진입) */}
        {selectedFactor && factorInterval === "1d" && (
          <div className="space-y-3 rounded-md border p-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium">듀얼 팩터 (분봉 진입)</Label>
              <Switch size="sm" checked={dualFactorEnabled} onCheckedChange={setDualFactorEnabled} />
            </div>
            {dualFactorEnabled && (
              <>
                <p className="text-[10px] text-muted-foreground">
                  일봉 팩터로 매수 후보를 선별하고, 분봉 팩터로 매수/매도 시점을 결정합니다.
                  분봉 데이터가 없는 기간은 일봉 리밸런싱으로 폴백합니다.
                </p>
                <div>
                  <Label className="text-xs">분봉 팩터</Label>
                  <Select value={intradayFactorId} onValueChange={setIntradayFactorId}>
                    <SelectTrigger className="mt-1 h-9 text-xs">
                      <SelectValue placeholder="분봉 팩터를 선택하세요" />
                    </SelectTrigger>
                    <SelectContent className="max-h-64">
                      {intradayFactors.map((f) => (
                        <SelectItem key={f.id} value={f.id} className="text-xs">
                          <FactorOptionLabel factor={f} />
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {selectedIntradayFactor && (
                  <div className="rounded bg-muted/50 p-2">
                    <p className="text-[10px] text-muted-foreground mb-1">
                      분봉 수식 ({selectedIntradayFactor.interval})
                    </p>
                    <code className="text-xs font-mono break-all">
                      {selectedIntradayFactor.expression_str}
                    </code>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">진입 기준 (%)</Label>
                    <Input
                      type="number"
                      value={intradayEntryThreshold}
                      onChange={(e) => setIntradayEntryThreshold(e.target.value)}
                      min={50}
                      max={100}
                      step={5}
                      className="mt-1 h-7 text-xs"
                    />
                    <p className="mt-0.5 text-[10px] text-muted-foreground">
                      분봉 팩터 랭크 상위 N% 이상이면 매수
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs">퇴출 기준 (%)</Label>
                    <Input
                      type="number"
                      value={intradayExitThreshold}
                      onChange={(e) => setIntradayExitThreshold(e.target.value)}
                      min={0}
                      max={50}
                      step={5}
                      className="mt-1 h-7 text-xs"
                    />
                    <p className="mt-0.5 text-[10px] text-muted-foreground">
                      분봉 팩터 랭크 하위 N% 이하면 매도
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* 기간 */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">시작일</Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs">종료일</Label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="mt-1"
              placeholder="비우면 오늘까지"
            />
          </div>
        </div>

        {/* 자본금 */}
        <div>
          <Label className="text-xs">초기 자본금 (원)</Label>
          <Input
            type="number"
            value={initialCapital}
            onChange={(e) => setInitialCapital(e.target.value)}
            className="mt-1"
          />
        </div>

        {/* 포트폴리오 설정 */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">상위 매수 비율 (%)</Label>
            <Input
              type="number"
              value={topPct}
              onChange={(e) => setTopPct(e.target.value)}
              min={5}
              max={50}
              className="mt-1"
            />
            <p className="mt-0.5 text-[10px] text-muted-foreground">
              팩터 순위 상위 N% 종목을 매수
            </p>
          </div>
          <div>
            <Label className="text-xs">최대 보유 종목</Label>
            <Input
              type="number"
              value={maxPositions}
              onChange={(e) => setMaxPositions(e.target.value)}
              min={1}
              max={100}
              className="mt-1"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">리밸런싱 주기</Label>
            <Select
              value={rebalanceFreq}
              onValueChange={(v) => setRebalanceFreq(v as FactorBacktestFormData["rebalanceFreq"])}
            >
              <SelectTrigger className="mt-1 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">매일</SelectItem>
                <SelectItem value="weekly">매주</SelectItem>
                <SelectItem value="monthly">매월</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">리밸런싱 허용 편차 (%)</Label>
            <Input
              type="number"
              value={bandThreshold}
              onChange={(e) => setBandThreshold(e.target.value)}
              min={0}
              max={20}
              className="mt-1"
            />
            <p className="mt-0.5 text-[10px] text-muted-foreground">
              포트폴리오 비중이 이만큼 벗어나면 리밸런싱
            </p>
          </div>
        </div>

        {/* 리스크 관리 */}
        <div className="space-y-3 rounded-md border p-3">
          <Label className="text-xs font-medium"><Term>리스크 관리</Term></Label>

          {/* 손절 */}
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground"><Term>포지션 손절</Term></Label>
            <Switch size="sm" checked={stopLossEnabled} onCheckedChange={setStopLossEnabled} />
          </div>
          {stopLossEnabled && (
            <div>
              <Input
                type="number"
                value={stopLossPct}
                onChange={(e) => setStopLossPct(e.target.value)}
                min={1}
                max={50}
                step={1}
                className="h-7 text-xs"
                placeholder="손절 비율 (%)"
              />
              <p className="mt-0.5 text-[10px] text-muted-foreground">
                진입가 대비 이 비율 이상 하락 시 즉시 매도
              </p>
            </div>
          )}

          {/* 트레일링 스탑 */}
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">
              <Term>트레일링 스탑</Term>
            </Label>
            <Switch size="sm" checked={trailingStopEnabled} onCheckedChange={setTrailingStopEnabled} />
          </div>
          {trailingStopEnabled && (
            <div>
              <Input
                type="number"
                value={trailingStopPct}
                onChange={(e) => setTrailingStopPct(e.target.value)}
                min={1}
                max={50}
                step={1}
                className="h-7 text-xs"
                placeholder="트레일링 스탑 (%)"
              />
              <p className="mt-0.5 text-[10px] text-muted-foreground">
                보유 중 고점 대비 이 비율 이상 하락 시 매도
              </p>
            </div>
          )}

          {/* 서킷 브레이커 */}
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">
              <Term k="MDD">서킷 브레이커</Term> (포트폴리오 MDD)
            </Label>
            <Switch size="sm" checked={circuitBreakerEnabled} onCheckedChange={setCircuitBreakerEnabled} />
          </div>
          {circuitBreakerEnabled && (
            <div>
              <Input
                type="number"
                value={maxDrawdownPct}
                onChange={(e) => setMaxDrawdownPct(e.target.value)}
                min={5}
                max={50}
                step={1}
                className="h-7 text-xs"
                placeholder="최대 낙폭 (%)"
              />
              <p className="mt-1 text-[10px] text-muted-foreground">
                역대 최고점 대비 이 비율 이상 하락 시 전체 청산 후 거래 중단
              </p>
            </div>
          )}
        </div>

        {/* 지정가 매매 시뮬레이션 */}
        <div className="space-y-3 rounded-md border p-3">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-xs">지정가 매매</Label>
              <p className="text-[10px] text-muted-foreground">실매매와 동일한 지정가 체결 시뮬레이션</p>
            </div>
            <Switch checked={useLimitOrders} onCheckedChange={setUseLimitOrders} />
          </div>

          {useLimitOrders && (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs">Strict 체결</Label>
                  <p className="text-[10px] text-muted-foreground">한 호가 관통 시에만 체결 (보수적)</p>
                </div>
                <Switch checked={strictFill} onCheckedChange={setStrictFill} />
              </div>
              <div>
                <Label className="text-xs">미체결 대기 (봉)</Label>
                <Input type="number" min={1} max={10} value={limitTtlBars} onChange={(e) => setLimitTtlBars(e.target.value)} className="mt-1 h-7 w-20 text-xs" />
                <p className="text-[10px] text-muted-foreground">미체결 시 N봉 후 시장가 전환</p>
              </div>
            </>
          )}
        </div>

        {/* 거래 비용 설정 */}
        <Collapsible open={costSettingsOpen} onOpenChange={setCostSettingsOpen}>
          <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md border p-3 hover:bg-muted/50 transition-colors">
            <span className="text-xs font-medium">거래 비용 설정</span>
            {costSettingsOpen ? (
              <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 rounded-b-md border border-t-0 p-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">커스텀 비용 사용</Label>
              <Switch size="sm" checked={useCustomCost} onCheckedChange={setUseCustomCost} />
            </div>
            {!useCustomCost && (
              <p className="text-[10px] text-muted-foreground">
                비활성 시 인터벌별 기본값 적용 (일봉: 고정 슬리피지, 분봉: VolumeShare 모델)
              </p>
            )}
            {useCustomCost && (
              <div className="space-y-2">
                <div>
                  <Label className="text-xs">매수 수수료 (%)</Label>
                  <Input
                    type="number"
                    value={buyCommission}
                    onChange={(e) => setBuyCommission(e.target.value)}
                    min={0}
                    max={1}
                    step={0.001}
                    className="mt-1 h-7 text-xs"
                  />
                  <p className="mt-0.5 text-[10px] text-muted-foreground">KIS 기준 기본값: 0.015%</p>
                </div>
                <div>
                  <Label className="text-xs">매도 수수료+세금 (%)</Label>
                  <Input
                    type="number"
                    value={sellCommission}
                    onChange={(e) => setSellCommission(e.target.value)}
                    min={0}
                    max={1}
                    step={0.001}
                    className="mt-1 h-7 text-xs"
                  />
                  <p className="mt-0.5 text-[10px] text-muted-foreground">KIS 기준 기본값: 0.215% (수수료 0.015% + 거래세 0.20%)</p>
                </div>
                <div>
                  <Label className="text-xs">슬리피지 (%)</Label>
                  <Input
                    type="number"
                    value={slippagePct}
                    onChange={(e) => setSlippagePct(e.target.value)}
                    min={0}
                    max={1}
                    step={0.01}
                    className="mt-1 h-7 text-xs"
                  />
                  <p className="mt-0.5 text-[10px] text-muted-foreground">KIS 기준 기본값: 0.1% (매수/매도 각각)</p>
                </div>
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>

        <Button
          className="w-full"
          onClick={handleRun}
          disabled={!selectedFactorId || isRunning || (dualFactorEnabled && !intradayFactorId)}
        >
          {isRunning ? "실행 중..." : "팩터 백테스트 실행"}
        </Button>
      </CardContent>
    </Card>
  )
}

function FactorCombobox({
  factors,
  value,
  onSelect,
}: {
  factors: AlphaFactor[]
  value: string
  onSelect: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const selected = factors.find((f) => f.id === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="mt-1 h-9 w-full justify-between text-xs font-normal"
        >
          {selected ? (
            <span className="truncate">
              {selected.name}
              <span className="ml-2 text-muted-foreground">
                IC:{selected.ic_mean?.toFixed(3) ?? "—"} Sharpe:{selected.sharpe?.toFixed(2) ?? "—"}
              </span>
            </span>
          ) : (
            <span className="text-muted-foreground">팩터를 검색하세요...</span>
          )}
          <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput placeholder="팩터 이름 검색..." className="text-xs" />
          <CommandList className="max-h-64">
            <CommandEmpty className="text-xs text-muted-foreground py-4 text-center">
              검색 결과 없음
            </CommandEmpty>
            <CommandGroup>
              {factors.map((f) => (
                <CommandItem
                  key={f.id}
                  value={`${f.name} ${f.id}`}
                  onSelect={() => {
                    onSelect(f.id)
                    setOpen(false)
                  }}
                  className="text-xs"
                >
                  <Check className={cn("mr-2 h-3.5 w-3.5", value === f.id ? "opacity-100" : "opacity-0")} />
                  <span className="truncate">{f.name}</span>
                  <span className="ml-auto shrink-0 text-[10px] text-muted-foreground">
                    IC:{f.ic_mean?.toFixed(3) ?? "—"} Sharpe:{f.sharpe?.toFixed(2) ?? "—"}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

function FactorOptionLabel({ factor }: { factor: AlphaFactor }) {
  const ic = factor.ic_mean != null ? factor.ic_mean.toFixed(3) : "—"
  const sharpe = factor.sharpe != null ? factor.sharpe.toFixed(2) : "—"
  return (
    <span className="flex items-center gap-2">
      <span className="truncate max-w-[180px]">{factor.name}</span>
      <span className="text-muted-foreground shrink-0">
        IC:{ic} Sharpe:{sharpe}
      </span>
    </span>
  )
}

export default FactorBacktestConfig
