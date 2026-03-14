import { useCallback, useState } from "react"
import { useNavigate } from "react-router-dom"
import StrategyChat from "@/components/backtest/StrategyChat"
import BacktestConfig from "@/components/backtest/BacktestConfig"
import BacktestEquityCurve from "@/components/backtest/BacktestEquityCurve"
import BacktestHistory from "@/components/backtest/BacktestHistory"
import BacktestProgress from "@/components/backtest/BacktestProgress"
import BacktestSummaryCards from "@/components/backtest/BacktestSummaryCards"
import BacktestTradeTable from "@/components/backtest/BacktestTradeTable"
import { Button } from "@/components/ui/button"
import { Term } from "@/components/ui/term"
import { useBacktestRun, useStartBacktest } from "@/hooks/queries"
import { useCreateContextFromBacktest } from "@/hooks/queries/use-trading"
import type {
  BacktestStrategy,
  PositionSizing,
  RiskManagement,
  ScalingConfig,
} from "@/types"

const DEFAULT_POSITION_SIZING: PositionSizing = { mode: "fixed" }
const DEFAULT_SCALING: ScalingConfig = {
  enabled: false,
  initial_pct: 0.5,
  scale_in_drop_pct: 3,
  max_scale_in: 1,
  partial_exit_pct: 0.5,
  partial_exit_gain_pct: 5,
}
const DEFAULT_RISK: RiskManagement = {}

function BacktestPage() {
  const navigate = useNavigate()
  const createContextMutation = useCreateContextFromBacktest()

  // 전략 상태
  const [strategy, setStrategy] = useState<BacktestStrategy | null>(null)
  const [explanation, setExplanation] = useState("")

  // 설정 상태
  const [startDate, setStartDate] = useState("2024-01-01")
  const [endDate, setEndDate] = useState("2025-01-01")
  const [initialCapital, setInitialCapital] = useState("100000000")
  const [maxPositions, setMaxPositions] = useState("10")
  const [positionSizePct, setPositionSizePct] = useState("10")

  // 고급 설정
  const [positionSizing, setPositionSizing] =
    useState<PositionSizing>(DEFAULT_POSITION_SIZING)
  const [scaling, setScaling] = useState<ScalingConfig>(DEFAULT_SCALING)
  const [riskManagement, setRiskManagement] =
    useState<RiskManagement>(DEFAULT_RISK)

  // 실행 상태
  const [activeRunId, setActiveRunId] = useState<string | null>(null)
  const { data: activeRun } = useBacktestRun(activeRunId)
  const startMutation = useStartBacktest()

  function handleStrategyReady(s: BacktestStrategy, exp: string) {
    setStrategy(s)
    setExplanation(exp)
    // 프리셋에 고급설정이 있으면 반영
    if (s.position_sizing) setPositionSizing(s.position_sizing)
    if (s.scaling) setScaling(s.scaling)
    if (s.risk_management) setRiskManagement(s.risk_management)
  }

  function handleRun() {
    if (!strategy) return

    const enrichedStrategy: BacktestStrategy = {
      ...strategy,
      position_sizing:
        positionSizing.mode !== "fixed" ? positionSizing : undefined,
      scaling: scaling.enabled ? scaling : undefined,
      risk_management:
        riskManagement.stop_loss_pct != null ||
        riskManagement.trailing_stop_pct != null ||
        riskManagement.atr_stop_multiplier != null
          ? riskManagement
          : undefined,
    }

    startMutation.mutate(
      {
        strategy: enrichedStrategy,
        start_date: startDate,
        end_date: endDate,
        initial_capital: Number(initialCapital),
        max_positions: Number(maxPositions),
        position_size_pct: Number(positionSizePct) / 100,
      },
      {
        onSuccess: (res) => {
          setActiveRunId(res.id)
        },
      },
    )
  }

  function handleSelectRun(runId: string) {
    setActiveRunId(runId)
  }

  const handleCompleted = useCallback(() => {
    // WebSocket에서 완료 수신 시 refetch 트리거
  }, [])

  const isRunning =
    startMutation.isPending ||
    activeRun?.status === "PENDING" ||
    activeRun?.status === "RUNNING"

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-bold"><Term>백테스트</Term></h1>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* 왼쪽: 전략 설정 + 결과 */}
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <StrategyChat onStrategyReady={handleStrategyReady} />
            <BacktestConfig
              strategy={strategy}
              explanation={explanation}
              startDate={startDate}
              endDate={endDate}
              initialCapital={initialCapital}
              maxPositions={maxPositions}
              positionSizePct={positionSizePct}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
              onInitialCapitalChange={setInitialCapital}
              onMaxPositionsChange={setMaxPositions}
              onPositionSizePctChange={setPositionSizePct}
              onRun={handleRun}
              isRunning={isRunning}
              positionSizing={positionSizing}
              onPositionSizingChange={setPositionSizing}
              scaling={scaling}
              onScalingChange={setScaling}
              riskManagement={riskManagement}
              onRiskManagementChange={setRiskManagement}
            />
          </div>

          {/* 진행률 */}
          <BacktestProgress
            runId={activeRunId}
            status={activeRun?.status ?? null}
            onCompleted={handleCompleted}
          />

          {/* 에러 메시지 */}
          {activeRun?.status === "FAILED" && activeRun.error_message && (
            <div className="rounded-md border border-destructive/50 bg-destructive/5 p-4 text-sm text-destructive">
              {activeRun.error_message}
            </div>
          )}

          {/* 결과 요약 */}
          {activeRun?.status === "COMPLETED" && (
            <>
              <div className="flex items-center justify-between" data-tour="bt-summary">
                <BacktestSummaryCards metrics={activeRun.metrics} />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    createContextMutation.mutate(
                      {
                        run: activeRun as unknown as Record<string, unknown>,
                        mode: "paper",
                      },
                      { onSuccess: () => navigate("/trading") },
                    )
                  }}
                  disabled={createContextMutation.isPending}
                >
                  {createContextMutation.isPending
                    ? "전환 중..."
                    : <><Term>모의투자 전환</Term></>}
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => {
                    createContextMutation.mutate(
                      {
                        run: activeRun as unknown as Record<string, unknown>,
                        mode: "real",
                      },
                      { onSuccess: () => navigate("/trading") },
                    )
                  }}
                  disabled={createContextMutation.isPending}
                >
                  <Term>실거래 전환</Term>
                </Button>
              </div>
              <div data-tour="bt-equity">
                <BacktestEquityCurve
                  equityCurve={activeRun.equity_curve}
                  trades={activeRun.trades_summary}
                />
              </div>
              <BacktestTradeTable trades={activeRun.trades_summary} />
            </>
          )}
        </div>

        {/* 오른쪽: 실행 기록 */}
        <div data-tour="bt-history">
          <BacktestHistory
            selectedRunId={activeRunId}
            onSelectRun={handleSelectRun}
          />
        </div>
      </div>
    </div>
  )
}

export default BacktestPage
