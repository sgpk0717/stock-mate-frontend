import { useQuery } from "@tanstack/react-query"
import { fetchTopology } from "@/api/system"

export function useTopology() {
  return useQuery({
    queryKey: ["system", "topology"],
    queryFn: fetchTopology,
    refetchInterval: 5_000,
  })
}
