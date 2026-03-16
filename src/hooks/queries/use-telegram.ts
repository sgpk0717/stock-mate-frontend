import { useQuery } from "@tanstack/react-query"
import { fetchTelegramLogs } from "@/api/telegram"

export function useTelegramLogs(params?: {
  limit?: number
  offset?: number
  category?: string
  status?: string
}) {
  return useQuery({
    queryKey: ["telegram", "logs", params],
    queryFn: () => fetchTelegramLogs(params),
    refetchInterval: 30_000,
  })
}
