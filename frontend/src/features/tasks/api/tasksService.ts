import type { TaskFormInput } from '@/features/tasks/schemas/taskSchemas'
import type {
  Task,
  TaskFilters,
  TaskPayload,
  TasksResponse,
} from '@/features/tasks/types/taskTypes'
import { httpClient } from '@/shared/lib/httpClient'

function toQueryString(filters: TaskFilters) {
  const params = new URLSearchParams({ page: String(filters.page) })

  if (filters.search) params.set('search', filters.search)
  if (filters.completed !== undefined) {
    params.set('completed', String(filters.completed))
  }
  if (filters.category !== undefined) {
    params.set('category', String(filters.category))
  }
  if (filters.priority) params.set('priority', filters.priority)

  return params.toString()
}

function toPayload(values: TaskFormInput): TaskPayload {
  return {
    ...values,
    category: Number(values.category),
    due_date: values.due_date || null,
  }
}

export const tasksService = {
  list: (filters: TaskFilters) =>
    httpClient.get<TasksResponse>(`tasks/?${toQueryString(filters)}`),
  create: (values: TaskFormInput) =>
    httpClient.post<Task>('tasks/', toPayload(values)),
  update: (task: Task, values: TaskFormInput) => {
    const payload: Partial<TaskPayload> = toPayload(values)
    if (!task.permissions.can_edit_category) delete payload.category
    return httpClient.patch<Task>(`tasks/${task.id}/`, payload)
  },
  remove: (taskId: number) => httpClient.delete<void>(`tasks/${taskId}/`),
  setCompleted: (taskId: number, completed: boolean) =>
    httpClient.patch<Task>(`tasks/${taskId}/`, { completed }),
}
