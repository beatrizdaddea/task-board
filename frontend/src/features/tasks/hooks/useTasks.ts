import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { tasksService } from '@/features/tasks/api/tasksService'
import type { TaskFilters } from '@/features/tasks/types/taskTypes'

export const taskKeys = {
  all: ['tasks'] as const,
  list: (filters: TaskFilters) => [...taskKeys.all, 'list', filters] as const,
}

export function useTasks(filters: TaskFilters) {
  return useQuery({
    queryKey: taskKeys.list(filters),
    queryFn: () => tasksService.list(filters),
    placeholderData: keepPreviousData,
  })
}
