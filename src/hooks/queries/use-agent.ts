import { useMutation, useQuery } from "@tanstack/react-query"
import {
  createAgentSession,
  deleteAgentSession,
  fetchAgentSession,
  finalizeAgentStrategy,
  sendAgentMessage,
} from "@/api/agents"

export function useCreateSession() {
  return useMutation({
    mutationFn: () => createAgentSession(),
  })
}

export function useSendMessage(sessionId: string | null) {
  return useMutation({
    mutationFn: (message: string) => {
      if (!sessionId) throw new Error("세션이 없습니다.")
      return sendAgentMessage(sessionId, message)
    },
  })
}

export function useAgentSession(sessionId: string | null) {
  return useQuery({
    queryKey: ["agent-session", sessionId],
    queryFn: () => fetchAgentSession(sessionId!),
    enabled: !!sessionId,
  })
}

export function useFinalizeStrategy(sessionId: string | null) {
  return useMutation({
    mutationFn: () => {
      if (!sessionId) throw new Error("세션이 없습니다.")
      return finalizeAgentStrategy(sessionId)
    },
  })
}

export function useDeleteSession() {
  return useMutation({
    mutationFn: (sessionId: string) => deleteAgentSession(sessionId),
  })
}
