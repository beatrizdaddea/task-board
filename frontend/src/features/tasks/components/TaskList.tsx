import { AlertCircleIcon, ClipboardListIcon } from 'lucide-react'

import type { Category } from '@/features/categories/types/categoryTypes'
import { TaskCard } from '@/features/tasks/components/TaskCard'
import type { Task, TasksResponse } from '@/features/tasks/types/taskTypes'
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/shared/components/ui/alert'
import { Button } from '@/shared/components/ui/button'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/shared/components/ui/empty'
import { Skeleton } from '@/shared/components/ui/skeleton'

type TaskListProps = {
  data?: TasksResponse
  categories: Category[]
  isLoading: boolean
  isError: boolean
  changingTaskId?: number
  onRetry: () => void
  onCreate: () => void
  onEdit: (task: Task) => void
  onToggleStatus: (task: Task) => void
  onDelete: (task: Task) => void
  onShare: (task: Task) => void
}

const TASK_GRID_CLASSES = 'grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3'

export function TaskList(props: TaskListProps) {
  if (props.isLoading && !props.data) {
    return (
      <div className={TASK_GRID_CLASSES}>
        {Array.from({ length: 8 }, (_, index) => (
          <Skeleton key={index} className="h-40 w-full rounded-xl" />
        ))}
      </div>
    )
  }

  if (props.isError) {
    return (
      <Alert variant="destructive">
        <AlertCircleIcon />
        <AlertTitle>Não foi possível carregar as tarefas</AlertTitle>
        <AlertDescription className="flex flex-col items-start gap-3">
          Verifique sua conexão e tente novamente.
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={props.onRetry}
          >
            Tentar novamente
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  if (!props.data?.results.length) {
    return (
      <Empty className="border py-14">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <ClipboardListIcon />
          </EmptyMedia>
          <EmptyTitle>Nenhuma tarefa encontrada</EmptyTitle>
          <EmptyDescription>
            Ajuste os filtros ou crie uma nova tarefa para começar.
          </EmptyDescription>
        </EmptyHeader>
        <Button
          type="button"
          className="hidden lg:inline-flex"
          onClick={props.onCreate}
        >
          Nova tarefa
        </Button>
      </Empty>
    )
  }

  const categoryNames = new Map(
    props.categories.map((category) => [category.id, category.name]),
  )

  return (
    <div className={TASK_GRID_CLASSES}>
      {props.data.results.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          categoryName={
            task.category ? categoryNames.get(task.category) : undefined
          }
          isChangingStatus={props.changingTaskId === task.id}
          onEdit={props.onEdit}
          onToggleStatus={props.onToggleStatus}
          onDelete={props.onDelete}
          onShare={props.onShare}
        />
      ))}
    </div>
  )
}
