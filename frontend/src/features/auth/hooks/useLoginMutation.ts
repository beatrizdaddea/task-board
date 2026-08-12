import { useMutation } from '@tanstack/react-query'

import { authService } from '@/features/auth/api/authService'
import type { LoginInput } from '@/features/auth/schemas/loginSchema'
import { tokenStorage } from '@/shared/lib/auth/tokenStorage'

export function useLoginMutation() {
  return useMutation({
    mutationFn: (credentials: LoginInput) => authService.login(credentials),
    onSuccess: ({ access, refresh }) => {
      tokenStorage.setTokens(access, refresh)
    },
  })
}
