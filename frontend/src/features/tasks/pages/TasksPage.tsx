import {
  AlertCircleIcon,
  CheckCircle2Icon,
  TagsIcon,
  LogOutIcon,
  PlusIcon,
} from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'

import { useAuth } from '@/features/auth/hooks/useAuth'
import { useCategories } from '@/features/categories/hooks/useCategories'
import { ShareDialog } from '@/features/sharing/components/ShareDialog'
import { TaskFilters } from '@/features/tasks/components/TaskFilters'
import { TaskForm } from '@/features/tasks/components/TaskForm'
import { TaskList } from '@/features/tasks/components/TaskList'
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
import { Button } from '@/shared/components/ui/button'
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
import { Spinner } from '@/shared/components/ui/spinner'

const PAGE_SIZE = 10

export function TasksPage() {
  const { logout } = useAuth()
  const taskFilters = useTaskFilters()
  const tasksQuery = useTasks(taskFilters.filters)
  const categoriesQuery = useCategories()
  const { deleteTask, changeStatus } = useTaskMutations()
  const [formTask, setFormTask] = useState<Task | null | undefined>(undefined)
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null)
  const [taskToShare, setTaskToShare] = useState<Task | null>(null)
  const [notice, setNotice] = useState<{
    kind: 'success' | 'error'
    message: string
  } | null>(null)
  const categories = categoriesQuery.data ?? []
  const isFormOpen = formTask !== undefined

  const showError = (error: unknown) => {
    setNotice({
      kind: 'error',
      message:
        error instanceof Error
          ? error.message
          : 'Não foi possível concluir a operação.',
    })
  }

  const toggleStatus = async (task: Task) => {
    setNotice(null)
    try {
      await changeStatus.mutateAsync({
        taskId: task.id,
        completed: !task.completed,
      })
      setNotice({
        kind: 'success',
        message: task.completed ? 'Tarefa reaberta.' : 'Tarefa concluída.',
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
      setNotice({ kind: 'success', message: 'Tarefa excluída com sucesso.' })
    } catch (error: unknown) {
      setTaskToDelete(null)
      showError(error)
    }
  }

  const finishForm = (message: string) => {
    setFormTask(undefined)
    setNotice({ kind: 'success', message })
  }

  const firstItem = tasksQuery.data?.count
    ? (taskFilters.page - 1) * PAGE_SIZE + 1
    : 0
  const lastItem = tasksQuery.data
    ? firstItem + tasksQuery.data.results.length - 1
    : 0

  return (
    <main className="min-h-svh px-4 py-6 sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="flex items-center justify-between gap-4">
          <div>
            <p className="text-muted-foreground text-sm">TaskBoard</p>
            <h1 className="text-2xl font-semibold tracking-tight">
              Minhas tarefas
            </h1>
          </div>
          <nav
            className="flex flex-wrap items-center gap-2"
            aria-label="Navegação principal"
          >
            <Button
              nativeButton={false}
              variant="outline"
              render={<Link to="/categories" />}
            >
              <TagsIcon data-icon="inline-start" /> Categorias
            </Button>
            <Button type="button" variant="outline" onClick={logout}>
              <LogOutIcon data-icon="inline-start" /> Sair
            </Button>
          </nav>
        </header>

        <section
          className="flex flex-col gap-6"
          aria-labelledby="tasks-heading"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 id="tasks-heading" className="text-xl font-semibold">
                Tarefas
              </h2>
              <p className="text-muted-foreground text-sm">
                Organize prioridades, prazos e andamento em um só lugar.
              </p>
            </div>
            <Button type="button" onClick={() => setFormTask(null)}>
              <PlusIcon data-icon="inline-start" /> Nova tarefa
            </Button>
          </div>

          {notice ? (
            <Alert
              variant={notice.kind === 'error' ? 'destructive' : 'default'}
            >
              {notice.kind === 'error' ? (
                <AlertCircleIcon />
              ) : (
                <CheckCircle2Icon />
              )}
              <AlertDescription>{notice.message}</AlertDescription>
            </Alert>
          ) : null}

          {categoriesQuery.isError ? (
            <Alert variant="destructive">
              <AlertCircleIcon />
              <AlertDescription className="flex flex-col items-start gap-3">
                Não foi possível carregar as categorias. O cadastro e o filtro
                por categoria estão temporariamente indisponíveis.
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

          <TaskFilters
            search={taskFilters.searchInput}
            status={taskFilters.status}
            category={taskFilters.category}
            priority={taskFilters.priority}
            categories={categories}
            onSearchChange={taskFilters.setSearchInput}
            onStatusChange={taskFilters.setStatus}
            onCategoryChange={taskFilters.setCategory}
            onPriorityChange={taskFilters.setPriority}
          />

          <div
            className={
              tasksQuery.isFetching
                ? 'opacity-70 transition-opacity'
                : undefined
            }
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
              onCreate={() => setFormTask(null)}
              onEdit={(task) => setFormTask(task)}
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
                      disabled={!tasksQuery.data.next || tasksQuery.isFetching}
                      onClick={() => taskFilters.setPage((page) => page + 1)}
                    >
                      Próximo
                    </Button>
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          ) : null}
        </section>
      </div>

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
            key={formTask?.id ?? 'new'}
            task={formTask ?? undefined}
            categories={categories}
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
