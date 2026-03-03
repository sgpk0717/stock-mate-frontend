import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  cancelPaperOrder,
  createPaperOrder,
  fetchPaperAccount,
  fetchPaperOrders,
  fetchPaperPositions,
  resetPaper,
} from "@/api"
import type { OrderCreate } from "@/types"

export function usePaperOrders(params?: { status?: string }) {
  return useQuery({
    queryKey: ["paper-orders", params],
    queryFn: () => fetchPaperOrders(params),
    refetchInterval: 3000,
  })
}

export function useCreatePaperOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Omit<OrderCreate, "mode">) => createPaperOrder(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["paper-orders"] })
      queryClient.invalidateQueries({ queryKey: ["paper-positions"] })
      queryClient.invalidateQueries({ queryKey: ["paper-account"] })
    },
  })
}

export function useCancelPaperOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (orderId: string) => cancelPaperOrder(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["paper-orders"] })
    },
  })
}

export function usePaperPositions() {
  return useQuery({
    queryKey: ["paper-positions"],
    queryFn: fetchPaperPositions,
    refetchInterval: 5000,
  })
}

export function usePaperAccount() {
  return useQuery({
    queryKey: ["paper-account"],
    queryFn: fetchPaperAccount,
    refetchInterval: 5000,
  })
}

export function useResetPaper() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: resetPaper,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["paper-orders"] })
      queryClient.invalidateQueries({ queryKey: ["paper-positions"] })
      queryClient.invalidateQueries({ queryKey: ["paper-account"] })
    },
  })
}
