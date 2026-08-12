import { z } from 'zod'

export const categorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, 'O nome deve ter pelo menos 3 caracteres.')
    .max(100, 'O nome deve ter no máximo 100 caracteres.'),
})

export const createCategorySchema = categorySchema
export const updateCategorySchema = categorySchema

export type CategoryInput = z.infer<typeof categorySchema>
