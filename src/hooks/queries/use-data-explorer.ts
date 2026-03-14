import { keepPreviousData, useQuery } from "@tanstack/react-query"
import {
  fetchCandleCoverage,
  fetchCollectionStatus,
  fetchDartFinancials,
  fetchDataGaps,
  fetchInvestorTrading,
  fetchMarginShort,
  fetchNewsExplorer,
  fetchProgramTrading,
} from "@/api/data-explorer"

export function useCollectionStatus() {
  return useQuery({
    queryKey: ["collection-status"],
    queryFn: fetchCollectionStatus,
    staleTime: 60_000,
  })
}

export function useInvestorTrading(
  symbol: string | null, startDate?: string, endDate?: string,
  page = 0, limit = 50,
) {
  return useQuery({
    queryKey: ["investor-trading", symbol, startDate, endDate, page, limit],
    queryFn: () => fetchInvestorTrading(symbol ?? undefined, startDate, endDate, page, limit),
    placeholderData: keepPreviousData,
  })
}

export function useMarginShort(
  symbol: string | null, startDate?: string, endDate?: string,
  page = 0, limit = 50,
) {
  return useQuery({
    queryKey: ["margin-short", symbol, startDate, endDate, page, limit],
    queryFn: () => fetchMarginShort(symbol ?? undefined, startDate, endDate, page, limit),
    placeholderData: keepPreviousData,
  })
}

export function useDartFinancials(
  symbol: string | null, year?: string,
  page = 0, limit = 50,
) {
  return useQuery({
    queryKey: ["dart-financials", symbol, year, page, limit],
    queryFn: () => fetchDartFinancials(symbol ?? undefined, year, page, limit),
    placeholderData: keepPreviousData,
  })
}

export function useProgramTrading(
  symbol: string | null, startDate?: string, endDate?: string,
  page = 0, limit = 50,
) {
  return useQuery({
    queryKey: ["program-trading", symbol, startDate, endDate, page, limit],
    queryFn: () => fetchProgramTrading(symbol ?? undefined, startDate, endDate, page, limit),
    placeholderData: keepPreviousData,
  })
}

export function useNewsExplorer(symbol: string | null, page = 0, limit = 50) {
  return useQuery({
    queryKey: ["news-explorer", symbol, page, limit],
    queryFn: () => fetchNewsExplorer(symbol ?? undefined, page, limit),
    placeholderData: keepPreviousData,
  })
}

export function useCandleCoverage(symbol?: string) {
  return useQuery({
    queryKey: ["candle-coverage", symbol],
    queryFn: () => fetchCandleCoverage(symbol),
    staleTime: 5 * 60_000,
  })
}

export function useDataGaps(dataType?: string, limit?: number) {
  return useQuery({
    queryKey: ["data-gaps", dataType, limit],
    queryFn: () => fetchDataGaps(dataType, limit),
    staleTime: 5 * 60_000,
  })
}
