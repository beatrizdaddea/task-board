import { useMutation } from '@tanstack/react-query'

import { authService } from '@/features/auth/api/authService'
import { useAuth } from '@/features/auth/hooks/useAuth'
import type { LoginPayload } from '@/features/auth/types/authTypes'

export function useLogin() {
  const { login } = useAuth()

  return useMutation({
    mutationFn: (credentials: LoginPayload) => authService.login(credentials),
    onSuccess: ({ access }) => login(access),
  })
}
