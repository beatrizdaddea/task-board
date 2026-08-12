import { RouterProvider } from 'react-router-dom'

import { AppProviders } from '@/app/providers/AppProviders'
import { router } from '@/app/router/router'
import { Toaster } from '@/shared/components/ui/toast'

export function App() {
  return (
    <AppProviders>
      <Toaster timeout={10_000}>
        <RouterProvider router={router} />
      </Toaster>
    </AppProviders>
  )
}
