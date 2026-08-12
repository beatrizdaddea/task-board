import { useMutation } from '@tanstack/react-query'

import { authService } from '@/features/auth/api/authService'
import type { RegisterPayload } from '@/features/auth/types/authTypes'

export function useRegister() {
  return useMutation({
    mutationFn: (payload: RegisterPayload) => authService.register(payload),
  })
}
