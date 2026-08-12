import { PlusIcon, SearchIcon, SlidersHorizontalIcon } from 'lucide-react'

import type { StatusFilter } from '@/features/tasks/hooks/useTaskFilters'
import type { TaskPriority } from '@/features/tasks/types/taskTypes'
import { Button } from '@/shared/components/ui/button'
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
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/shared/components/ui/sheet'

type FilterOption<TValue extends string> = Readonly<{
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
  priority: 'all' | TaskPriority
  onSearchChange: (value: string) => void
  onStatusChange: (value: StatusFilter) => void
  onPriorityChange: (value: 'all' | TaskPriority) => void
  onCreate: () => void
}

export function TaskFilters(props: TaskFiltersProps) {
  return (
    <div className="flex items-end gap-2">
      <Field className="min-w-0 flex-1">
        <FieldLabel htmlFor="task-search" className="sr-only">
          Buscar tarefas
        </FieldLabel>
        <div className="relative">
          <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
          <Input
            id="task-search"
            type="search"
            value={props.search}
            onChange={(event) => props.onSearchChange(event.target.value)}
            placeholder="Buscar título ou descrição..."
            className="pl-8"
          />
        </div>
      </Field>

      <div className="lg:hidden">
        <Sheet>
          <SheetTrigger render={<Button variant="outline" />}>
            <SlidersHorizontalIcon data-icon="inline-start" />
            <span className="hidden sm:inline">Filtros</span>
            <span className="sr-only sm:hidden">Abrir filtros</span>
          </SheetTrigger>
          <SheetContent
            side="bottom"
            className="max-h-[85svh] rounded-t-2xl pb-[max(1rem,env(safe-area-inset-bottom))]"
          >
            <SheetHeader>
              <SheetTitle>Filtrar tarefas</SheetTitle>
              <SheetDescription>
                Refine a lista por status e prioridade.
              </SheetDescription>
            </SheetHeader>
            <div className="overflow-y-auto px-4">
              <TaskAdvancedFilters
                idPrefix="mobile"
                status={props.status}
                priority={props.priority}
                onStatusChange={props.onStatusChange}
                onPriorityChange={props.onPriorityChange}
              />
            </div>
            <SheetFooter>
              <SheetClose render={<Button />}>Ver tarefas</SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>

      <Button
        type="button"
        className="hidden shrink-0 lg:inline-flex"
        onClick={props.onCreate}
      >
        <PlusIcon data-icon="inline-start" />
        Nova tarefa
      </Button>
    </div>
  )
}

type TaskAdvancedFiltersProps = {
  idPrefix: 'mobile' | 'desktop'
  status: StatusFilter
  priority: 'all' | TaskPriority
  onStatusChange: (value: StatusFilter) => void
  onPriorityChange: (value: 'all' | TaskPriority) => void
}

export function TaskAdvancedFilters({
  idPrefix,
  status,
  priority,
  onStatusChange,
  onPriorityChange,
}: TaskAdvancedFiltersProps) {
  return (
    <FieldGroup>
      <FilterSelect
        id={`${idPrefix}-task-status`}
        label="Status"
        value={status}
        placeholder="Selecione o status"
        onValueChange={onStatusChange}
        options={STATUS_OPTIONS}
      />
      <FilterSelect
        id={`${idPrefix}-task-priority`}
        label="Prioridade"
        value={priority}
        placeholder="Selecione a prioridade"
        onValueChange={onPriorityChange}
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
