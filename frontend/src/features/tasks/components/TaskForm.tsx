import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircleIcon } from 'lucide-react'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'

import type { Category } from '@/features/categories/types/categoryTypes'
import { useTaskMutations } from '@/features/tasks/hooks/useTaskMutations'
import {
  taskSchema,
  type TaskFormInput,
} from '@/features/tasks/schemas/taskSchemas'
import type { Task } from '@/features/tasks/types/taskTypes'
import { Alert, AlertDescription } from '@/shared/components/ui/alert'
import { Button } from '@/shared/components/ui/button'
import {
  Field,
  FieldDescription,
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
import { Textarea } from '@/shared/components/ui/textarea'
import { ApiError } from '@/shared/lib/http/ApiError'

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Baixa' },
  { value: 'medium', label: 'Média' },
  { value: 'high', label: 'Alta' },
] as const

type TaskFormProps = {
  task?: Task
  defaultCategoryId?: string
  categories: Category[]
  categoriesLoading: boolean
  onCancel: () => void
  onSuccess: (action: 'created' | 'updated') => void
}

function defaultValues(task?: Task, defaultCategoryId?: string): TaskFormInput {
  return {
    title: task?.title ?? '',
    description: task?.description ?? '',
    category: task?.category
      ? String(task.category)
      : (defaultCategoryId ?? ''),
    priority: task?.priority ?? 'medium',
    due_date: task?.due_date ?? '',
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export function TaskForm({
  task,
  defaultCategoryId,
  categories,
  categoriesLoading,
  onCancel,
  onSuccess,
}: TaskFormProps) {
  const { createTask, updateTask } = useTaskMutations()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const validDefaultCategoryId = categories.some(
    (category) => String(category.id) === defaultCategoryId,
  )
    ? defaultCategoryId
    : undefined
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<TaskFormInput>({
    resolver: zodResolver(taskSchema),
    defaultValues: defaultValues(task, validDefaultCategoryId),
  })
  const mutation = task ? updateTask : createTask
  const categoryOptions = [
    ...(task?.category &&
    !categories.some((category) => category.id === task.category)
      ? [
          {
            value: String(task.category),
            label: task.category_name ?? 'Categoria da tarefa',
          },
        ]
      : []),
    ...categories.map((category) => ({
      value: String(category.id),
      label: category.name,
    })),
  ]
  const hasCategoryOptions = categoryOptions.length > 0
  const categoryPlaceholder = categoriesLoading
    ? 'Carregando categorias...'
    : hasCategoryOptions
      ? 'Selecione uma categoria'
      : 'Nenhuma categoria cadastrada'

  const submitTask = handleSubmit(async (values) => {
    setSubmitError(null)
    try {
      if (task) {
        await updateTask.mutateAsync({ task, values })
      } else {
        await createTask.mutateAsync(values)
      }
      onSuccess(task ? 'updated' : 'created')
    } catch (error: unknown) {
      if (error instanceof ApiError && isRecord(error.details)) {
        const fieldNames: Array<keyof TaskFormInput> = [
          'title',
          'description',
          'category',
          'priority',
          'due_date',
        ]
        let hasFieldError = false
        for (const fieldName of fieldNames) {
          const detail = error.details[fieldName]
          const message = Array.isArray(detail) ? detail[0] : detail
          if (typeof message === 'string') {
            setError(fieldName, { message })
            hasFieldError = true
          }
        }
        if (hasFieldError) return
      }
      setSubmitError(
        error instanceof Error
          ? error.message
          : 'Não foi possível salvar a tarefa.',
      )
    }
  })

  return (
    <form className="flex flex-col gap-5" onSubmit={submitTask} noValidate>
      <FieldGroup>
        <Field data-invalid={Boolean(errors.title)}>
          <FieldLabel htmlFor="task-title">Título</FieldLabel>
          <Input
            id="task-title"
            autoFocus
            aria-invalid={Boolean(errors.title)}
            {...register('title')}
          />
          <FieldError errors={[errors.title]} />
        </Field>

        <Field data-invalid={Boolean(errors.description)}>
          <FieldLabel htmlFor="task-description">Descrição</FieldLabel>
          <Textarea
            id="task-description"
            rows={4}
            aria-invalid={Boolean(errors.description)}
            {...register('description')}
          />
          <FieldError errors={[errors.description]} />
        </Field>

        <Controller
          name="category"
          control={control}
          render={({ field }) => (
            <Field
              data-invalid={Boolean(errors.category)}
              data-disabled={categoriesLoading || !hasCategoryOptions}
            >
              <FieldLabel htmlFor="task-category-field">Categoria</FieldLabel>
              <Select
                items={categoryOptions}
                value={field.value}
                onValueChange={(value) => field.onChange(value ?? '')}
                disabled={
                  categoriesLoading ||
                  !hasCategoryOptions ||
                  (task ? !task.permissions.can_edit_category : false)
                }
              >
                <SelectTrigger
                  id="task-category-field"
                  className="w-full"
                  aria-invalid={Boolean(errors.category)}
                >
                  <SelectValue placeholder={categoryPlaceholder}>
                    {(selectedValue: string | null) =>
                      categoryOptions.find(
                        (option) => option.value === selectedValue,
                      )?.label ?? categoryPlaceholder
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {categoryOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              {!categoriesLoading && !hasCategoryOptions ? (
                <FieldDescription>
                  Crie uma categoria antes de cadastrar uma tarefa.
                </FieldDescription>
              ) : null}
              <FieldError errors={[errors.category]} />
            </Field>
          )}
        />

        <Controller
          name="priority"
          control={control}
          render={({ field }) => (
            <Field data-invalid={Boolean(errors.priority)}>
              <FieldLabel htmlFor="task-priority-field">Prioridade</FieldLabel>
              <Select
                items={PRIORITY_OPTIONS}
                value={field.value}
                onValueChange={(value) => {
                  if (value !== null) field.onChange(value)
                }}
              >
                <SelectTrigger
                  id="task-priority-field"
                  className="w-full"
                  aria-invalid={Boolean(errors.priority)}
                >
                  <SelectValue placeholder="Selecione uma prioridade">
                    {(selectedValue: string | null) =>
                      PRIORITY_OPTIONS.find(
                        (option) => option.value === selectedValue,
                      )?.label ?? 'Selecione uma prioridade'
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {PRIORITY_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <FieldError errors={[errors.priority]} />
            </Field>
          )}
        />

        <Field data-invalid={Boolean(errors.due_date)}>
          <FieldLabel htmlFor="task-due-date">Data de vencimento</FieldLabel>
          <Input
            id="task-due-date"
            type="date"
            aria-invalid={Boolean(errors.due_date)}
            {...register('due_date')}
          />
          <FieldError errors={[errors.due_date]} />
        </Field>
      </FieldGroup>

      {!categoriesLoading && categories.length === 0 ? (
        <Alert>
          <AlertCircleIcon />
          <AlertDescription className="flex flex-col items-start gap-3">
            Nenhuma categoria cadastrada. Crie a primeira categoria para
            organizar suas tarefas.
            <Button
              nativeButton={false}
              variant="outline"
              size="sm"
              render={<Link to="/categories" />}
            >
              Criar categoria
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

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
        <Button
          type="submit"
          disabled={
            mutation.isPending || categoriesLoading || !hasCategoryOptions
          }
        >
          {mutation.isPending ? <Spinner data-icon="inline-start" /> : null}
          {mutation.isPending ? 'Salvando...' : 'Salvar tarefa'}
        </Button>
      </div>
    </form>
  )
}
