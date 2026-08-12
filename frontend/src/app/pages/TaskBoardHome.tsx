import { Navigate } from 'react-router-dom'

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/shared/components/ui/empty'
import { tokenStorage } from '@/shared/lib/auth/tokenStorage'

export function TaskBoardHome() {
  if (!tokenStorage.getAccessToken()) {
    return <Navigate to="/login" replace />
  }

  return (
    <main className="grid min-h-svh place-items-center p-6">
      <Empty className="max-w-lg border">
        <EmptyHeader>
          <EmptyTitle>TaskBoard pronto para crescer</EmptyTitle>
          <EmptyDescription>
            A arquitetura frontend está configurada. As features de tarefas,
            categorias e compartilhamento serão implementadas nas próximas
            etapas.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </main>
  )
}
