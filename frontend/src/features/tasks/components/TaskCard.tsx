import {
  CalendarIcon,
  CheckIcon,
  MoreVerticalIcon,
  PencilIcon,
  Share2Icon,
  Trash2Icon,
} from 'lucide-react'

import type { Task, TaskPriority } from '@/features/tasks/types/taskTypes'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'
import { Spinner } from '@/shared/components/ui/spinner'
import { cn } from '@/shared/lib/utils'

const priorityLabels = { low: 'Baixa', medium: 'Média', high: 'Alta' } as const
const priorityDotClasses: Record<TaskPriority, string> = {
  low: 'bg-blue-500',
  medium: 'bg-amber-500',
  high: 'bg-red-500',
}

type TaskCardProps = {
  task: Task
  categoryName?: string
  isChangingStatus: boolean
  onEdit: (task: Task) => void
  onToggleStatus: (task: Task) => void
  onDelete: (task: Task) => void
  onShare: (task: Task) => void
}

export function TaskCard({
  task,
  categoryName,
  isChangingStatus,
  onEdit,
  onToggleStatus,
  onDelete,
  onShare,
}: TaskCardProps) {
  const canEdit = task.permissions.can_edit
  const canDelete = task.permissions.can_delete
  const canChangeStatus = task.permissions.can_change_status
  const canViewShares = task.permissions.can_view_shares
  const hasSecondaryActions = canEdit || canViewShares || canDelete
  const categoryLabel = categoryName ?? task.category_name

  return (
    <Card className="h-full min-w-0 gap-3 py-3 transition-shadow hover:shadow-sm">
      <CardHeader className="px-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge
            variant="outline"
            className={cn(
              'rounded-md px-2 text-[11px]',
              task.completed
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                : 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300',
            )}
          >
            {task.completed ? 'Concluída' : 'Em aberto'}
          </Badge>
          <Badge
            variant="secondary"
            className="gap-1.5 rounded-md px-2 text-[11px] font-normal"
          >
            <span
              aria-hidden="true"
              className={cn(
                'size-1.5 rounded-full',
                priorityDotClasses[task.priority],
              )}
            />
            {priorityLabels[task.priority]}
          </Badge>
          {categoryLabel ? (
            <Badge
              variant="outline"
              className="bg-muted/40 text-muted-foreground max-w-full rounded-md px-2 text-[11px] font-normal"
            >
              <span className="truncate">{categoryLabel}</span>
            </Badge>
          ) : null}
        </div>
      </CardHeader>

      <CardContent className="flex min-w-0 items-start gap-3 px-3">
        <StatusControl
          task={task}
          canChangeStatus={canChangeStatus}
          isChangingStatus={isChangingStatus}
          onToggleStatus={onToggleStatus}
        />

        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <CardTitle>
            <h3
              className={cn(
                'truncate text-sm leading-snug font-semibold',
                task.completed && 'text-muted-foreground line-through',
              )}
              title={task.title}
            >
              {task.title}
            </h3>
          </CardTitle>
          {task.description ? (
            <CardDescription className="line-clamp-1 text-xs">
              {task.description}
            </CardDescription>
          ) : null}
          <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-[11px]">
            <span className="flex items-center gap-1.5">
              <CalendarIcon className="size-3.5" />
              {task.due_date
                ? new Intl.DateTimeFormat('pt-BR').format(
                    new Date(`${task.due_date}T00:00:00`),
                  )
                : 'Sem prazo'}
            </span>
            {task.is_shared ? (
              <span className="flex items-center gap-1.5">
                <Share2Icon className="size-3.5" /> Compartilhada
              </span>
            ) : null}
          </div>
        </div>

        {hasSecondaryActions ? (
          <>
            <div className="hidden shrink-0 items-center gap-0.5 sm:flex">
              {canEdit ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="text-muted-foreground hover:text-foreground"
                  aria-label={`Editar ${task.title}`}
                  title="Editar"
                  onClick={() => onEdit(task)}
                >
                  <PencilIcon />
                </Button>
              ) : null}
              {canViewShares ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="text-muted-foreground hover:text-foreground"
                  aria-label={`Gerenciar compartilhamento de ${task.title}`}
                  title={
                    task.permissions.can_manage_shares
                      ? 'Compartilhar'
                      : 'Ver acessos'
                  }
                  onClick={() => onShare(task)}
                >
                  <Share2Icon />
                </Button>
              ) : null}
              {canDelete ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive focus-visible:text-destructive"
                  aria-label={`Excluir ${task.title}`}
                  title="Excluir"
                  onClick={() => onDelete(task)}
                >
                  <Trash2Icon />
                </Button>
              ) : null}
            </div>
            <TaskActionsMenu
              task={task}
              canEdit={canEdit}
              canDelete={canDelete}
              canViewShares={canViewShares}
              onEdit={onEdit}
              onDelete={onDelete}
              onShare={onShare}
            />
          </>
        ) : null}
      </CardContent>
    </Card>
  )
}

type StatusControlProps = {
  task: Task
  canChangeStatus: boolean
  isChangingStatus: boolean
  onToggleStatus: (task: Task) => void
}

function StatusControl({
  task,
  canChangeStatus,
  isChangingStatus,
  onToggleStatus,
}: StatusControlProps) {
  if (!canChangeStatus) {
    return (
      <span
        className={cn(
          'mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border-2',
          task.completed
            ? 'border-primary bg-primary text-primary-foreground'
            : 'border-muted-foreground/40',
        )}
        aria-label={task.completed ? 'Tarefa concluída' : 'Tarefa em aberto'}
      >
        {task.completed ? <CheckIcon className="size-3.5" /> : null}
      </span>
    )
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      className={cn(
        'mt-0.5 size-6 shrink-0 rounded-full border-2',
        task.completed
          ? 'border-primary bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground'
          : 'border-muted-foreground/40 hover:border-primary hover:bg-transparent',
      )}
      disabled={isChangingStatus}
      aria-label={
        task.completed ? `Reabrir ${task.title}` : `Concluir ${task.title}`
      }
      title={task.completed ? 'Reabrir tarefa' : 'Concluir tarefa'}
      onClick={() => onToggleStatus(task)}
    >
      {isChangingStatus ? <Spinner /> : task.completed ? <CheckIcon /> : null}
    </Button>
  )
}

type TaskActionsMenuProps = {
  task: Task
  canEdit: boolean
  canDelete: boolean
  canViewShares: boolean
  onEdit: (task: Task) => void
  onDelete: (task: Task) => void
  onShare: (task: Task) => void
}

function TaskActionsMenu({
  task,
  canEdit,
  canDelete,
  canViewShares,
  onEdit,
  onDelete,
  onShare,
}: TaskActionsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="shrink-0 sm:hidden"
            aria-label={`Mais opções para ${task.title}`}
            title="Mais opções"
          />
        }
      >
        <MoreVerticalIcon />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-40">
        {canEdit || canViewShares ? (
          <DropdownMenuGroup>
            {canEdit ? (
              <DropdownMenuItem onClick={() => onEdit(task)}>
                <PencilIcon /> Editar
              </DropdownMenuItem>
            ) : null}
            {canViewShares ? (
              <DropdownMenuItem onClick={() => onShare(task)}>
                <Share2Icon />
                {task.permissions.can_manage_shares
                  ? 'Compartilhar'
                  : 'Acessos'}
              </DropdownMenuItem>
            ) : null}
          </DropdownMenuGroup>
        ) : null}
        {canDelete && (canEdit || canViewShares) ? (
          <DropdownMenuSeparator />
        ) : null}
        {canDelete ? (
          <DropdownMenuGroup>
            <DropdownMenuItem
              variant="destructive"
              onClick={() => onDelete(task)}
            >
              <Trash2Icon /> Excluir
            </DropdownMenuItem>
          </DropdownMenuGroup>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
