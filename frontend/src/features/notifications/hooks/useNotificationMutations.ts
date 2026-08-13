import { useMutation, useQueryClient } from '@tanstack/react-query'

import { notificationsService } from '@/features/notifications/api/notificationsService'
import { notificationKeys } from '@/features/notifications/hooks/useNotifications'

export function useNotificationMutations() {
  const queryClient = useQueryClient()
  const refreshNotifications = () =>
    queryClient.invalidateQueries({ queryKey: notificationKeys.all })

  const markAsRead = useMutation({
    mutationFn: notificationsService.markAsRead,
    onSuccess: refreshNotifications,
  })
  const markAllAsRead = useMutation({
    mutationFn: notificationsService.markAllAsRead,
    onSuccess: refreshNotifications,
  })

  return { markAsRead, markAllAsRead }
}
