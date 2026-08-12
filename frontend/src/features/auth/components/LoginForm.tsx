import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircleIcon } from 'lucide-react'
import { useForm } from 'react-hook-form'

import {
  loginSchema,
  type LoginInput,
} from '@/features/auth/schemas/loginSchema'
import { useLoginMutation } from '@/features/auth/hooks/useLoginMutation'
import { Alert, AlertDescription } from '@/shared/components/ui/alert'
import { Button } from '@/shared/components/ui/button'
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/shared/components/ui/field'
import { Input } from '@/shared/components/ui/input'
import { Spinner } from '@/shared/components/ui/spinner'

type LoginFormProps = {
  onSuccess: () => void
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const loginMutation = useLoginMutation()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '' },
  })

  const submitLogin = handleSubmit(async (credentials) => {
    try {
      await loginMutation.mutateAsync(credentials)
      onSuccess()
    } catch {
      return
    }
  })

  return (
    <form className="flex flex-col gap-5" onSubmit={submitLogin} noValidate>
      <FieldGroup>
        <Field data-invalid={Boolean(errors.username)}>
          <FieldLabel htmlFor="username">Usuário</FieldLabel>
          <Input
            id="username"
            autoComplete="username"
            aria-invalid={Boolean(errors.username)}
            {...register('username')}
          />
          <FieldError errors={[errors.username]} />
        </Field>

        <Field data-invalid={Boolean(errors.password)}>
          <FieldLabel htmlFor="password">Senha</FieldLabel>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            aria-invalid={Boolean(errors.password)}
            {...register('password')}
          />
          <FieldError errors={[errors.password]} />
        </Field>
      </FieldGroup>

      {loginMutation.isError ? (
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertDescription>{loginMutation.error.message}</AlertDescription>
        </Alert>
      ) : null}

      <Button type="submit" size="lg" disabled={loginMutation.isPending}>
        {loginMutation.isPending ? <Spinner data-icon="inline-start" /> : null}
        {loginMutation.isPending ? 'Entrando...' : 'Entrar'}
      </Button>
    </form>
  )
}
