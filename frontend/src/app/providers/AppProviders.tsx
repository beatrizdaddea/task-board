import type { PropsWithChildren } from 'react'

import { QueryProvider } from '@/app/providers/QueryProvider'
import { AuthProvider } from '@/features/auth/context/AuthProvider'

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <QueryProvider>
      <AuthProvider>{children}</AuthProvider>
    </QueryProvider>
  )
}
