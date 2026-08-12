import type { LoginInput } from '@/features/auth/schemas/loginSchema'
import type { AuthTokens } from '@/features/auth/types/auth'
import { httpClient } from '@/shared/lib/http/httpClient'

export const authService = {
  login: (credentials: LoginInput) =>
    httpClient.post<AuthTokens>('auth/login/', credentials, {
      authenticated: false,
    }),
}
