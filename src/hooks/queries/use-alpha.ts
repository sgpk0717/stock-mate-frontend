import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import {
  startAlphaMining,
  fetchMiningRun,
  fetchMiningRuns,
  fetchMiningLogs,
  deleteMiningRun,
  fetchAlphaFactors,
  fetchAlphaFactor,
  deleteAlphaFactor,
  backtestWithFactor,
  validateFactor,
  startFactory,
  stopFactory,
  fetchFactoryStatus,
  buildComposite,
  fetchCorrelation,
  fetchUniverses,
} from "@/api/alpha"
import type {
  AlphaMineRequest,
  AlphaFactorBacktestRequest,
  AlphaFactoryStartRequest,
  CompositeFactorBuildRequest,
} from "@/types/alpha"

export function useUniverses() {
  return useQuery({
    queryKey: ["alpha-universes"],
    queryFn: fetchUniverses,
    staleTime: 60 * 60 * 1000, // 1시간
  })
}

export function useStartAlphaMining() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: AlphaMineRequest) => startAlphaMining(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["alpha-mines"] })
    },
  })
}

export function useAlphaMiningRun(runId: string | null) {
  return useQuery({
    queryKey: ["alpha-mine", runId],
    queryFn: () => fetchMiningRun(runId!),
    enabled: !!runId,
    refetchInterval: (query) => {
      const status = query.state.data?.status
      return status === "PENDING" || status === "RUNNING" ? 2000 : false
    },
  })
}

export function useAlphaMiningRuns() {
  return useQuery({
    queryKey: ["alpha-mines"],
    queryFn: fetchMiningRuns,
  })
}

export function useAlphaMiningLogs(runId: string | null) {
  return useQuery({
    queryKey: ["alpha-mine-logs", runId],
    queryFn: () => fetchMiningLogs(runId!),
    enabled: !!runId,
  })
}

export function useDeleteAlphaMiningRun() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (runId: string) => deleteMiningRun(runId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["alpha-mines"] })
      qc.invalidateQueries({ queryKey: ["alpha-factors"] })
    },
  })
}

export function useAlphaFactors(params?: { status?: string; min_ic?: number }) {
  return useQuery({
    queryKey: ["alpha-factors", params],
    queryFn: () => fetchAlphaFactors(params),
  })
}

export function useAlphaFactor(factorId: string | null) {
  return useQuery({
    queryKey: ["alpha-factor", factorId],
    queryFn: () => fetchAlphaFactor(factorId!),
    enabled: !!factorId,
  })
}

export function useDeleteAlphaFactor() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (factorId: string) => deleteAlphaFactor(factorId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["alpha-factors"] })
    },
  })
}

export function useBacktestWithFactor() {
  return useMutation({
    mutationFn: ({
      factorId,
      data,
    }: {
      factorId: string
      data: AlphaFactorBacktestRequest
    }) => backtestWithFactor(factorId, data),
  })
}

export function useValidateFactor() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (factorId: string) => validateFactor(factorId),
    onSuccess: (_data, factorId) => {
      qc.invalidateQueries({ queryKey: ["alpha-factors"] })
      qc.invalidateQueries({ queryKey: ["alpha-factor", factorId] })
    },
  })
}

// Phase 3: Factory

export function useStartFactory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: AlphaFactoryStartRequest) => startFactory(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["alpha-factory-status"] })
    },
  })
}

export function useStopFactory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => stopFactory(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["alpha-factory-status"] })
    },
  })
}

export function useFactoryStatus() {
  return useQuery({
    queryKey: ["alpha-factory-status"],
    queryFn: fetchFactoryStatus,
    placeholderData: keepPreviousData,
    refetchInterval: (query) => {
      return query.state.data?.running ? 5000 : false
    },
  })
}

// Phase 3: Portfolio

export function useBuildComposite() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CompositeFactorBuildRequest) => buildComposite(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["alpha-factors"] })
    },
  })
}

export function useCorrelation(factorIds: string[]) {
  return useQuery({
    queryKey: ["alpha-correlation", factorIds],
    queryFn: () => fetchCorrelation(factorIds),
    enabled: factorIds.length >= 2,
  })
}
