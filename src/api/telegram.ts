import type { TelegramLog } from "@/types/telegram"
import { apiFetch } from "./client"

export async function fetchTelegramLogs(params?: {
  limit?: number
  offset?: number
  category?: string
  status?: string
}): Promise<TelegramLog[]> {
  const sp = new URLSearchParams()
  if (params?.limit) sp.set("limit", String(params.limit))
  if (params?.offset) sp.set("offset", String(params.offset))
  if (params?.category) sp.set("category", params.category)
  if (params?.status) sp.set("status", params.status)
  const qs = sp.toString()
  return apiFetch<TelegramLog[]>(`/telegram/logs${qs ? `?${qs}` : ""}`)
}
