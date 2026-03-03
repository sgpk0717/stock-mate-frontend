import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { cancelOrder, createOrder, fetchOrders } from "@/api"
import type { OrderCreate } from "@/types"

export function useOrders(params?: {
  mode?: string
  side?: string
  status?: string
}) {
  return useQuery({
    queryKey: ["orders", params],
    queryFn: () => fetchOrders(params),
  })
}

export function useCreateOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: OrderCreate) => createOrder(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] })
    },
  })
}

export function useCancelOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (orderId: string) => cancelOrder(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] })
    },
  })
}
