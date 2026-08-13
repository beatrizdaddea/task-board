import { useQuery } from '@tanstack/react-query'

import { notificationsService } from '@/features/notifications/api/notificationsService'

export const notificationKeys = {
  all: ['notifications'] as const,
}

export function useNotifications() {
  return useQuery({
    queryKey: notificationKeys.all,
    queryFn: notificationsService.list,
  })
}
