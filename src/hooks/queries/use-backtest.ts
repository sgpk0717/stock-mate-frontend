import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  deleteBacktestRun,
  fetchBacktestRun,
  fetchBacktestRuns,
  fetchStrategies,
  generateAIStrategy,
  startBacktest,
} from "@/api"
import type { BacktestRunCreate } from "@/types"

export function useStrategies() {
  return useQuery({
    queryKey: ["backtest-strategies"],
    queryFn: fetchStrategies,
    staleTime: Infinity,
  })
}

export function useAIStrategy() {
  return useMutation({
    mutationFn: (prompt: string) => generateAIStrategy(prompt),
  })
}

export function useStartBacktest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: BacktestRunCreate) => startBacktest(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["backtest-runs"] })
    },
  })
}

export function useBacktestRun(runId: string | null) {
  return useQuery({
    queryKey: ["backtest-run", runId],
    queryFn: () => fetchBacktestRun(runId!),
    enabled: !!runId,
    refetchInterval: (query) => {
      const status = query.state.data?.status
      if (status === "PENDING" || status === "RUNNING") return 2000
      return false
    },
  })
}

export function useBacktestRuns(params?: {
  page?: number
  limit?: number
  sort_by?: string
  order?: string
  status?: string
  search?: string
}) {
  const page = params?.page ?? 0
  const limit = params?.limit ?? 20
  const offset = page * limit
  return useQuery({
    queryKey: ["backtest-runs", { ...params, offset, limit }],
    queryFn: () =>
      fetchBacktestRuns({
        offset,
        limit,
        sort_by: params?.sort_by,
        order: params?.order,
        status: params?.status,
        search: params?.search,
      }),
    placeholderData: keepPreviousData,
  })
}

export function useDeleteBacktestRun() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (runId: string) => deleteBacktestRun(runId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["backtest-runs"] })
    },
  })
}
