import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  fetchWorkflowStatus,
  triggerWorkflowPhase,
  fetchWorkflowHistory,
  fetchWorkflowEvents,
  fetchBestFactors,
} from "@/api/workflow"

export function useWorkflowStatus() {
  return useQuery({
    queryKey: ["workflow", "status"],
    queryFn: fetchWorkflowStatus,
    refetchInterval: 10_000,
  })
}

export function useWorkflowHistory(limit = 30) {
  return useQuery({
    queryKey: ["workflow", "history", limit],
    queryFn: () => fetchWorkflowHistory(limit),
  })
}

export function useWorkflowEvents(runId: string | null) {
  return useQuery({
    queryKey: ["workflow", "events", runId],
    queryFn: () => fetchWorkflowEvents(runId!),
    enabled: !!runId,
  })
}

export function useBestFactors() {
  return useQuery({
    queryKey: ["workflow", "best-factors"],
    queryFn: fetchBestFactors,
  })
}

export function useTriggerWorkflow() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (phase: string) => triggerWorkflowPhase(phase),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflow"] })
    },
  })
}
