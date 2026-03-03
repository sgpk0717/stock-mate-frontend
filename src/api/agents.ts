import type {
  AgentSession,
  ChatResponse,
  CreateSessionResponse,
  FinalizeResponse,
} from "@/types/agent"
import { apiFetch } from "./client"

export async function createAgentSession(): Promise<CreateSessionResponse> {
  return apiFetch<CreateSessionResponse>("/agents/sessions", {
    method: "POST",
  })
}

export async function sendAgentMessage(
  sessionId: string,
  message: string,
): Promise<ChatResponse> {
  return apiFetch<ChatResponse>(`/agents/sessions/${sessionId}/chat`, {
    method: "POST",
    body: JSON.stringify({ message }),
  })
}

export async function fetchAgentSession(
  sessionId: string,
): Promise<AgentSession> {
  return apiFetch<AgentSession>(`/agents/sessions/${sessionId}`)
}

export async function finalizeAgentStrategy(
  sessionId: string,
): Promise<FinalizeResponse> {
  return apiFetch<FinalizeResponse>(`/agents/sessions/${sessionId}/finalize`, {
    method: "POST",
  })
}

export async function deleteAgentSession(sessionId: string): Promise<void> {
  const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8007"
  const response = await fetch(`${API_URL}/agents/sessions/${sessionId}`, {
    method: "DELETE",
  })
  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`)
  }
}
