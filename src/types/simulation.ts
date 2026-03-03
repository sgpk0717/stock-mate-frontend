// ── Simulation (ABM) ─────────────────────────────────────

export interface AgentConfig {
  fundamental_count: number
  chartist_count: number
  noise_count: number
  llm_count: number
  llm_call_interval: number
}

export interface ExchangeConfig {
  initial_price: number
  tick_size: number
  total_steps: number
  seed: number | null
}

export interface ScenarioConfig {
  type: string
  params: Record<string, unknown>
  inject_at_step: number
}

export interface ScenarioPreset {
  type: string
  name: string
  description: string
  default_params: Record<string, unknown>
}

export interface StressTestRequest {
  name: string
  strategy_json: Record<string, unknown>
  scenario: ScenarioConfig
  agent_config: AgentConfig
  exchange_config: ExchangeConfig
}

export interface StressTestResponse {
  id: string
  status: string
  created_at: string
}

export interface StressTestMetrics {
  final_price: number
  price_change_pct: number
  max_drawdown: number
  annualized_volatility: number
  crash_depth: number
  recovery_steps: number
  strategy_pnl: number
  strategy_pnl_pct: number
  avg_spread: number
  avg_volume: number
}

export interface StressTestResults {
  price_series: number[]
  volume_series: number[]
  spread_series: number[]
  depth_series: Array<{
    bids: [number, number][]
    asks: [number, number][]
  }>
  agent_metrics: Record<
    string,
    { count: number; avg_pnl: number; total_pnl: number }
  >
  strategy_pnl: number
  events_injected: Array<{
    step: number
    type: string
    params: Record<string, unknown>
  }>
}

export interface StressTestRunResponse {
  id: string
  name: string
  strategy_json: Record<string, unknown>
  scenario_type: string
  scenario_config: Record<string, unknown> | null
  agent_config: Record<string, unknown> | null
  exchange_config: Record<string, unknown> | null
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED"
  progress: number
  total_steps: number
  results: StressTestResults | null
  metrics: StressTestMetrics | null
  error_message: string | null
  created_at: string
  completed_at: string | null
}

export interface StressTestRunSummary {
  id: string
  name: string
  scenario_type: string
  status: string
  progress: number
  strategy_pnl: number | null
  crash_depth: number | null
  created_at: string
}

export interface CustomScenarioResponse {
  scenario: ScenarioConfig
  explanation: string
}

// ── MCP ──────────────────────────────────────────────────

export interface McpStatus {
  running: boolean
  sse_port: number
  governance: GovernanceRules
}

export interface McpTool {
  name: string
  description: string
}

export interface McpAuditLog {
  id: string
  tool_name: string
  input_params: Record<string, unknown> | null
  output: Record<string, unknown> | null
  status: "success" | "blocked" | "error"
  blocked_reason: string | null
  execution_ms: number | null
  created_at: string
}

export interface GovernanceRules {
  max_order_qty: number
  allowed_actions: string[]
  require_human_approval_real: boolean
  enabled: boolean
}
