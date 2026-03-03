import { useQuery } from "@tanstack/react-query"
import {
  fetchSectorList,
  fetchSectorStocks,
  searchSectorStocks,
} from "@/api/sector"

export function useSectorSearch(query: string, topK = 20) {
  return useQuery({
    queryKey: ["sector-search", query, topK],
    queryFn: () => searchSectorStocks(query, topK),
    enabled: query.length >= 2,
    staleTime: 60 * 1000, // 1분
  })
}

export function useSectorList() {
  return useQuery({
    queryKey: ["sector-list"],
    queryFn: fetchSectorList,
    staleTime: Infinity,
  })
}

export function useSectorStocks(sectorName: string | null) {
  return useQuery({
    queryKey: ["sector-stocks", sectorName],
    queryFn: () => fetchSectorStocks(sectorName!),
    enabled: !!sectorName,
    staleTime: 5 * 60 * 1000,
  })
}
