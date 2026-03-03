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
  created_at: string
  updated_at: string
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
}

export interface AlphaMineResponse {
  id: string
  status: string
  created_at: string
}

export interface AlphaFactorBacktestRequest {
  factor_id: string
  buy_threshold: number
  sell_threshold: number
  start_date: string
  end_date: string
  symbols: string[]
  initial_capital: number
  position_size_pct: number
  max_positions: number
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
  enable_causal: boolean
}

export interface AlphaFactoryStatus {
  running: boolean
  cycles_completed: number
  factors_discovered_total: number
  current_cycle_progress: number
  last_cycle_at: string | null
  config: Record<string, unknown> | null
  population_size?: number
  elite_count?: number
  generation?: number
  operator_stats?: Record<string, unknown> | null
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
