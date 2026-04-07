import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { fetchTopology, fetchCollectors, restartCollector, fetchLLMUsage, fetchLLMUsageRecent, fetchLLMUsageSummary } from "@/api/system"

export function useTopology() {
  return useQuery({
    queryKey: ["system", "topology"],
    queryFn: fetchTopology,
    refetchInterval: 5_000,
  })
}

export function useCollectors() {
  return useQuery({
    queryKey: ["system", "collectors"],
    queryFn: fetchCollectors,
    refetchInterval: 10_000,
  })
}

export function useRestartCollector() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (collectorId: string) => restartCollector(collectorId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["system", "collectors"] })
    },
  })
}

export function useLLMUsage(params?: {
  days?: number
  caller?: string
  provider?: string
  group_by?: string
}) {
  return useQuery({
    queryKey: ["system", "llm-usage", params],
    queryFn: () => fetchLLMUsage(params),
    staleTime: 30_000,
  })
}

export function useLLMUsageRecent(limit = 50) {
  return useQuery({
    queryKey: ["system", "llm-usage-recent", limit],
    queryFn: () => fetchLLMUsageRecent(limit),
    staleTime: 30_000,
  })
}

export function useLLMUsageSummary(params?: {
  start?: string
  end?: string
  days?: number
}) {
  return useQuery({
    queryKey: ["system", "llm-usage-summary", params],
    queryFn: () => fetchLLMUsageSummary(params),
    staleTime: 30_000,
  })
}
