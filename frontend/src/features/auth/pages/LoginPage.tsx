import { Navigate, useNavigate } from 'react-router-dom'

import { LoginForm } from '@/features/auth/components/LoginForm'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card'
import { tokenStorage } from '@/shared/lib/auth/tokenStorage'

export function LoginPage() {
  const navigate = useNavigate()

  if (tokenStorage.getAccessToken()) {
    return <Navigate to="/" replace />
  }

  return (
    <main className="bg-muted/40 grid min-h-svh place-items-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Entrar no TaskBoard</CardTitle>
          <CardDescription>
            Use suas credenciais para acessar suas tarefas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm onSuccess={() => navigate('/', { replace: true })} />
        </CardContent>
      </Card>
    </main>
  )
}
