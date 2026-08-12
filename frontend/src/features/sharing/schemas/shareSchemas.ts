import { z } from 'zod'

import { SHARE_PERMISSIONS } from '@/features/sharing/types/shareTypes'

export const createShareSchema = z.object({
  user_email: z
    .string()
    .trim()
    .min(1, 'Informe o e-mail do usuário.')
    .email('Informe um e-mail válido.'),
  permission: z.enum(SHARE_PERMISSIONS, {
    error: 'Selecione uma permissão.',
  }),
})

export const updateShareSchema = z.object({
  permission: z.enum(SHARE_PERMISSIONS),
})

export type CreateShareInput = z.infer<typeof createShareSchema>
