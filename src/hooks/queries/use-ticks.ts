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
