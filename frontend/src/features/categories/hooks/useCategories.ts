import { useQuery } from '@tanstack/react-query'

import { categoriesService } from '@/features/categories/api/categoriesService'

export const categoryKeys = {
  all: ['categories'] as const,
  list: () => [...categoryKeys.all, 'list'] as const,
}

export function useCategories() {
  return useQuery({
    queryKey: categoryKeys.list(),
    queryFn: categoriesService.list,
    staleTime: 5 * 60 * 1000,
  })
}
