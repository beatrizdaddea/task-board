import type {
  LoginInput,
  RegisterInput,
} from '@/features/auth/schemas/authSchemas'

export type AuthTokens = {
  access: string
  refresh: string
}

export type LoginPayload = LoginInput

export type RegisterPayload = Omit<RegisterInput, 'passwordConfirmation'>

export type RegisteredUser = {
  id: number
  username: string
  email: string
}

export type JwtPayload = {
  exp?: number
  user_id?: number
}
