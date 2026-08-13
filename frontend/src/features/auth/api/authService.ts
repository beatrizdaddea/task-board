import type {
  AuthenticatedUser,
  AuthResponse,
  LoginPayload,
  RegisteredUser,
  RegisterPayload,
} from '@/features/auth/types/authTypes'
import { httpClient } from '@/shared/lib/httpClient'

export const authService = {
  prepareCsrf: () =>
    httpClient.get<AuthResponse>('auth/csrf/', { authenticated: false }),
  me: () => httpClient.get<AuthenticatedUser>('auth/me/'),
  login: async (credentials: LoginPayload) => {
    await authService.prepareCsrf()
    await httpClient.post<AuthResponse>('auth/login/', credentials, {
      authenticated: false,
    })
    return authService.me()
  },
  register: (payload: RegisterPayload) =>
    httpClient.post<RegisteredUser>('auth/register/', payload, {
      authenticated: false,
    }),
  logout: () =>
    httpClient.post<void>('auth/logout/', undefined, { authenticated: false }),
}
