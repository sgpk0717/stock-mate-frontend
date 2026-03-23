export interface AlphaFactor {
  id: string
  mining_run_id: string | null
  name: string
  expression_str: string
  expression_sympy: string | null
  polars_code: string | null
  hypothesis: string | null
  generation: number
  ic_mean: number | null
  ic_std: number | null
  icir: number | null
  turnover: number | null
  sharpe: number | null
  max_drawdown: number | null
  status: string
  causal_robust: boolean | null
  causal_effect_size: number | null
  causal_p_value: number | null
  parent_ids: string[] | null
  factor_type: string
  component_ids: string[] | null
  fitness_composite?: number | null
  tree_depth?: number | null
  tree_size?: number | null
  expression_hash?: string | null
  operator_origin?: string | null
  is_elite?: boolean | null
  population_active?: boolean | null
  birth_generation?: number | null
  interval?: string | null
  created_at: string
  updated_at: string
}

export interface AlphaFactorPage {
  items: AlphaFactor[]
  total: number
}

export interface AlphaMiningRun {
  id: string
  name: string
  context: Record<string, unknown> | null
  config: Record<string, unknown> | null
  status: string
  progress: number
  factors_found: number
  total_evaluated: number
  error_message: string | null
  has_logs: boolean
  created_at: string
  completed_at: string | null
}

export interface AlphaMiningRunSummary {
  id: string
  name: string
  status: string
  progress: number
  factors_found: number
  total_evaluated: number
  created_at: string
}

export type UniverseCode = "KOSPI200" | "KOSDAQ150" | "KRX300" | "ALL"

export interface UniverseOption {
  code: UniverseCode
  label: string
  count: number
}

export interface AlphaMineRequest {
  name: string
  context: string
  universe: string
  start_date: string
  end_date: string
  max_iterations: number
  ic_threshold: number
  orthogonality_threshold: number
  use_pysr: boolean
  pysr_max_size: number
  pysr_parsimony: number
  interval: string
  seed_factor_ids?: string[]
}

export interface AlphaMineResponse {
  id: string
  status: string
  created_at: string
}

export interface AlphaFactorBacktestRequest {
  factor_id: string
  start_date: string
  end_date: string
  symbols: string[]
  initial_capital: number
  top_pct: number // 상위 몇 % 매수 (0.05~0.5)
  max_positions: number // 최대 보유 종목 수 (1~100)
  rebalance_freq: "every_bar" | "hourly" | "daily" | "weekly" | "monthly"
  band_threshold: number // 밴드 리밸런싱 임계값 (0~0.2)
  interval: string
  stop_loss_pct: number // 포지션 손절 (0=비활성, 0.07=7%)
  max_drawdown_pct: number // 포트폴리오 서킷 브레이커 (0=비활성, 0.15=15%)
}

export interface CausalValidationResponse {
  factor_id: string
  is_causally_robust: boolean
  causal_effect_size: number
  p_value: number
  placebo_passed: boolean
  placebo_effect: number
  random_cause_passed: boolean
  random_cause_delta: number
  regime_shift_passed: boolean
  regime_ate_first_half: number
  regime_ate_second_half: number
  dag_edges: { from: string; to: string }[]
}

// Causal Validation Job Progress

export interface CausalValidationJob {
  job_id: string | null
  total: number
  skipped: number
}

export interface CausalValidationProgress {
  status: "running" | "completed"
  total: number
  completed: number
  failed: number
  robust: number
  mirage: number
  started_at: number
  avg_ms_per_factor: number | null
  estimated_remaining_ms: number | null
  current_factor_idx: number
}

// Phase 3: Alpha Factory

export interface AlphaFactoryStartRequest {
  context: string
  universe: string
  start_date: string
  end_date: string
  interval_minutes: number
  max_iterations_per_cycle: number
  ic_threshold: number
  orthogonality_threshold: number
  enable_crossover: boolean
  max_cycles?: number
  data_interval: string
}

export interface AlphaFactoryStatus {
  running: boolean
  cycles_completed: number
  factors_discovered_total: number
  current_cycle_progress: number
  current_cycle_message?: string
  last_cycle_at: string | null
  started_at?: string | null
  config: Record<string, unknown> | null
  population_size?: number
  elite_count?: number
  generation?: number
  operator_stats?: Record<string, unknown> | null
  last_funnel?: Record<string, number> | null
}

export interface CompositeFactorBuildRequest {
  factor_ids: string[]
  method: "equal_weight" | "ic_weighted"
  name: string
}

export interface CompositeFactorResponse {
  id: string
  name: string
  factor_type: string
  expression_str: string
  component_ids: string[]
  ic_mean: number | null
  created_at: string
}

export interface CorrelationMatrix {
  factor_ids: string[]
  factor_names: string[]
  matrix: number[][]
}

// ── 자동 최적 복합 팩터 ──

export interface AutoOptimizeRequest {
  min_ic?: number
  min_turnover?: number
  max_k?: number
  lambda_decorr?: number
  shrinkage_delta?: number
  interval?: string
  causal_only?: boolean
}

export interface SelectionStep {
  step: number
  selected_id: string
  selected_name: string
  niche: string
  ic: number
  reason: string
  cumulative_ir2: number
  avg_correlation: number
}

export interface OptimizationResult {
  k: number
  factor_ids: string[]
  factor_names: string[]
  weights: Record<string, number>
  composite_ic: number
  composite_icir: number
  composite_sharpe: number
  avg_correlation: number
  expression_str: string
}

export interface AutoOptimizeResponse {
  best_k: number
  results: OptimizationResult[]
  selection_log: SelectionStep[]
  correlation_matrix: CorrelationMatrix
  candidate_count: number
  logs: string[]
}

// ── 자동 최적 비동기 잡 ──

export interface AutoOptimizeJobResponse {
  job_id: string
}

export interface AutoOptimizeStatusResponse {
  status: "pending" | "running" | "completed" | "failed"
  result: AutoOptimizeResponse | null
  error: string | null
  logs: string[]
}

// ── Iteration 로그 (탐색 과정 투명성) ──

export interface IterationAttempt {
  depth: number
  expression_str: string
  hypothesis: string
  ic_mean: number | null
  passed_ic: boolean
  orthogonality_max_corr: number | null
  passed_orthogonality: boolean | null
  outcome:
    | "discovered"
    | "ic_below_threshold"
    | "orthogonality_rejected"
    | "parse_error"
    | "eval_error"
  error_message: string | null
}

export interface IterationLog {
  iteration: number
  hypothesis: string
  attempts: IterationAttempt[]
  discovered_factor_name: string | null
}

export interface MiningLogSummary {
  total_iterations: number
  total_attempts: number
  total_discovered: number
  total_ic_failures: number
  total_parse_errors: number
  total_orthogonality_rejections: number
  avg_ic_all_attempts: number | null
  max_ic_failed: number | null
  failure_breakdown: Record<string, number>
}

export interface MiningIterationLogs {
  run_id: string
  iterations: IterationLog[]
  summary: MiningLogSummary
}

// ── 마이닝 개선 히스토리 ──

export interface MetricsSnapshot {
  total_factors?: number
  generations?: number
  avg_ic?: number
  max_ic?: number
  avg_sharpe?: number
  max_sharpe?: number
  avg_icir?: number
  max_icir?: number
  volume_pct?: number
  family_count?: number
  causal_pass_pct?: number
}

export interface VerificationCriterion {
  label: string
  target: string
  actual: string
  passed: boolean | null
}

export interface ImprovementRound {
  round: number
  title: string
  datetime: string
  status: 'pending' | 'success' | 'partial_success' | 'failure'
  diagnosis: {
    summary: string
    metrics_before: MetricsSnapshot
  }
  changes: string[]
  files_modified: string[]
  verification: {
    cycles_elapsed: number
    generations_range: string
    metrics_after: MetricsSnapshot | null
    criteria: VerificationCriterion[]
  }
  lesson: string | null
}

export interface ImprovementHistory {
  rounds: ImprovementRound[]
}
