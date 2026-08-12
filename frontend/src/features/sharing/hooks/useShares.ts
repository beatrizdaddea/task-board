import { useQuery } from '@tanstack/react-query'

import { shareService } from '@/features/sharing/api/shareService'

export const shareKeys = {
  all: ['shares'] as const,
  list: (taskId: number) => [...shareKeys.all, taskId] as const,
}

export function useShares(taskId: number) {
  return useQuery({
    queryKey: shareKeys.list(taskId),
    queryFn: () => shareService.list(taskId),
  })
}
