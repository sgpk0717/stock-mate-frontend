import { useEffect, useRef } from "react"
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
  deleteAlphaFactorsBatch,
  pruneFactors,
  startCausalValidationBatch,
  fetchCausalValidationStatus,
  cancelCausalValidation,
  backtestWithFactor,
  validateFactor,
  startFactory,
  stopFactory,
  fetchFactoryStatus,
  setFactoryAutoRestart,
  startAutoOptimize,
  fetchAutoOptimizeStatus,
  buildComposite,
  fetchCompositeFactors,
  fetchCorrelation,
  fetchUniverses,
  createFactorChat,
  sendFactorChatMessage,
  saveFactorFromChat,
  getDataAvailability,
  fetchMiningReport,
  fetchMiningReports,
  startCausalSweep,
  cancelCausalSweep,
  buildMegaAlpha,
  fetchMegaAlphaStatus,
} from "@/api/alpha"
import type {
  AlphaMineRequest,
  AlphaFactorBacktestRequest,
  AlphaFactoryStartRequest,
  AutoOptimizeRequest,
  CausalLogEntry,
  CompositeFactorBuildRequest,
} from "@/types/alpha"
import type { PruneFactorsParams } from "@/api/alpha"

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

export function useAlphaFactors(params?: {
  status?: string
  min_ic?: number
  causal_robust?: boolean
  interval?: string
  search?: string
  sort_by?: string
  order?: string
  page?: number
  limit?: number
}) {
  const page = params?.page ?? 0
  const limit = params?.limit ?? 100
  const offset = page * limit
  return useQuery({
    queryKey: ["alpha-factors", { ...params, offset, limit }],
    queryFn: () =>
      fetchAlphaFactors({
        status: params?.status,
        min_ic: params?.min_ic,
        causal_robust: params?.causal_robust,
        interval: params?.interval,
        search: params?.search,
        sort_by: params?.sort_by,
        order: params?.order,
        offset,
        limit,
      }),
    placeholderData: keepPreviousData,
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

export function useDeleteAlphaFactorsBatch() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (factorIds: string[]) => deleteAlphaFactorsBatch(factorIds),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["alpha-factors"] })
    },
  })
}

export function usePruneFactors() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (params: PruneFactorsParams) => pruneFactors(params),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["alpha-factors"] })
    },
  })
}

export function useStartCausalValidationBatch() {
  return useMutation({
    mutationFn: (factorIds: string[]) => startCausalValidationBatch(factorIds),
  })
}

export function useCausalValidationStatus(jobId: string | null) {
  const qc = useQueryClient()
  const logRef = useRef<CausalLogEntry[]>([])
  const sinceIdxRef = useRef(0)

  // job 변경 시 리셋
  useEffect(() => {
    logRef.current = []
    sinceIdxRef.current = 0
  }, [jobId])

  return useQuery({
    queryKey: ["causal-validation-status", jobId],
    queryFn: async () => {
      const data = await fetchCausalValidationStatus(jobId!, sinceIdxRef.current)
      if (data.logs && data.logs.length > 0) {
        logRef.current = [...logRef.current, ...data.logs]
        sinceIdxRef.current += data.logs.length
      }
      return { ...data, logs: logRef.current }
    },
    enabled: !!jobId,
    refetchInterval: (query) => {
      const status = query.state.data?.status
      if (status === "completed" || query.state.data?.cancelled) {
        qc.invalidateQueries({ queryKey: ["alpha-factors"] })
        return false
      }
      return 1000
    },
  })
}

export function useCancelCausalValidation() {
  return useMutation({
    mutationFn: cancelCausalValidation,
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
    mutationFn: (interval: string = "1d") => stopFactory(interval),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["alpha-factory-status"] })
    },
  })
}

export function useFactoryAutoRestart() {
  return useMutation({
    mutationFn: (enabled: boolean) => setFactoryAutoRestart(enabled),
  })
}

export function useFactoryStatus(interval = "1d") {
  return useQuery({
    queryKey: ["alpha-factory-status", interval],
    queryFn: () => fetchFactoryStatus(interval),
    placeholderData: keepPreviousData,
    refetchInterval: (query) => {
      return query.state.data?.running ? 3000 : 15000
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

export function useStartAutoOptimize() {
  return useMutation({
    mutationFn: (data?: AutoOptimizeRequest) => startAutoOptimize(data),
  })
}

export function useAutoOptimizeStatus(jobId: string | null) {
  const qc = useQueryClient()
  return useQuery({
    queryKey: ["auto-optimize-status", jobId],
    queryFn: () => fetchAutoOptimizeStatus(jobId!),
    enabled: !!jobId,
    retry: false, // 404 시 재시도 안 함
    refetchInterval: (query) => {
      if (query.state.error) return false // 에러(404 등) 시 폴링 중단
      const status = query.state.data?.status
      if (status === "completed" || status === "failed") {
        if (status === "completed") {
          qc.invalidateQueries({ queryKey: ["alpha-factors"] })
          qc.invalidateQueries({ queryKey: ["composite-factors"] })
        }
        return false
      }
      return 2000
    },
  })
}

export function useCompositeFactors() {
  return useQuery({
    queryKey: ["composite-factors"],
    queryFn: fetchCompositeFactors,
    staleTime: 30_000,
  })
}

// Factor AI Chat

export function useCreateFactorChat() {
  return useMutation({
    mutationFn: (factorId: string) => createFactorChat(factorId),
  })
}

export function useSendFactorChatMessage(sessionId: string | null) {
  return useMutation({
    mutationFn: (message: string) => {
      if (!sessionId) throw new Error("No session")
      return sendFactorChatMessage(sessionId, message)
    },
  })
}

export function useSaveFactorChat() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (sessionId: string) => saveFactorFromChat(sessionId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["alpha-factors"] })
    },
  })
}

export function useDataAvailability(interval: string) {
  return useQuery({
    queryKey: ["alpha-data-availability", interval],
    queryFn: () => getDataAvailability(interval),
    staleTime: 60_000, // 1분 캐시
  })
}

export function useImprovementHistory() {
  return useQuery({
    queryKey: ["alpha-improvement-history"],
    queryFn: () =>
      import("@/api/alpha").then((m) => m.fetchImprovementHistory()),
    staleTime: 60_000,
  })
}

export function useMiningReport(interval = "1d") {
  return useQuery({
    queryKey: ["alpha", "mining-report", interval],
    queryFn: () => fetchMiningReport(interval),
    refetchInterval: 30_000,
    placeholderData: keepPreviousData,
  })
}

export function useMiningReports(params: {
  interval?: string
  gen_from?: number
  gen_to?: number
  date_from?: string
  date_to?: string
}) {
  return useQuery({
    queryKey: ["alpha", "mining-reports", params],
    queryFn: () => fetchMiningReports(params),
    placeholderData: keepPreviousData,
    enabled: !!(params.gen_from != null || params.date_from),
  })
}

// [2026-03-31] 딥리서치 R1+R2 공통 권장 — 메가알파 빌드 훅
// 프로세스: /deep-research → 2건 보고서 교차 분석
// 변경/추가: useBuildMegaAlpha + useMegaAlphaStatus 훅

export function useBuildMegaAlpha() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ interval, minIcir }: { interval: string; minIcir: number }) =>
      buildMegaAlpha(interval, minIcir),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["alpha-factors"] })
      qc.invalidateQueries({ queryKey: ["mega-alpha-status"] })
    },
  })
}

export function useMegaAlphaStatus() {
  const qc = useQueryClient()
  return useQuery({
    queryKey: ["mega-alpha-status"],
    queryFn: () => fetchMegaAlphaStatus(),
    refetchInterval: (query) => {
      const status = query.state.data?.status
      if (status === "completed" || status === "failed" || status === "idle") {
        if (status === "completed") {
          qc.invalidateQueries({ queryKey: ["alpha-factors"] })
          qc.invalidateQueries({ queryKey: ["composite-factors"] })
        }
        return false
      }
      return 3000
    },
  })
}

// ── Causal Sweep ──

export function useStartCausalSweep() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (interval: string) => startCausalSweep(interval),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["alpha-factory-status"] })
    },
  })
}

export function useCancelCausalSweep() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ jobId, interval }: { jobId: string; interval: string }) => cancelCausalSweep(jobId, interval),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["alpha-factory-status"] })
      qc.invalidateQueries({ queryKey: ["alpha-factors"] })
    },
  })
}
