import { useMutation, useQueryClient } from '@tanstack/react-query'

import { shareService } from '@/features/sharing/api/shareService'
import { shareKeys } from '@/features/sharing/hooks/useShares'
import type {
  CreateSharePayload,
  SharePermission,
} from '@/features/sharing/types/shareTypes'

export function useShareMutations(taskId: number) {
  const queryClient = useQueryClient()

  const refreshSharing = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: shareKeys.list(taskId) }),
      queryClient.invalidateQueries({ queryKey: ['tasks'] }),
    ])
  }

  const createShare = useMutation({
    mutationFn: (payload: CreateSharePayload) =>
      shareService.create(taskId, payload),
    onSuccess: refreshSharing,
  })
  const updateShare = useMutation({
    mutationFn: ({
      shareId,
      permission,
    }: {
      shareId: number
      permission: SharePermission
    }) => shareService.update(taskId, shareId, permission),
    onSuccess: refreshSharing,
  })
  const deleteShare = useMutation({
    mutationFn: (shareId: number) => shareService.remove(taskId, shareId),
    onSuccess: refreshSharing,
  })

  return { createShare, updateShare, deleteShare }
}
