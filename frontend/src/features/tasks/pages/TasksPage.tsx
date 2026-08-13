import { AlertCircleIcon, LogOutIcon, PlusIcon } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'

import { useAuth } from '@/features/auth/hooks/useAuth'
import { useCategories } from '@/features/categories/hooks/useCategories'
import { NotificationsMenu } from '@/features/notifications/components/NotificationsMenu'
import { ShareDialog } from '@/features/sharing/components/ShareDialog'
import { TaskCategoryNav } from '@/features/tasks/components/TaskCategoryNav'
import {
  TaskAdvancedFilters,
  TaskFilters,
} from '@/features/tasks/components/TaskFilters'
import { TaskForm } from '@/features/tasks/components/TaskForm'
import { TaskList } from '@/features/tasks/components/TaskList'
import { useTaskCategoryCounts } from '@/features/tasks/hooks/useTaskCategoryCounts'
import { useTaskFilters } from '@/features/tasks/hooks/useTaskFilters'
import { useTaskMutations } from '@/features/tasks/hooks/useTaskMutations'
import { useTasks } from '@/features/tasks/hooks/useTasks'
import type { Task } from '@/features/tasks/types/taskTypes'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/components/ui/alert-dialog'
import { Alert, AlertDescription } from '@/shared/components/ui/alert'
import { Button, buttonVariants } from '@/shared/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from '@/shared/components/ui/pagination'
import { Separator } from '@/shared/components/ui/separator'
import { Spinner } from '@/shared/components/ui/spinner'
import { useToast } from '@/shared/hooks/useToast'
import { cn } from '@/shared/lib/utils'

const PAGE_SIZE = 10
const TOAST_DURATION = 2000

export function TasksPage() {
  const { add: showToast } = useToast()
  const { logout } = useAuth()
  const taskFilters = useTaskFilters()
  const tasksQuery = useTasks(taskFilters.filters)
  const categoriesQuery = useCategories()
  const { deleteTask, changeStatus } = useTaskMutations()
  const [formTask, setFormTask] = useState<Task | null | undefined>(undefined)
  const [newTaskCategoryId, setNewTaskCategoryId] = useState<
    string | undefined
  >()
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null)
  const [taskToShare, setTaskToShare] = useState<Task | null>(null)
  const categories = categoriesQuery.data ?? []
  const categoryCounts = useTaskCategoryCounts(
    categories.map((category) => category.id),
  )
  const isFormOpen = formTask !== undefined

  const openCreateForm = () => {
    setNewTaskCategoryId(
      taskFilters.category === 'all' ? undefined : taskFilters.category,
    )
    setFormTask(null)
  }

  const showError = (error: unknown) => {
    showToast({
      type: 'error',
      title: 'Não foi possível concluir a ação',
      description:
        error instanceof Error
          ? error.message
          : 'Não foi possível concluir a operação.',
      timeout: TOAST_DURATION,
    })
  }

  const toggleStatus = async (task: Task) => {
    try {
      await changeStatus.mutateAsync({
        taskId: task.id,
        completed: !task.completed,
      })
      showToast({
        type: 'info',
        title: task.completed ? 'Tarefa reaberta' : 'Tarefa concluída',
        description: task.completed
          ? 'A tarefa voltou para o status em aberto.'
          : 'A tarefa foi marcada como concluída.',
        timeout: TOAST_DURATION,
      })
    } catch (error: unknown) {
      showError(error)
    }
  }

  const confirmDelete = async () => {
    if (!taskToDelete) return
    try {
      await deleteTask.mutateAsync(taskToDelete.id)
      setTaskToDelete(null)
      showToast({
        type: 'info',
        title: 'Tarefa removida',
        description: 'Tarefa removida com sucesso!',
        timeout: TOAST_DURATION,
      })
    } catch (error: unknown) {
      setTaskToDelete(null)
      showError(error)
    }
  }

  const finishForm = (action: 'created' | 'updated') => {
    setFormTask(undefined)
    showToast({
      type: action === 'created' ? 'success' : 'info',
      title: action === 'created' ? 'Tarefa criada' : 'Tarefa atualizada',
      description:
        action === 'created'
          ? 'Tarefa criada com sucesso!'
          : 'Tarefa atualizada com sucesso!',
      timeout: TOAST_DURATION,
    })
  }

  const firstItem = tasksQuery.data?.count
    ? (taskFilters.page - 1) * PAGE_SIZE + 1
    : 0
  const lastItem = tasksQuery.data
    ? firstItem + tasksQuery.data.results.length - 1
    : 0

  return (
    <main
      className="min-h-svh px-4 pt-4 pb-24 sm:px-6 lg:py-6"
      data-testid="tasks-page"
    >
      <div className="mx-auto flex max-w-[1400px] flex-col gap-6">
        <header className="flex items-center justify-between gap-4 border-b pb-4">
          <div className="flex min-w-0 flex-col gap-1">
            <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
              TaskBoard
            </p>
            <h1 className="text-xl font-semibold tracking-tight whitespace-nowrap md:text-2xl">
              Minhas tarefas
            </h1>
            <p className="text-muted-foreground hidden text-sm sm:block">
              Organize prioridades, prazos e andamento em um só lugar.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <NotificationsMenu />
            <Button
              type="button"
              className="text-muted-foreground hover:text-destructive"
              variant="ghost"
              size="sm"
              data-testid="logout"
              onClick={logout}
            >
              <LogOutIcon data-icon="inline-start" /> Sair
            </Button>
          </div>
        </header>

        {categoriesQuery.isError ? (
          <Alert variant="destructive">
            <AlertCircleIcon />
            <AlertDescription className="flex flex-col items-start gap-3">
              Não foi possível carregar as categorias. O filtro por categoria
              está temporariamente indisponível.
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void categoriesQuery.refetch()}
              >
                Tentar novamente
              </Button>
            </AlertDescription>
          </Alert>
        ) : null}

        <section
          className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8"
          aria-labelledby="tasks-heading"
        >
          <aside className="lg:bg-card flex flex-col gap-4 lg:sticky lg:top-6 lg:col-span-3 lg:self-start lg:rounded-xl lg:border lg:p-4 lg:shadow-sm">
            <div className="flex items-center justify-between gap-2 lg:px-2">
              <h2 className="text-muted-foreground text-sm font-semibold lg:text-xs lg:tracking-wider lg:uppercase">
                Categorias
              </h2>
              <Link
                to="/categories"
                className={buttonVariants({ variant: 'ghost', size: 'sm' })}
              >
                Gerenciar
              </Link>
            </div>
            <TaskCategoryNav
              categories={categories}
              selectedCategory={taskFilters.category}
              total={categoryCounts.total}
              counts={categoryCounts.counts}
              isLoading={categoriesQuery.isLoading || categoryCounts.isLoading}
              onCategoryChange={taskFilters.setCategory}
            />
            <div className="hidden flex-col gap-4 lg:flex">
              <Separator />
              <div className="flex flex-col gap-3">
                <h3 className="text-muted-foreground text-xs font-semibold lg:px-2 lg:tracking-wider lg:uppercase">
                  Filtros avançados
                </h3>
                <TaskAdvancedFilters
                  idPrefix="desktop"
                  status={taskFilters.status}
                  priority={taskFilters.priority}
                  onStatusChange={taskFilters.setStatus}
                  onPriorityChange={taskFilters.setPriority}
                />
              </div>
            </div>
          </aside>

          <div className="flex min-w-0 flex-col gap-4 lg:col-span-9">
            <h2 id="tasks-heading" className="sr-only">
              Lista de tarefas
            </h2>
            <TaskFilters
              search={taskFilters.searchInput}
              status={taskFilters.status}
              priority={taskFilters.priority}
              onSearchChange={taskFilters.setSearchInput}
              onStatusChange={taskFilters.setStatus}
              onPriorityChange={taskFilters.setPriority}
              onCreate={openCreateForm}
            />

            <div
              data-testid="tasks-list-region"
              data-loading={tasksQuery.isFetching}
              className={cn(
                tasksQuery.isFetching && 'opacity-70 transition-opacity',
              )}
            >
              <TaskList
                data={tasksQuery.data}
                categories={categories}
                isLoading={tasksQuery.isLoading}
                isError={tasksQuery.isError}
                changingTaskId={
                  changeStatus.isPending
                    ? changeStatus.variables?.taskId
                    : undefined
                }
                onRetry={() => void tasksQuery.refetch()}
                onCreate={openCreateForm}
                onEdit={setFormTask}
                onToggleStatus={(task) => void toggleStatus(task)}
                onDelete={setTaskToDelete}
                onShare={setTaskToShare}
              />
            </div>

            {tasksQuery.data && tasksQuery.data.count > 0 ? (
              <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
                <p className="text-muted-foreground text-sm" aria-live="polite">
                  Mostrando {firstItem}–{lastItem} de {tasksQuery.data.count}{' '}
                  tarefas
                </p>
                <Pagination className="mx-0 w-auto">
                  <PaginationContent>
                    <PaginationItem>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={
                          !tasksQuery.data.previous || tasksQuery.isFetching
                        }
                        onClick={() =>
                          taskFilters.setPage((page) => Math.max(1, page - 1))
                        }
                      >
                        Anterior
                      </Button>
                    </PaginationItem>
                    <PaginationItem>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={
                          !tasksQuery.data.next || tasksQuery.isFetching
                        }
                        onClick={() => taskFilters.setPage((page) => page + 1)}
                      >
                        Próximo
                      </Button>
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            ) : null}
          </div>
        </section>
      </div>

      <Button
        type="button"
        size="icon"
        className="fixed right-6 bottom-[max(1.5rem,env(safe-area-inset-bottom))] z-50 size-14 rounded-full shadow-xl lg:hidden"
        aria-label="Criar nova tarefa"
        title="Nova tarefa"
        onClick={openCreateForm}
      >
        <PlusIcon />
      </Button>

      <Dialog
        open={isFormOpen}
        onOpenChange={(open) => !open && setFormTask(undefined)}
      >
        <DialogContent className="max-h-[calc(100svh-2rem)] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {formTask ? 'Editar tarefa' : 'Nova tarefa'}
            </DialogTitle>
            <DialogDescription>
              {formTask
                ? 'Atualize os dados da tarefa selecionada.'
                : 'Preencha os campos para adicionar uma tarefa.'}
            </DialogDescription>
          </DialogHeader>
          <TaskForm
            key={formTask?.id ?? `new-${newTaskCategoryId ?? 'none'}`}
            task={formTask ?? undefined}
            defaultCategoryId={newTaskCategoryId}
            categories={categories}
            categoriesLoading={categoriesQuery.isLoading}
            onCancel={() => setFormTask(undefined)}
            onSuccess={finishForm}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(taskToDelete)}
        onOpenChange={(open) => !open && setTaskToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir tarefa?</AlertDialogTitle>
            <AlertDialogDescription>
              “{taskToDelete?.title}” será removida permanentemente. Essa ação
              não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteTask.isPending}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              type="button"
              data-testid="confirm-delete-task"
              variant="destructive"
              disabled={deleteTask.isPending}
              onClick={() => void confirmDelete()}
            >
              {deleteTask.isPending ? (
                <Spinner data-icon="inline-start" />
              ) : null}
              {deleteTask.isPending ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {taskToShare ? (
        <ShareDialog
          key={taskToShare.id}
          task={taskToShare}
          open
          onOpenChange={(open) => !open && setTaskToShare(null)}
        />
      ) : null}
    </main>
  )
}
