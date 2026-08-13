import type {
  Notification,
  ReadAllNotificationsResponse,
} from '@/features/notifications/types/notificationTypes'
import { httpClient } from '@/shared/lib/httpClient'

export const notificationsService = {
  list: () => httpClient.get<Notification[]>('notifications/'),
  markAsRead: (notificationId: number) =>
    httpClient.patch<Notification>(`notifications/${notificationId}/read/`, {}),
  markAllAsRead: () =>
    httpClient.post<ReadAllNotificationsResponse>('notifications/read-all/'),
}
