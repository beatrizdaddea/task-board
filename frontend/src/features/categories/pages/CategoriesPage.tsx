import {
  AlertCircleIcon,
  CheckCircle2Icon,
  ClipboardListIcon,
  LogOutIcon,
  PlusIcon,
} from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'

import { getCategoryDeleteErrorMessage } from '@/features/categories/api/categoryErrors'
import { CategoryForm } from '@/features/categories/components/CategoryForm'
import { CategoryList } from '@/features/categories/components/CategoryList'
import { useCategories } from '@/features/categories/hooks/useCategories'
import { useCategoryMutations } from '@/features/categories/hooks/useCategoryMutations'
import type { Category } from '@/features/categories/types/categoryTypes'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { Alert, AlertDescription } from '@/shared/components/ui/alert'
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
import { Button } from '@/shared/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { Spinner } from '@/shared/components/ui/spinner'

export function CategoriesPage() {
  const { logout } = useAuth()
  const categoriesQuery = useCategories()
  const { deleteCategory } = useCategoryMutations()
  const [formCategory, setFormCategory] = useState<Category | null | undefined>(
    undefined,
  )
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(
    null,
  )
  const [notice, setNotice] = useState<{
    kind: 'success' | 'error'
    message: string
  } | null>(null)

  const confirmDelete = async () => {
    if (!categoryToDelete) return

    try {
      await deleteCategory.mutateAsync(categoryToDelete.id)
      setCategoryToDelete(null)
      setNotice({
        kind: 'success',
        message: 'Categoria excluída com sucesso.',
      })
    } catch (error: unknown) {
      setCategoryToDelete(null)
      setNotice({
        kind: 'error',
        message: getCategoryDeleteErrorMessage(error),
      })
    }
  }

  const finishForm = (message: string) => {
    setFormCategory(undefined)
    setNotice({ kind: 'success', message })
  }

  return (
    <main className="min-h-svh px-4 py-6 sm:px-6">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-muted-foreground text-sm">TaskBoard</p>
            <h1 className="text-2xl font-semibold tracking-tight">
              Minhas categorias
            </h1>
          </div>
          <nav
            className="flex flex-wrap items-center gap-2"
            aria-label="Navegação principal"
          >
            <Button
              nativeButton={false}
              variant="outline"
              render={<Link to="/dashboard" />}
            >
              <ClipboardListIcon data-icon="inline-start" /> Tarefas
            </Button>
            <Button type="button" variant="outline" onClick={logout}>
              <LogOutIcon data-icon="inline-start" /> Sair
            </Button>
          </nav>
        </header>

        <section
          className="flex flex-col gap-6"
          aria-labelledby="categories-heading"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 id="categories-heading" className="text-xl font-semibold">
                Categorias
              </h2>
              <p className="text-muted-foreground text-sm">
                Organize as tarefas em grupos fáceis de encontrar.
              </p>
            </div>
            <Button type="button" onClick={() => setFormCategory(null)}>
              <PlusIcon data-icon="inline-start" /> Nova categoria
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

          <CategoryList
            categories={categoriesQuery.data}
            isLoading={categoriesQuery.isLoading}
            isError={categoriesQuery.isError}
            onRetry={() => void categoriesQuery.refetch()}
            onCreate={() => setFormCategory(null)}
            onEdit={setFormCategory}
            onDelete={setCategoryToDelete}
          />
        </section>
      </div>

      <Dialog
        open={formCategory !== undefined}
        onOpenChange={(open) => !open && setFormCategory(undefined)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {formCategory ? 'Editar categoria' : 'Nova categoria'}
            </DialogTitle>
            <DialogDescription>
              {formCategory
                ? 'Atualize o nome da categoria selecionada.'
                : 'Informe um nome para organizar suas tarefas.'}
            </DialogDescription>
          </DialogHeader>
          <CategoryForm
            key={formCategory?.id ?? 'new'}
            category={formCategory ?? undefined}
            onCancel={() => setFormCategory(undefined)}
            onSuccess={finishForm}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(categoryToDelete)}
        onOpenChange={(open) => !open && setCategoryToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir categoria?</AlertDialogTitle>
            <AlertDialogDescription>
              “{categoryToDelete?.name}” será removida. As tarefas não serão
              excluídas automaticamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteCategory.isPending}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              type="button"
              variant="destructive"
              disabled={deleteCategory.isPending}
              onClick={() => void confirmDelete()}
            >
              {deleteCategory.isPending ? (
                <Spinner data-icon="inline-start" />
              ) : null}
              {deleteCategory.isPending ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  )
}
