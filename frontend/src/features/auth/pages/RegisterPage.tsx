import { Link, useNavigate } from 'react-router-dom'

import { RegisterForm } from '@/features/auth/components/RegisterForm'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card'

export function RegisterPage() {
  const navigate = useNavigate()

  return (
    <main className="bg-muted/40 grid min-h-svh place-items-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Criar conta</CardTitle>
          <CardDescription>
            Cadastre seus dados para começar a organizar suas tarefas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RegisterForm
            onSuccess={() =>
              navigate('/login', {
                replace: true,
                state: { registered: true },
              })
            }
          />
        </CardContent>
        <CardFooter className="text-muted-foreground justify-center text-sm">
          Já possui uma conta?{' '}
          <Link
            to="/login"
            className="text-foreground font-medium underline underline-offset-4"
          >
            Entrar
          </Link>
        </CardFooter>
      </Card>
    </main>
  )
}
