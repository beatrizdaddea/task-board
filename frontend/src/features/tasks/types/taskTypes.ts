import type { PaginatedResponse } from '@/shared/types/api'

export const TASK_PRIORITIES = ['low', 'medium', 'high'] as const

export type TaskPriority = (typeof TASK_PRIORITIES)[number]

export type TaskPermissions = {
  can_edit: boolean
  can_edit_category: boolean
  can_delete: boolean
  can_change_status: boolean
  can_view_shares: boolean
  can_manage_shares: boolean
}

export type Task = {
  id: number
  title: string
  description: string
  completed: boolean
  priority: TaskPriority
  due_date: string | null
  category: number | null
  category_name: string | null
  created_at: string
  updated_at: string
  is_shared: boolean
  permissions: TaskPermissions
}

export type TaskFilters = {
  search?: string
  completed?: boolean
  category?: number
  priority?: TaskPriority
  page: number
}

export type TaskPayload = {
  title: string
  description: string
  category: number
  priority: TaskPriority
  due_date: string | null
}

export type TasksResponse = PaginatedResponse<Task>
