export interface WorkflowStatus {
  phase: string
  date: string | null
  status: string
  selected_factor_id: string | null
  trading_context_id: string | null
  trade_count: number
  pnl_pct: number | null
  error_message: string | null
  started_at: string | null
  mining_running: boolean
  mining_cycles: number
  mining_factors: number
}

export interface WorkflowRun {
  id: string
  date: string
  phase: string
  status: string
  config: Record<string, unknown> | null
  mining_run_id: string | null
  selected_factor_id: string | null
  trading_context_id: string | null
  review_summary: Record<string, unknown> | null
  trade_count: number
  pnl_amount: number | null
  pnl_pct: number | null
  mining_context: string | null
  started_at: string | null
  completed_at: string | null
  error_message: string | null
  created_at: string
}

export interface WorkflowEvent {
  id: string
  workflow_run_id: string | null
  phase: string | null
  event_type: string | null
  message: string | null
  data: Record<string, unknown> | null
  created_at: string
}

export interface BestFactor {
  factor_id: string
  factor_name: string
  expression_str: string
  ic_mean: number | null
  icir: number | null
  sharpe: number | null
  max_drawdown: number | null
  causal_robust: boolean | null
  interval: string
  composite_score: number
  score_breakdown: Record<string, number>
}

export interface WorkflowTriggerResponse {
  success: boolean
  phase: string
  message: string
}

export interface MiningConfig {
  interval: string
  cpcv_n_groups: number
  cpcv_n_test: number
  cpcv_embargo_days: number
  population_size: number
  max_iterations: number
}
