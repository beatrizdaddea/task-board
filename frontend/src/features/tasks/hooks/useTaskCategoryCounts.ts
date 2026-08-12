import { useQueries } from '@tanstack/react-query'

import { tasksService } from '@/features/tasks/api/tasksService'
import { taskKeys } from '@/features/tasks/hooks/useTasks'

export function useTaskCategoryCounts(categoryIds: number[]) {
  const countFilters = { page: 1 }
  const filtersByCategory = [
    countFilters,
    ...categoryIds.map((category) => ({ ...countFilters, category })),
  ]
  const queries = useQueries({
    queries: filtersByCategory.map((queryFilters) => ({
      queryKey: taskKeys.list(queryFilters),
      queryFn: () => tasksService.list(queryFilters),
      staleTime: 30_000,
    })),
  })

  return {
    total: queries[0]?.data?.count,
    counts: new Map(
      categoryIds.map((categoryId, index) => [
        categoryId,
        queries[index + 1]?.data?.count,
      ]),
    ),
    isLoading: queries.some((query) => query.isLoading),
  }
}
