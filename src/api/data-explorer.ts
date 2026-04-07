import type {
  CandleCoverageItem,
  CollectionStatusItem,
  DartFinancialRow,
  DataGapItem,
  InvestorTradingRow,
  MarginShortRow,
  NewsExplorerRow,
  PagedResponse,
  ProgramTradingRow,
} from "@/types/data-explorer"
import { apiFetch } from "./client"

export async function fetchCollectionStatus(): Promise<CollectionStatusItem[]> {
  return apiFetch<CollectionStatusItem[]>("/data/collection-status")
}

export async function fetchInvestorTrading(
  symbol?: string, startDate?: string, endDate?: string,
  page = 0, limit = 50,
): Promise<PagedResponse<InvestorTradingRow>> {
  const params = new URLSearchParams()
  if (symbol) params.set("symbol", symbol)
  if (startDate) params.set("start", startDate)
  if (endDate) params.set("end", endDate)
  params.set("page", String(page))
  params.set("limit", String(limit))
  return apiFetch<PagedResponse<InvestorTradingRow>>(`/data/investor-trading?${params}`)
}

export async function fetchMarginShort(
  symbol?: string, startDate?: string, endDate?: string,
  page = 0, limit = 50,
): Promise<PagedResponse<MarginShortRow>> {
  const params = new URLSearchParams()
  if (symbol) params.set("symbol", symbol)
  if (startDate) params.set("start", startDate)
  if (endDate) params.set("end", endDate)
  params.set("page", String(page))
  params.set("limit", String(limit))
  return apiFetch<PagedResponse<MarginShortRow>>(`/data/margin-short?${params}`)
}

export async function fetchDartFinancials(
  symbol?: string, year?: string,
  page = 0, limit = 50,
): Promise<PagedResponse<DartFinancialRow>> {
  const params = new URLSearchParams()
  if (symbol) params.set("symbol", symbol)
  if (year) params.set("year", year)
  params.set("page", String(page))
  params.set("limit", String(limit))
  return apiFetch<PagedResponse<DartFinancialRow>>(`/data/dart-financials?${params}`)
}

export async function fetchProgramTrading(
  symbol?: string, startDate?: string, endDate?: string,
  page = 0, limit = 50,
): Promise<PagedResponse<ProgramTradingRow>> {
  const params = new URLSearchParams()
  if (symbol) params.set("symbol", symbol)
  if (startDate) params.set("start", startDate)
  if (endDate) params.set("end", endDate)
  params.set("page", String(page))
  params.set("limit", String(limit))
  return apiFetch<PagedResponse<ProgramTradingRow>>(`/data/program-trading?${params}`)
}

export async function fetchNewsExplorer(
  symbol?: string, startDate?: string, endDate?: string,
  page = 0, limit = 50,
): Promise<PagedResponse<NewsExplorerRow>> {
  const params = new URLSearchParams()
  if (symbol) params.set("symbol", symbol)
  if (startDate) params.set("start", startDate)
  if (endDate) params.set("end", endDate)
  params.set("page", String(page))
  params.set("limit", String(limit))
  return apiFetch<PagedResponse<NewsExplorerRow>>(`/data/news?${params}`)
}

export async function fetchCandleCoverage(symbol?: string): Promise<CandleCoverageItem[]> {
  const params = new URLSearchParams()
  if (symbol) params.set("symbol", symbol)
  const qs = params.toString()
  return apiFetch<CandleCoverageItem[]>(`/data/candle-coverage${qs ? `?${qs}` : ""}`)
}

export async function fetchDataGaps(dataType?: string, limit?: number): Promise<DataGapItem[]> {
  const params = new URLSearchParams()
  if (dataType) params.set("data_type", dataType)
  if (limit !== undefined) params.set("limit", String(limit))
  const qs = params.toString()
  return apiFetch<DataGapItem[]>(`/data/gaps${qs ? `?${qs}` : ""}`)
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8007"

/** SSE 스트림으로 데이터 검증 실행. onMessage 콜백에 각 이벤트 전달. */
export function startVerification(
  source: string,
  onMessage: (data: VerifyEvent) => void,
  opts?: { lookbackDays?: number },
): AbortController {
  const ctrl = new AbortController()
  const params = new URLSearchParams()
  if (opts?.lookbackDays) params.set("lookback_days", String(opts.lookbackDays))
  const qs = params.toString()
  const url = `${API_URL}/data/verify/${source}${qs ? `?${qs}` : ""}`

  fetch(url, { signal: ctrl.signal })
    .then(async (resp) => {
      if (!resp.ok || !resp.body) {
        onMessage({ type: "error", message: `HTTP ${resp.status}` })
        return
      }
      const reader = resp.body.getReader()
      const dec = new TextDecoder()
      let buf = ""
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buf += dec.decode(value, { stream: true })
        const lines = buf.split("\n")
        buf = lines.pop() ?? ""
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              onMessage(JSON.parse(line.slice(6)))
            } catch { /* ignore parse errors */ }
          }
        }
      }
    })
    .catch((e) => {
      if (e.name !== "AbortError") {
        onMessage({ type: "error", message: String(e) })
      }
    })

  return ctrl
}

export interface VerifyEvent {
  type: "start" | "progress" | "gap" | "done" | "error"
  message?: string
  pct?: number
  date?: string
  verified_until?: string | null
  gaps?: Array<{ date: string; type: string; message: string }>
  total_gaps?: number
  total_checked?: number
  [key: string]: unknown
}
