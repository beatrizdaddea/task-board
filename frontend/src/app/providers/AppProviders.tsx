import type { PropsWithChildren } from 'react'

import { QueryProvider } from '@/app/providers/QueryProvider'

export function AppProviders({ children }: PropsWithChildren) {
  return <QueryProvider>{children}</QueryProvider>
}
