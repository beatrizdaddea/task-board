export type NotificationType = 'TASK_SHARED' | 'TASK_DUE_SOON' | 'TASK_OVERDUE'

export type Notification = {
  id: number
  type: NotificationType
  task: number | null
  message: string
  created_at: string
  read_at: string | null
}

export type ReadAllNotificationsResponse = {
  updated: number
}
