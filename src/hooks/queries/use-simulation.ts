import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import {
  startStressTest,
  fetchStressTest,
  fetchStressTests,
  deleteStressTest,
  fetchScenarios,
  generateScenario,
  fetchMcpStatus,
  fetchMcpTools,
  fetchMcpAudit,
  updateGovernance,
} from "@/api/simulation"
import type {
  GovernanceRules,
  StressTestRequest,
} from "@/types/simulation"

// ── Simulation ───────────────────────────────────────────

export function useStartStressTest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: StressTestRequest) => startStressTest(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["stress-tests"] }),
  })
}

export function useStressTest(id: string | null) {
  return useQuery({
    queryKey: ["stress-test", id],
    queryFn: () => fetchStressTest(id!),
    enabled: !!id,
    placeholderData: keepPreviousData,
    refetchInterval: (query) => {
      const status = query.state.data?.status
      if (status === "PENDING" || status === "RUNNING") return 2000
      return false
    },
  })
}

export function useStressTests() {
  return useQuery({
    queryKey: ["stress-tests"],
    queryFn: () => fetchStressTests(),
    placeholderData: keepPreviousData,
  })
}

export function useDeleteStressTest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteStressTest,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["stress-tests"] }),
  })
}

export function useScenarios() {
  return useQuery({
    queryKey: ["stress-scenarios"],
    queryFn: fetchScenarios,
    staleTime: Infinity,
  })
}

export function useGenerateScenario() {
  return useMutation({
    mutationFn: (prompt: string) => generateScenario(prompt),
  })
}

// ── MCP ──────────────────────────────────────────────────

export function useMcpStatus() {
  return useQuery({
    queryKey: ["mcp-status"],
    queryFn: fetchMcpStatus,
    placeholderData: keepPreviousData,
    refetchInterval: 10_000,
  })
}

export function useMcpTools() {
  return useQuery({
    queryKey: ["mcp-tools"],
    queryFn: fetchMcpTools,
    staleTime: 30_000,
  })
}

export function useMcpAudit(params?: {
  limit?: number
  tool_name?: string
}) {
  return useQuery({
    queryKey: ["mcp-audit", params],
    queryFn: () => fetchMcpAudit(params),
    placeholderData: keepPreviousData,
    refetchInterval: 10_000,
  })
}

export function useUpdateGovernance() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (rules: Partial<GovernanceRules>) => updateGovernance(rules),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["mcp-status"] }),
  })
}
