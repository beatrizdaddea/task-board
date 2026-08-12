import {
  CalendarIcon,
  CheckIcon,
  PencilIcon,
  RotateCcwIcon,
  Share2Icon,
  Trash2Icon,
} from 'lucide-react'

import type { Task } from '@/features/tasks/types/taskTypes'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card'
import { Spinner } from '@/shared/components/ui/spinner'

const priorityLabels = { low: 'Baixa', medium: 'Média', high: 'Alta' } as const

type TaskCardProps = {
  task: Task
  categoryName?: string
  isChangingStatus: boolean
  onEdit: (task: Task) => void
  onToggleStatus: (task: Task) => void
  onDelete: (task: Task) => void
}

export function TaskCard({
  task,
  categoryName,
  isChangingStatus,
  onEdit,
  onToggleStatus,
  onDelete,
}: TaskCardProps) {
  const canEdit = task.permissions.can_edit
  const canDelete = task.permissions.can_delete
  const canChangeStatus = task.permissions.can_change_status

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={task.completed ? 'secondary' : 'outline'}>
            {task.completed ? 'Concluída' : 'Em aberto'}
          </Badge>
          <Badge
            variant={task.priority === 'high' ? 'destructive' : 'secondary'}
          >
            {priorityLabels[task.priority]}
          </Badge>
          {(categoryName ?? task.category_name) ? (
            <Badge variant="outline">
              {categoryName ?? task.category_name}
            </Badge>
          ) : null}
        </div>
        <CardTitle
          className={
            task.completed ? 'text-muted-foreground line-through' : undefined
          }
        >
          {task.title}
        </CardTitle>
        {task.description ? (
          <CardDescription className="line-clamp-3">
            {task.description}
          </CardDescription>
        ) : null}
      </CardHeader>

      <CardContent className="mt-auto flex flex-wrap items-center gap-3 text-sm">
        {task.due_date ? (
          <span className="text-muted-foreground flex items-center gap-1.5">
            <CalendarIcon />
            {new Intl.DateTimeFormat('pt-BR').format(
              new Date(`${task.due_date}T00:00:00`),
            )}
          </span>
        ) : null}
        {task.is_shared ? (
          <span className="text-muted-foreground flex items-center gap-1.5">
            <Share2Icon /> Compartilhada
          </span>
        ) : null}
      </CardContent>

      <CardFooter className="flex flex-wrap gap-2">
        {canChangeStatus ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isChangingStatus}
            onClick={() => onToggleStatus(task)}
          >
            {isChangingStatus ? (
              <Spinner data-icon="inline-start" />
            ) : task.completed ? (
              <RotateCcwIcon data-icon="inline-start" />
            ) : (
              <CheckIcon data-icon="inline-start" />
            )}
            {task.completed ? 'Reabrir' : 'Concluir'}
          </Button>
        ) : null}
        {canEdit ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onEdit(task)}
          >
            <PencilIcon data-icon="inline-start" /> Editar
          </Button>
        ) : null}
        {canDelete ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onDelete(task)}
          >
            <Trash2Icon data-icon="inline-start" /> Excluir
          </Button>
        ) : null}
      </CardFooter>
    </Card>
  )
}
