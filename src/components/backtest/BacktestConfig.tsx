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
import type {
  BacktestStrategy,
  PositionSizing,
  RiskManagement,
  ScalingConfig,
} from "@/types"

interface BacktestConfigProps {
  strategy: BacktestStrategy | null
  explanation: string
  startDate: string
  endDate: string
  initialCapital: string
  maxPositions: string
  positionSizePct: string
  onStartDateChange: (v: string) => void
  onEndDateChange: (v: string) => void
  onInitialCapitalChange: (v: string) => void
  onMaxPositionsChange: (v: string) => void
  onPositionSizePctChange: (v: string) => void
  onRun: () => void
  isRunning: boolean
  positionSizing: PositionSizing
  onPositionSizingChange: (v: PositionSizing) => void
  scaling: ScalingConfig
  onScalingChange: (v: ScalingConfig) => void
  riskManagement: RiskManagement
  onRiskManagementChange: (v: RiskManagement) => void
}

const OP_LABELS: Record<string, string> = {
  "<=": "\u2264",
  ">=": "\u2265",
  "<": "<",
  ">": ">",
  "==": "=",
  "!=": "\u2260",
}

function BacktestConfig({
  strategy,
  explanation,
  startDate,
  endDate,
  initialCapital,
  maxPositions,
  positionSizePct,
  onStartDateChange,
  onEndDateChange,
  onInitialCapitalChange,
  onMaxPositionsChange,
  onPositionSizePctChange,
  onRun,
  isRunning,
  positionSizing,
  onPositionSizingChange,
  scaling,
  onScalingChange,
  riskManagement,
  onRiskManagementChange,
}: BacktestConfigProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">실행 설정</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 전략 프리뷰 */}
        {strategy && (
          <div className="rounded-md border p-3 space-y-2">
            <p className="text-sm font-medium">{strategy.name}</p>
            {explanation && (
              <p className="text-xs text-muted-foreground">{explanation}</p>
            )}
            <div className="space-y-1.5">
              <div>
                <span className="text-xs font-medium text-emerald-600">
                  매수 ({strategy.buy_logic})
                </span>
                {strategy.buy_conditions.map((c, i) => (
                  <p key={i} className="text-xs text-muted-foreground ml-2">
                    {c.indicator}
                    {Object.keys(c.params).length > 0 &&
                      `(${Object.entries(c.params)
                        .map(([k, v]) => `${k}=${v}`)
                        .join(", ")})`}{" "}
                    {OP_LABELS[c.op] || c.op} {c.value}
                  </p>
                ))}
              </div>
              <div>
                <span className="text-xs font-medium text-red-500">
                  매도 ({strategy.sell_logic})
                </span>
                {strategy.sell_conditions.map((c, i) => (
                  <p key={i} className="text-xs text-muted-foreground ml-2">
                    {c.indicator}
                    {Object.keys(c.params).length > 0 &&
                      `(${Object.entries(c.params)
                        .map(([k, v]) => `${k}=${v}`)
                        .join(", ")})`}{" "}
                    {OP_LABELS[c.op] || c.op} {c.value}
                  </p>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 기간 */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">시작일</Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs">종료일</Label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              className="mt-1"
            />
          </div>
        </div>

        {/* 자본금 */}
        <div>
          <Label className="text-xs">초기 자본금 (원)</Label>
          <Input
            type="number"
            value={initialCapital}
            onChange={(e) => onInitialCapitalChange(e.target.value)}
            className="mt-1"
          />
        </div>

        {/* 포지션 설정 */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">최대 보유 종목</Label>
            <Input
              type="number"
              value={maxPositions}
              onChange={(e) => onMaxPositionsChange(e.target.value)}
              min={1}
              max={50}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs">종목당 비중 (%)</Label>
            <Input
              type="number"
              value={positionSizePct}
              onChange={(e) => onPositionSizePctChange(e.target.value)}
              min={1}
              max={100}
              className="mt-1"
            />
          </div>
        </div>

        {/* 고급 설정 토글 */}
        <button
          type="button"
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          <span className="text-[10px]">{showAdvanced ? "\u25BE" : "\u25B8"}</span>
          고급 설정
        </button>

        {showAdvanced && (
          <div className="space-y-4 rounded-md border p-3">
            {/* 포지션 사이징 */}
            <div className="space-y-2">
              <Label className="text-xs font-medium"><Term>포지션 사이징</Term></Label>
              <Select
                value={positionSizing.mode}
                onValueChange={(mode) =>
                  onPositionSizingChange({
                    ...positionSizing,
                    mode: mode as PositionSizing["mode"],
                  })
                }
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">고정 비중</SelectItem>
                  <SelectItem value="conviction"><Term>확신도</Term> 기반</SelectItem>
                  <SelectItem value="atr_target"><Term k="ATR">ATR</Term> 변동성</SelectItem>
                  <SelectItem value="kelly">Half-Kelly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 분할매매 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium"><Term>분할매매</Term></Label>
                <Switch
                  size="sm"
                  checked={scaling.enabled}
                  onCheckedChange={(checked) =>
                    onScalingChange({ ...scaling, enabled: checked })
                  }
                />
              </div>
              {scaling.enabled && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-[10px] text-muted-foreground">
                      1차 진입 비율 (%)
                    </Label>
                    <Input
                      type="number"
                      value={Math.round((scaling.initial_pct ?? 0.5) * 100)}
                      onChange={(e) =>
                        onScalingChange({
                          ...scaling,
                          initial_pct: Number(e.target.value) / 100,
                        })
                      }
                      min={10}
                      max={90}
                      className="mt-0.5 h-7 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] text-muted-foreground">
                      추가매수 하락 (%)
                    </Label>
                    <Input
                      type="number"
                      value={scaling.scale_in_drop_pct ?? 3}
                      onChange={(e) =>
                        onScalingChange({
                          ...scaling,
                          scale_in_drop_pct: Number(e.target.value),
                        })
                      }
                      min={1}
                      max={20}
                      step={0.5}
                      className="mt-0.5 h-7 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] text-muted-foreground">
                      익절 수익률 (%)
                    </Label>
                    <Input
                      type="number"
                      value={scaling.partial_exit_gain_pct ?? 5}
                      onChange={(e) =>
                        onScalingChange({
                          ...scaling,
                          partial_exit_gain_pct: Number(e.target.value),
                        })
                      }
                      min={1}
                      max={50}
                      step={0.5}
                      className="mt-0.5 h-7 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] text-muted-foreground">
                      익절 매도 비율 (%)
                    </Label>
                    <Input
                      type="number"
                      value={Math.round((scaling.partial_exit_pct ?? 0.5) * 100)}
                      onChange={(e) =>
                        onScalingChange({
                          ...scaling,
                          partial_exit_pct: Number(e.target.value) / 100,
                        })
                      }
                      min={10}
                      max={90}
                      className="mt-0.5 h-7 text-xs"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 리스크 관리 */}
            <div className="space-y-2">
              <Label className="text-xs font-medium"><Term>리스크 관리</Term></Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-[10px] text-muted-foreground">
                    <Term>손절</Term> (%)
                  </Label>
                  <Input
                    type="number"
                    value={riskManagement.stop_loss_pct ?? ""}
                    onChange={(e) =>
                      onRiskManagementChange({
                        ...riskManagement,
                        stop_loss_pct: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      })
                    }
                    placeholder="미설정"
                    min={0.5}
                    max={50}
                    step={0.5}
                    className="mt-0.5 h-7 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-[10px] text-muted-foreground">
                    <Term>트레일링 스탑</Term> (%)
                  </Label>
                  <Input
                    type="number"
                    value={riskManagement.trailing_stop_pct ?? ""}
                    onChange={(e) =>
                      onRiskManagementChange({
                        ...riskManagement,
                        trailing_stop_pct: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      })
                    }
                    placeholder="미설정"
                    min={0.5}
                    max={30}
                    step={0.5}
                    className="mt-0.5 h-7 text-xs"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        <Button
          className="w-full"
          onClick={onRun}
          disabled={!strategy || isRunning}
        >
          {isRunning ? "실행 중..." : <><Term>백테스트</Term> 실행</>}
        </Button>
      </CardContent>
    </Card>
  )
}

export default BacktestConfig
