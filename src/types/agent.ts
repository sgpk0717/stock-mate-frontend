import type { BacktestStrategy } from "@/types"

export interface ChatMessage {
  role: "user" | "assistant" | "system"
  content: string
  timestamp: string
  tool_use?: { name: string; input: Record<string, unknown> }
  strategy_draft?: BacktestStrategy | null
}

export interface AgentSession {
  session_id: string
  messages: ChatMessage[]
  strategy_draft: BacktestStrategy | null
  status: "active" | "finalized" | "expired"
  created_at: string
  updated_at: string
}

export interface CreateSessionResponse {
  session_id: string
  status: string
  created_at: string
}

export interface ChatResponse {
  role: string
  content: string
  timestamp: string
  strategy_draft: BacktestStrategy | null
}

export interface FinalizeResponse {
  strategy: BacktestStrategy
  message: string
}
