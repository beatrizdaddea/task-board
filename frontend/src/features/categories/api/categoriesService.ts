import type { CategoryInput } from '@/features/categories/schemas/categorySchemas'
import type { Category } from '@/features/categories/types/categoryTypes'
import { httpClient } from '@/shared/lib/httpClient'

export const categoriesService = {
  list: () => httpClient.get<Category[]>('categories/'),
  create: (values: CategoryInput) =>
    httpClient.post<Category>('categories/', values),
  update: (categoryId: number, values: CategoryInput) =>
    httpClient.patch<Category>(`categories/${categoryId}/`, values),
  remove: (categoryId: number) =>
    httpClient.delete<void>(`categories/${categoryId}/`),
}
