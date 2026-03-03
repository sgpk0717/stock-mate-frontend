import { useQuery } from "@tanstack/react-query"
import { fetchPositions } from "@/api"

export function usePositions(mode = "PAPER") {
  return useQuery({
    queryKey: ["positions", mode],
    queryFn: () => fetchPositions(mode),
  })
}
