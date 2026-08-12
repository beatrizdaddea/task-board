import { LogOutIcon } from 'lucide-react'

import { useAuth } from '@/features/auth/hooks/useAuth'
import { Button } from '@/shared/components/ui/button'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/shared/components/ui/empty'

export function DashboardPage() {
  const { logout } = useAuth()

  return (
    <main className="min-h-svh p-6">
      <header className="mx-auto flex max-w-5xl items-center justify-between gap-4">
        <h1 className="text-xl font-semibold">TaskBoard</h1>
        <Button type="button" variant="outline" onClick={logout}>
          <LogOutIcon data-icon="inline-start" />
          Sair
        </Button>
      </header>

      <Empty className="mx-auto mt-16 max-w-2xl border">
        <EmptyHeader>
          <EmptyTitle>Dashboard autenticado</EmptyTitle>
          <EmptyDescription>
            Sua sessão JWT está ativa. As tarefas serão adicionadas nesta área
            em uma próxima etapa.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </main>
  )
}
