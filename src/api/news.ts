import type { CollectResponse, NewsArticle, NewsSentimentDaily } from "@/types/news"
import { apiFetch } from "./client"

export async function fetchSentiment(
  symbol: string,
  startDate?: string,
  endDate?: string,
): Promise<NewsSentimentDaily[]> {
  const params = new URLSearchParams()
  if (startDate) params.set("start_date", startDate)
  if (endDate) params.set("end_date", endDate)
  const qs = params.toString()
  return apiFetch<NewsSentimentDaily[]>(
    `/news/sentiment/${symbol}${qs ? `?${qs}` : ""}`,
  )
}

export async function fetchArticles(
  symbol: string,
  limit = 20,
): Promise<NewsArticle[]> {
  return apiFetch<NewsArticle[]>(
    `/news/articles/${symbol}?limit=${limit}`,
  )
}

export async function triggerCollect(
  symbols: string[],
  days = 1,
): Promise<CollectResponse> {
  const params = new URLSearchParams()
  for (const sym of symbols) params.append("symbols", sym)
  params.set("days", String(days))
  return apiFetch<CollectResponse>(`/news/collect?${params}`, {
    method: "POST",
  })
}

export async function fetchSentimentBatch(
  symbols: string[],
  targetDate?: string,
): Promise<NewsSentimentDaily[]> {
  const params = new URLSearchParams()
  params.set("symbols", symbols.join(","))
  if (targetDate) params.set("target_date", targetDate)
  return apiFetch<NewsSentimentDaily[]>(
    `/news/sentiment/batch?${params}`,
  )
}
