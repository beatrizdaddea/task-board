import { SearchIcon } from 'lucide-react'

import type { Category } from '@/features/categories/types/categoryTypes'
import type { StatusFilter } from '@/features/tasks/hooks/useTaskFilters'
import type { TaskPriority } from '@/features/tasks/types/taskTypes'
import { Field, FieldGroup, FieldLabel } from '@/shared/components/ui/field'
import { Input } from '@/shared/components/ui/input'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'

type FilterOption<TValue extends string = string> = Readonly<{
  value: TValue
  label: string
}>

const STATUS_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'open', label: 'Em aberto' },
  { value: 'completed', label: 'Concluídas' },
] as const satisfies readonly FilterOption<StatusFilter>[]

const PRIORITY_OPTIONS = [
  { value: 'all', label: 'Todas' },
  { value: 'low', label: 'Baixa' },
  { value: 'medium', label: 'Média' },
  { value: 'high', label: 'Alta' },
] as const satisfies readonly FilterOption<'all' | TaskPriority>[]

type TaskFiltersProps = {
  search: string
  status: StatusFilter
  category: string
  priority: 'all' | TaskPriority
  categories: Category[]
  onSearchChange: (value: string) => void
  onStatusChange: (value: StatusFilter) => void
  onCategoryChange: (value: string) => void
  onPriorityChange: (value: 'all' | TaskPriority) => void
}

export function TaskFilters(props: TaskFiltersProps) {
  return (
    <FieldGroup className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <Field>
        <FieldLabel htmlFor="task-search">Buscar</FieldLabel>
        <div className="relative">
          <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
          <Input
            id="task-search"
            type="search"
            value={props.search}
            onChange={(event) => props.onSearchChange(event.target.value)}
            placeholder="Título ou descrição"
            className="pl-8"
          />
        </div>
      </Field>

      <FilterSelect
        id="task-status"
        label="Status"
        value={props.status}
        placeholder="Selecione o status"
        onValueChange={props.onStatusChange}
        options={STATUS_OPTIONS}
      />
      <FilterSelect
        id="task-category"
        label="Categoria"
        value={props.category}
        placeholder="Selecione a categoria"
        onValueChange={props.onCategoryChange}
        options={[
          { value: 'all', label: 'Todas' },
          ...props.categories.map((category) => ({
            value: String(category.id),
            label: category.name,
          })),
        ]}
      />
      <FilterSelect
        id="task-priority"
        label="Prioridade"
        value={props.priority}
        placeholder="Selecione a prioridade"
        onValueChange={props.onPriorityChange}
        options={PRIORITY_OPTIONS}
      />
    </FieldGroup>
  )
}

type FilterSelectProps<TValue extends string> = {
  id: string
  label: string
  value: TValue
  placeholder: string
  options: readonly FilterOption<TValue>[]
  onValueChange: (value: TValue) => void
}

function FilterSelect<TValue extends string>({
  id,
  label,
  value,
  placeholder,
  options,
  onValueChange,
}: FilterSelectProps<TValue>) {
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Select
        items={options}
        value={value}
        onValueChange={(nextValue) => {
          if (nextValue !== null) onValueChange(nextValue)
        }}
      >
        <SelectTrigger id={id} className="w-full">
          <SelectValue placeholder={placeholder}>
            {(selectedValue: TValue | null) =>
              options.find((option) => option.value === selectedValue)?.label ??
              placeholder
            }
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </Field>
  )
}
