import { apiFetch } from "./client"

export interface SectorSearchResult {
  symbol: string
  name: string
  market: string
  sector: string | null
  sub_sector: string | null
  similarity: number
}

export interface SectorInfo {
  sector: string
  count: number
}

export async function searchSectorStocks(
  query: string,
  topK = 20,
  minSimilarity = 0.3,
): Promise<SectorSearchResult[]> {
  const params = new URLSearchParams({
    q: query,
    top_k: String(topK),
    min_similarity: String(minSimilarity),
  })
  return apiFetch<SectorSearchResult[]>(`/sector/search?${params}`)
}

export async function fetchSectorList(): Promise<SectorInfo[]> {
  return apiFetch<SectorInfo[]>("/sector/list")
}

export async function fetchSectorStocks(
  sectorName: string,
): Promise<SectorSearchResult[]> {
  return apiFetch<SectorSearchResult[]>(`/sector/stocks/${encodeURIComponent(sectorName)}`)
}
