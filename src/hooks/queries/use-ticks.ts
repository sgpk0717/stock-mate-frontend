import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { fetchCandles, fetchStockList, fetchTicks } from "@/api"
import type { CandleData, CandleWithIndicators } from "@/types"

export function useCandles(
  symbol: string,
  interval = "1d",
  count = 200,
  indicators?: string[],
) {
  return useQuery({
    queryKey: ["candles", symbol, interval, count, indicators],
    queryFn: async () => {
      const result = await fetchCandles(symbol, interval, count, indicators)
      // indicators가 없으면 CandleData[] 반환, 있으면 CandleWithIndicators 반환
      if (indicators?.length) {
        const wrapped = result as CandleWithIndicators
        return wrapped
      }
      return { candles: result as CandleData[], indicators: undefined }
    },
    enabled: !!symbol,
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000, // 5분간 캐시 유지 (같은 종목 재클릭 시 재호출 방지)
  })
}

export function useCandlesByDateRange(
  symbol: string,
  interval: string,
  startDate: string | undefined,
  endDate: string | undefined,
) {
  return useQuery({
    queryKey: ["candles-range", symbol, interval, startDate, endDate],
    queryFn: async () => {
      const result = await fetchCandles(symbol, interval, 0, undefined, startDate!, endDate!)
      if (Array.isArray(result)) return { candles: result, indicators: undefined }
      return result
    },
    enabled: !!symbol && !!startDate && !!endDate,
    staleTime: 5 * 60 * 1000,
  })
}

export function useTicks(symbol: string, limit = 1000) {
  return useQuery({
    queryKey: ["ticks", symbol, limit],
    queryFn: () => fetchTicks(symbol, limit),
    enabled: !!symbol,
  })
}

export function useStockList() {
  return useQuery({
    queryKey: ["stockList"],
    queryFn: fetchStockList,
    staleTime: 60 * 60 * 1000, // 1시간
  })
}
