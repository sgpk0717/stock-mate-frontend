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
  symbol?: string,
  page = 0, limit = 50,
): Promise<PagedResponse<NewsExplorerRow>> {
  const params = new URLSearchParams()
  if (symbol) params.set("symbol", symbol)
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
