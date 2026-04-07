import { useCallback, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import StrategyChat from "@/components/backtest/StrategyChat"
import BacktestConfig from "@/components/backtest/BacktestConfig"
import BacktestEquityCurve from "@/components/backtest/BacktestEquityCurve"
import BacktestHistory from "@/components/backtest/BacktestHistory"
import BacktestProgress from "@/components/backtest/BacktestProgress"
import BacktestSummaryCards from "@/components/backtest/BacktestSummaryCards"
import BacktestAnalytics from "@/components/backtest/BacktestAnalytics"
import BacktestTradeTable from "@/components/backtest/BacktestTradeTable"
import FactorBacktestConfig from "@/components/backtest/FactorBacktestConfig"
import type { FactorBacktestFormData } from "@/components/backtest/FactorBacktestConfig"
import { Button } from "@/components/ui/button"
import { Term } from "@/components/ui/term"
import { useBacktestRun, useStartBacktest } from "@/hooks/queries"
import { useBacktestWithFactor } from "@/hooks/queries/use-alpha"
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

type BacktestMode = "strategy" | "factor"

function BacktestPage() {
  const navigate = useNavigate()
  const createContextMutation = useCreateContextFromBacktest()

  // 모드
  const [mode, setMode] = useState<BacktestMode>("strategy")

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
  const factorBacktestMutation = useBacktestWithFactor()

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
        riskManagement.atr_stop_multiplier != null ||
        riskManagement.max_drawdown_pct != null
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

  function handleFactorRun(config: FactorBacktestFormData) {
    // Update progress display values to match factor backtest config
    setStartDate(config.startDate)
    setEndDate(config.endDate)
    setInitialCapital(String(config.initialCapital))
    setMaxPositions(String(config.maxPositions))
    setPositionSizePct(String(config.topPct * 100))

    factorBacktestMutation.mutate(
      {
        factorId: config.factorId,
        data: {
          factor_id: config.factorId,
          start_date: config.startDate,
          end_date: config.endDate,
          symbols: [],
          initial_capital: config.initialCapital,
          top_pct: config.topPct,
          max_positions: config.maxPositions,
          rebalance_freq: config.rebalanceFreq,
          band_threshold: config.bandThreshold,
          interval: config.interval,
          stop_loss_pct: config.stopLossPct,
          trailing_stop_pct: config.trailingStopPct,
          max_drawdown_pct: config.maxDrawdownPct,
          buy_commission: config.buyCommission,
          sell_commission: config.sellCommission,
          slippage_pct: config.slippagePct,
          intraday_factor_id: config.intradayFactorId,
          intraday_interval: config.intradayInterval,
          intraday_entry_threshold: config.intradayEntryThreshold,
          intraday_exit_threshold: config.intradayExitThreshold,
          use_limit_orders: config.useLimitOrders,
          strict_fill: config.strictFill,
          limit_ttl_bars: config.limitTtlBars,
        },
      },
      {
        onSuccess: (res) => {
          setActiveRunId(res.backtest_run_id)
        },
      },
    )
  }

  const resultRef = useRef<HTMLDivElement>(null)

  function handleSelectRun(runId: string) {
    setActiveRunId(runId)
    // 결과 영역으로 스크롤
    setTimeout(() => {
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    }, 100)
  }

  const handleCompleted = useCallback(() => {
    // WebSocket에서 완료 수신 시 refetch 트리거
  }, [])

  const isRunning =
    startMutation.isPending ||
    factorBacktestMutation.isPending ||
    activeRun?.status === "PENDING" ||
    activeRun?.status === "RUNNING"

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold"><Term>백테스트</Term></h1>
        {/* 모드 탭 */}
        <div className="flex rounded-lg border p-0.5">
          <button
            className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
              mode === "strategy"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setMode("strategy")}
          >
            전략 백테스트
          </button>
          <button
            className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
              mode === "factor"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setMode("factor")}
          >
            팩터 백테스트
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* 전략 설정 + 결과 */}
        <div className="space-y-6">
          {mode === "strategy" ? (
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
          ) : (
            <div className="mx-auto max-w-lg">
              <FactorBacktestConfig
                onRun={handleFactorRun}
                isRunning={isRunning}
              />
            </div>
          )}

          {/* 진행률 */}
          <BacktestProgress
            runId={activeRunId}
            status={activeRun?.status ?? null}
            onCompleted={handleCompleted}
            config={{
              strategyName: strategy?.name ?? activeRun?.strategy_name ?? "",
              startDate,
              endDate,
              initialCapital,
              maxPositions,
              positionSizePct,
            }}
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
              <div ref={resultRef} data-tour="bt-summary">
                <BacktestSummaryCards
                  metrics={activeRun.metrics}
                  strategyJson={activeRun.strategy_json}
                  startDate={activeRun.start_date}
                  endDate={activeRun.end_date}
                  initialCapital={activeRun.initial_capital}
                  maxPositions={Number(maxPositions)}
                  positionSizePct={Number(positionSizePct) / 100}
                />
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
              <BacktestAnalytics
                trades={activeRun.trades_summary}
                equityCurve={activeRun.equity_curve}
                interval={strategy?.timeframe ?? activeRun?.strategy_json?.interval ?? "1d"}
              />
              <BacktestTradeTable trades={activeRun.trades_summary} interval={strategy?.timeframe ?? activeRun?.strategy_json?.interval ?? "1d"} />
            </>
          )}
        </div>

        {/* 실행 기록 (전체 너비) */}
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
