import { useMutation, useQueryClient } from '@tanstack/react-query'

import { categoriesService } from '@/features/categories/api/categoriesService'
import { categoryKeys } from '@/features/categories/hooks/useCategories'
import type { CategoryInput } from '@/features/categories/schemas/categorySchemas'
import { taskKeys } from '@/features/tasks/hooks/useTasks'

export function useCategoryMutations() {
  const queryClient = useQueryClient()

  const refreshCategories = () =>
    queryClient.invalidateQueries({ queryKey: categoryKeys.all })

  const refreshCategoriesAndTasks = async () => {
    await Promise.all([
      refreshCategories(),
      queryClient.invalidateQueries({ queryKey: taskKeys.all }),
    ])
  }

  const createCategory = useMutation({
    mutationFn: categoriesService.create,
    onSuccess: refreshCategories,
  })
  const updateCategory = useMutation({
    mutationFn: ({
      categoryId,
      values,
    }: {
      categoryId: number
      values: CategoryInput
    }) => categoriesService.update(categoryId, values),
    onSuccess: refreshCategoriesAndTasks,
  })
  const deleteCategory = useMutation({
    mutationFn: categoriesService.remove,
    onSuccess: refreshCategoriesAndTasks,
  })

  return { createCategory, updateCategory, deleteCategory }
}
