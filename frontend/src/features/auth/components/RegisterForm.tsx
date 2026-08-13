import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircleIcon } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

import { getApiFieldError } from '@/features/auth/api/authErrors'
import { useRegister } from '@/features/auth/hooks/useRegister'
import {
  registerSchema,
  type RegisterInput,
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

type RegisterFormProps = {
  onSuccess: () => void
}

const registerFields = ['username', 'email', 'password'] as const

export function RegisterForm({ onSuccess }: RegisterFormProps) {
  const registerMutation = useRegister()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      passwordConfirmation: '',
    },
  })

  const submitRegistration = handleSubmit(async (values) => {
    setSubmitError(null)
    const payload = {
      username: values.username,
      email: values.email,
      password: values.password,
    }

    try {
      await registerMutation.mutateAsync(payload)
      onSuccess()
    } catch (error: unknown) {
      let hasFieldError = false

      registerFields.forEach((field) => {
        const message = getApiFieldError(error, field)
        if (message) {
          hasFieldError = true
          setError(field, { type: 'server', message })
        }
      })

      if (!hasFieldError) {
        setSubmitError('Não foi possível criar sua conta. Tente novamente.')
      }
    }
  })

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={submitRegistration}
      data-testid="signup-form"
      noValidate
    >
      <FieldGroup>
        <Field data-invalid={Boolean(errors.username)}>
          <FieldLabel htmlFor="register-username">Nome de usuário</FieldLabel>
          <Input
            id="register-username"
            autoComplete="username"
            aria-invalid={Boolean(errors.username)}
            {...register('username')}
          />
          <FieldError
            data-testid="signup-username-error"
            errors={[errors.username]}
          />
        </Field>

        <Field data-invalid={Boolean(errors.email)}>
          <FieldLabel htmlFor="email">E-mail</FieldLabel>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            aria-invalid={Boolean(errors.email)}
            {...register('email')}
          />
          <FieldError
            data-testid="signup-email-error"
            errors={[errors.email]}
          />
        </Field>

        <Field data-invalid={Boolean(errors.password)}>
          <FieldLabel htmlFor="register-password">Senha</FieldLabel>
          <Input
            id="register-password"
            type="password"
            autoComplete="new-password"
            aria-invalid={Boolean(errors.password)}
            {...register('password')}
          />
          <FieldError
            data-testid="signup-password-error"
            errors={[errors.password]}
          />
        </Field>

        <Field data-invalid={Boolean(errors.passwordConfirmation)}>
          <FieldLabel htmlFor="password-confirmation">
            Confirmação de senha
          </FieldLabel>
          <Input
            id="password-confirmation"
            type="password"
            autoComplete="new-password"
            aria-invalid={Boolean(errors.passwordConfirmation)}
            {...register('passwordConfirmation')}
          />
          <FieldError
            data-testid="signup-password-confirmation-error"
            errors={[errors.passwordConfirmation]}
          />
        </Field>
      </FieldGroup>

      {submitError ? (
        <Alert variant="destructive" data-testid="signup-error">
          <AlertCircleIcon />
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      ) : null}

      <Button
        type="submit"
        size="lg"
        disabled={registerMutation.isPending}
        data-testid="signup-submit"
      >
        {registerMutation.isPending ? (
          <Spinner data-icon="inline-start" />
        ) : null}
        {registerMutation.isPending ? 'Criando conta...' : 'Criar conta'}
      </Button>
    </form>
  )
}
