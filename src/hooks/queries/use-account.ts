import { useQuery } from "@tanstack/react-query"
import { fetchAccount } from "@/api"

export function useAccount(id = 1) {
  return useQuery({
    queryKey: ["account", id],
    queryFn: () => fetchAccount(id),
  })
}
