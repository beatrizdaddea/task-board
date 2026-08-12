import { z } from 'zod'

export const loginSchema = z.object({
  username: z.string().trim().min(1, 'Informe o nome de usuário.'),
  password: z.string().min(1, 'Informe a senha.'),
})

export type LoginInput = z.infer<typeof loginSchema>
