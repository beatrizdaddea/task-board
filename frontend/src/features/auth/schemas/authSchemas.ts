import { z } from 'zod'

export const loginSchema = z.object({
  username: z.string().trim().min(1, 'Informe o nome de usuário.'),
  password: z.string().min(1, 'Informe a senha.'),
})

export const registerSchema = z
  .object({
    username: z
      .string()
      .trim()
      .min(3, 'O nome de usuário deve ter pelo menos 3 caracteres.'),
    email: z.email('Informe um e-mail válido.'),
    password: z.string().min(8, 'A senha deve ter pelo menos 8 caracteres.'),
    passwordConfirmation: z.string().min(1, 'Confirme a senha.'),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    message: 'As senhas não coincidem.',
    path: ['passwordConfirmation'],
  })

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
