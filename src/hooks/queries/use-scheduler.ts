import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { cancelJob, fetchActiveJobs, triggerCollect } from "@/api/scheduler"
import type { ManualTriggerRequest } from "@/api/scheduler"

export function useActiveJobs() {
  return useQuery({
    queryKey: ["scheduler", "jobs"],
    queryFn: fetchActiveJobs,
    refetchInterval: 3_000,
  })
}

export function useTriggerCollect() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (req: ManualTriggerRequest) => triggerCollect(req),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["scheduler", "jobs"] })
      qc.invalidateQueries({ queryKey: ["system", "collectors"] })
    },
  })
}

export function useCancelJob() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (jobId: string) => cancelJob(jobId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["scheduler", "jobs"] })
    },
  })
}
