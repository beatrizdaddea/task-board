import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircleIcon } from 'lucide-react'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'

import { useShareMutations } from '@/features/sharing/hooks/useShareMutations'
import {
  createShareSchema,
  type CreateShareInput,
} from '@/features/sharing/schemas/shareSchemas'
import { SHARE_PERMISSION_OPTIONS } from '@/features/sharing/types/shareTypes'
import { Alert, AlertDescription } from '@/shared/components/ui/alert'
import { Button } from '@/shared/components/ui/button'
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/shared/components/ui/field'
import { Input } from '@/shared/components/ui/input'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import { Spinner } from '@/shared/components/ui/spinner'
import { ApiError } from '@/shared/lib/http/ApiError'

type ShareFormProps = {
  taskId: number
  onSuccess: () => void
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export function ShareForm({ taskId, onSuccess }: ShareFormProps) {
  const { createShare } = useShareMutations(taskId)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<CreateShareInput>({
    resolver: zodResolver(createShareSchema),
    defaultValues: { user_email: '', permission: 'read' },
  })

  const submitShare = handleSubmit(async (values) => {
    setSubmitError(null)
    try {
      await createShare.mutateAsync(values)
      reset()
      onSuccess()
    } catch (error: unknown) {
      if (error instanceof ApiError && isRecord(error.details)) {
        for (const fieldName of ['user_email', 'permission'] as const) {
          const detail = error.details[fieldName]
          const message = Array.isArray(detail) ? detail[0] : detail
          if (typeof message === 'string') {
            setError(fieldName, { message })
            return
          }
        }
      }
      setSubmitError(
        error instanceof Error
          ? error.message
          : 'Não foi possível compartilhar a tarefa.',
      )
    }
  })

  return (
    <form className="flex flex-col gap-4" onSubmit={submitShare} noValidate>
      <FieldGroup className="grid gap-4 sm:grid-cols-[1fr_10rem]">
        <Field data-invalid={Boolean(errors.user_email)}>
          <FieldLabel htmlFor="share-user-email">E-mail do usuário</FieldLabel>
          <Input
            id="share-user-email"
            type="email"
            autoComplete="email"
            placeholder="usuario@exemplo.com"
            aria-invalid={Boolean(errors.user_email)}
            {...register('user_email')}
          />
          <FieldError errors={[errors.user_email]} />
        </Field>

        <Controller
          name="permission"
          control={control}
          render={({ field }) => (
            <Field data-invalid={Boolean(errors.permission)}>
              <FieldLabel htmlFor="share-permission">Permissão</FieldLabel>
              <Select
                items={SHARE_PERMISSION_OPTIONS}
                value={field.value}
                onValueChange={(value) => {
                  if (value !== null) field.onChange(value)
                }}
              >
                <SelectTrigger
                  id="share-permission"
                  className="w-full"
                  aria-invalid={Boolean(errors.permission)}
                >
                  <SelectValue placeholder="Permissão">
                    {(value: string | null) =>
                      SHARE_PERMISSION_OPTIONS.find(
                        (option) => option.value === value,
                      )?.label ?? 'Permissão'
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {SHARE_PERMISSION_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <FieldError errors={[errors.permission]} />
            </Field>
          )}
        />
      </FieldGroup>

      {submitError ? (
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      ) : null}

      <Button
        type="submit"
        className="self-start"
        disabled={createShare.isPending}
      >
        {createShare.isPending ? <Spinner data-icon="inline-start" /> : null}
        {createShare.isPending ? 'Compartilhando...' : 'Compartilhar'}
      </Button>
    </form>
  )
}
