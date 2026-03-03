import { useMutation, useQuery } from "@tanstack/react-query"
import {
  fetchArticles,
  fetchSentiment,
  fetchSentimentBatch,
  triggerCollect,
} from "@/api/news"

export function useNewsSentiment(
  symbol: string | null,
  startDate?: string,
  endDate?: string,
) {
  return useQuery({
    queryKey: ["news-sentiment", symbol, startDate, endDate],
    queryFn: () => fetchSentiment(symbol!, startDate, endDate),
    enabled: !!symbol,
    staleTime: 5 * 60 * 1000, // 5분
  })
}

export function useNewsArticles(symbol: string | null, limit = 20) {
  return useQuery({
    queryKey: ["news-articles", symbol, limit],
    queryFn: () => fetchArticles(symbol!, limit),
    enabled: !!symbol,
    staleTime: 5 * 60 * 1000,
  })
}

export function useNewsSentimentBatch(
  symbols: string[],
  targetDate?: string,
) {
  return useQuery({
    queryKey: ["news-sentiment-batch", symbols, targetDate],
    queryFn: () => fetchSentimentBatch(symbols, targetDate),
    enabled: symbols.length > 0,
    staleTime: 5 * 60 * 1000,
  })
}

export function useCollectNews() {
  return useMutation({
    mutationFn: ({ symbols, days }: { symbols: string[]; days?: number }) =>
      triggerCollect(symbols, days),
  })
}
