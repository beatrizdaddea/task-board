import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircleIcon } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

import { useCategoryMutations } from '@/features/categories/hooks/useCategoryMutations'
import {
  categorySchema,
  type CategoryInput,
} from '@/features/categories/schemas/categorySchemas'
import type { Category } from '@/features/categories/types/categoryTypes'
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
import { ApiError } from '@/shared/lib/http/ApiError'

type CategoryFormProps = {
  category?: Category
  onCancel: () => void
  onSuccess: (action: 'created' | 'updated') => void
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export function CategoryForm({
  category,
  onCancel,
  onSuccess,
}: CategoryFormProps) {
  const { createCategory, updateCategory } = useCategoryMutations()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<CategoryInput>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: category?.name ?? '' },
  })
  const mutation = category ? updateCategory : createCategory

  const submitCategory = handleSubmit(async (values) => {
    setSubmitError(null)
    try {
      if (category) {
        await updateCategory.mutateAsync({ categoryId: category.id, values })
      } else {
        await createCategory.mutateAsync(values)
      }
      onSuccess(category ? 'updated' : 'created')
    } catch (error: unknown) {
      if (error instanceof ApiError && isRecord(error.details)) {
        const detail = error.details.name
        const message = Array.isArray(detail) ? detail[0] : detail
        if (typeof message === 'string') {
          setError('name', { message })
          return
        }
      }
      setSubmitError(
        error instanceof Error
          ? error.message
          : 'Não foi possível salvar a categoria.',
      )
    }
  })

  return (
    <form className="flex flex-col gap-5" onSubmit={submitCategory} noValidate>
      <FieldGroup>
        <Field data-invalid={Boolean(errors.name)}>
          <FieldLabel htmlFor="category-name">Nome</FieldLabel>
          <Input
            id="category-name"
            autoFocus
            maxLength={100}
            autoComplete="off"
            aria-invalid={Boolean(errors.name)}
            {...register('name')}
          />
          <FieldError errors={[errors.name]} />
        </Field>
      </FieldGroup>

      {submitError ? (
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? <Spinner data-icon="inline-start" /> : null}
          {mutation.isPending ? 'Salvando...' : 'Salvar categoria'}
        </Button>
      </div>
    </form>
  )
}
