import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  createContextFromBacktest,
  createTradingContext,
  deleteTradingContext,
  fetchAlphaRanking,
  fetchAlphaRankingByFactor,
  fetchKISBalance,
  fetchKISOrders,
  fetchSessionDecisions,
  fetchSessionTrades,
  fetchTradingAutoStart,
  fetchTradingContexts,
  fetchTradingSession,
  fetchTradingStatus,
  setTradingAutoStart,
  startTrading,
  stopTrading,
} from "@/api/trading"

// ── Context ──────────────────────────────────────────────

export function useTradingContexts() {
  return useQuery({
    queryKey: ["trading-contexts"],
    queryFn: fetchTradingContexts,
    staleTime: 10_000,
  })
}

export function useCreateTradingContext() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createTradingContext,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["trading-contexts"] }),
  })
}

export function useCreateContextFromBacktest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      run,
      mode,
    }: {
      run: Record<string, unknown>
      mode: "paper" | "real"
    }) => createContextFromBacktest(run, mode),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["trading-contexts"] }),
  })
}

export function useDeleteTradingContext() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteTradingContext,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["trading-contexts"] }),
  })
}

// ── 세션 ──────────────────────────────────────────────────

export function useTradingStatus() {
  return useQuery({
    queryKey: ["trading-status"],
    queryFn: fetchTradingStatus,
    refetchInterval: 5_000,
  })
}

export function useTradingSession(sessionId: string | null) {
  return useQuery({
    queryKey: ["trading-session", sessionId],
    queryFn: () => fetchTradingSession(sessionId!),
    enabled: !!sessionId,
    refetchInterval: 3_000,
  })
}

export function useSessionTrades(sessionId: string | null) {
  return useQuery({
    queryKey: ["trading-session-trades", sessionId],
    queryFn: () => fetchSessionTrades(sessionId!),
    enabled: !!sessionId,
    refetchInterval: 5_000,
  })
}

export function useStartTrading() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: startTrading,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["trading-status"] }),
  })
}

export function useStopTrading() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: stopTrading,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["trading-status"] }),
  })
}

// ── 자동매매 수동중단 ────────────────────────────────────

export function useTradingAutoStart() {
  return useQuery({
    queryKey: ["trading-auto-start"],
    queryFn: fetchTradingAutoStart,
    refetchInterval: 10_000,
  })
}

export function useSetTradingAutoStart() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (enabled: boolean) => setTradingAutoStart(enabled),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["trading-auto-start"] })
      qc.invalidateQueries({ queryKey: ["trading-status"] })
    },
  })
}

// ── KIS 조회 ──────────────────────────────────────────────

export function useKISBalance(isMock = true) {
  return useQuery({
    queryKey: ["kis-balance", isMock],
    queryFn: () => fetchKISBalance(isMock),
    staleTime: 10_000,
  })
}

export function useKISOrders(isMock = true) {
  return useQuery({
    queryKey: ["kis-orders", isMock],
    queryFn: () => fetchKISOrders(isMock),
    staleTime: 10_000,
  })
}

export function useAlphaRanking(topN: number = 10) {
  return useQuery({
    queryKey: ["alpha-ranking", topN],
    queryFn: () => fetchAlphaRanking(topN),
    refetchInterval: 5_000,
  })
}

export function useAlphaRankingByFactor(topN: number = 10) {
  return useQuery({
    queryKey: ["alpha-ranking-by-factor", topN],
    queryFn: () => fetchAlphaRankingByFactor(topN),
    refetchInterval: 5_000,
  })
}

export function useSessionDecisions(
  sessionId: string | null,
  opts?: { action?: string; limit?: number },
) {
  return useQuery({
    queryKey: ["session-decisions", sessionId, opts?.action],
    queryFn: () => fetchSessionDecisions(sessionId!, opts),
    enabled: !!sessionId,
    refetchInterval: 5_000,
  })
}

export function useTradingDayDetail(date: string | null) {
  return useQuery({
    queryKey: ["trading-day-detail", date],
    queryFn: () =>
      import("@/api/trading").then((m) => m.fetchTradingDayDetail(date!)),
    enabled: !!date,
    staleTime: 60_000,
  })
}
