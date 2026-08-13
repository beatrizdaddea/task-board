import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircleIcon } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

import { getAuthErrorMessage } from '@/features/auth/api/authErrors'
import { useLogin } from '@/features/auth/hooks/useLogin'
import {
  loginSchema,
  type LoginInput,
} from '@/features/auth/schemas/authSchemas'
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
  const loginMutation = useLogin()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '' },
  })

  const submitLogin = handleSubmit(async (credentials) => {
    setSubmitError(null)

    try {
      await loginMutation.mutateAsync(credentials)
      onSuccess()
    } catch (error: unknown) {
      setSubmitError(getAuthErrorMessage(error))
    }
  })

  return (
    <form className="flex flex-col gap-5" onSubmit={submitLogin} noValidate>
      <FieldGroup>
        <Field data-invalid={Boolean(errors.username)}>
          <FieldLabel htmlFor="username">Nome de usuário</FieldLabel>
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

      {submitError ? (
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      ) : null}

      <Button
        type="submit"
        size="lg"
        disabled={loginMutation.isPending}
        data-testid="login-submit"
      >
        {loginMutation.isPending ? <Spinner data-icon="inline-start" /> : null}
        {loginMutation.isPending ? 'Entrando...' : 'Entrar'}
      </Button>
    </form>
  )
}
