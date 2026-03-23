import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { fetchTopology, fetchCollectors, restartCollector } from "@/api/system"

export function useTopology() {
  return useQuery({
    queryKey: ["system", "topology"],
    queryFn: fetchTopology,
    refetchInterval: 5_000,
  })
}

export function useCollectors() {
  return useQuery({
    queryKey: ["system", "collectors"],
    queryFn: fetchCollectors,
    refetchInterval: 10_000,
  })
}

export function useRestartCollector() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (collectorId: string) => restartCollector(collectorId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["system", "collectors"] })
    },
  })
}
