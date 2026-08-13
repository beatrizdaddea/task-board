import { CheckCircle2Icon } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import { LoginForm } from '@/features/auth/components/LoginForm'
import { Alert, AlertDescription } from '@/shared/components/ui/alert'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card'

type LoginLocationState = {
  from?: { pathname?: string }
  registered?: boolean
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isLoginLocationState(value: unknown): value is LoginLocationState {
  if (!isRecord(value)) return false

  const from = value.from
  return (
    (value.registered === undefined || typeof value.registered === 'boolean') &&
    (from === undefined ||
      (isRecord(from) &&
        (from.pathname === undefined || typeof from.pathname === 'string')))
  )
}

function getSafeDestination(state: LoginLocationState | null) {
  const pathname = state?.from?.pathname
  return pathname?.startsWith('/') && !pathname.startsWith('//')
    ? pathname
    : '/dashboard'
}

export function LoginPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const state = isLoginLocationState(location.state) ? location.state : null
  const destination = getSafeDestination(state)

  return (
    <main className="bg-muted/40 grid min-h-svh place-items-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Entrar no TaskBoard</CardTitle>
          <CardDescription>
            Use seu nome de usuário e senha para acessar suas tarefas.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          {state?.registered ? (
            <Alert data-testid="registration-success">
              <CheckCircle2Icon />
              <AlertDescription>
                Conta criada. Entre com suas credenciais.
              </AlertDescription>
            </Alert>
          ) : null}
          <LoginForm
            onSuccess={() => navigate(destination, { replace: true })}
          />
        </CardContent>
        <CardFooter className="text-muted-foreground justify-center text-sm">
          Ainda não tem conta?{' '}
          <Link
            to="/register"
            className="text-foreground font-medium underline underline-offset-4"
          >
            Cadastre-se
          </Link>
        </CardFooter>
      </Card>
    </main>
  )
}
