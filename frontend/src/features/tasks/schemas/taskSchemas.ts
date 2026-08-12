import { z } from 'zod'

import { TASK_PRIORITIES } from '@/features/tasks/types/taskTypes'

function startOfToday() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return today
}

export const taskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Informe um título.')
    .max(200, 'O título deve ter no máximo 200 caracteres.'),
  description: z.string().trim(),
  category: z.string().min(1, 'Selecione uma categoria.'),
  priority: z.enum(TASK_PRIORITIES, {
    error: 'Selecione uma prioridade.',
  }),
  due_date: z.string().refine((value) => {
    if (!value) return true
    return new Date(`${value}T00:00:00`) >= startOfToday()
  }, 'A data de vencimento não pode estar no passado.'),
})

export const createTaskSchema = taskSchema
export const updateTaskSchema = taskSchema

export type TaskFormInput = z.infer<typeof taskSchema>
