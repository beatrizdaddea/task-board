import { tokenStorage } from '@/features/auth/api/tokenStorage'
import type {
  AuthTokens,
  LoginPayload,
  RegisteredUser,
  RegisterPayload,
} from '@/features/auth/types/authTypes'
import { httpClient } from '@/shared/lib/httpClient'

export const authService = {
  login: (credentials: LoginPayload) =>
    httpClient.post<AuthTokens>('auth/login/', credentials, {
      authenticated: false,
    }),
  register: (payload: RegisterPayload) =>
    httpClient.post<RegisteredUser>('auth/register/', payload, {
      authenticated: false,
    }),
  logout: () => tokenStorage.clear(),
}
